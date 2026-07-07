"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InboxIcon } from "lucide-react";
import { toast } from "sonner";

import { CollectionCard } from "@/components/app/CollectionCard";
import { PayoutCard } from "@/components/app/PayoutCard";
import { Button } from "@/components/ui/Button";
import type { CollectionVirtualAccount, PayoutRecord } from "@/lib/backend/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReconciliationCycle {
  groupId: string;
  groupName: string;
  round: number;
  collections: CollectionVirtualAccount[];
  payout: PayoutRecord | null;
  allPaid: boolean;
  potTotal: number;
}

interface ReconciliationResponse {
  cycles: ReconciliationCycle[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derives a display name from a memberId, e.g. "mem_maria" → "Maria" */
function deriveMemberName(memberId: string): string {
  const withoutPrefix = memberId.replace(/^mem_/, "");
  return withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReconciliationPanel() {
  const [cycles, setCycles] = useState<ReconciliationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  /** Tracks which groupId:round combos have a payout in-flight */
  const [payoutLoading, setPayoutLoading] = useState<Record<string, boolean>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ── Polling ──────────────────────────────────────────────────────────────

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/reconciliation");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ReconciliationResponse = await res.json();
      if (mountedRef.current) {
        setCycles(data.cycles);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("[ReconciliationPanel] fetch error:", err);
        setLoading(false);
      }
    } finally {
      if (mountedRef.current) {
        timeoutRef.current = setTimeout(poll, 4000);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    poll();

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [poll]);

  // ── Send payout ──────────────────────────────────────────────────────────

  const handleSendPayout = async (cycle: ReconciliationCycle) => {
    const key = `${cycle.groupId}:${cycle.round}`;
    setPayoutLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch("/api/payments/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: cycle.groupId,
          memberId: "mem_maria",
          round: cycle.round,
          amountNgn: cycle.potTotal,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      toast.success("Payout initiated successfully!");

      // Immediately re-poll so UI reflects the new payout record
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      poll();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payout failed.";
      toast.error(message);
    } finally {
      setPayoutLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ── Retry payout (from PayoutCard) ───────────────────────────────────────

  const handleRetryPayout = async (cycle: ReconciliationCycle) => {
    await handleSendPayout(cycle);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-white/30 text-sm font-sans">
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading reconciliation data…
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (cycles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 gap-3"
      >
        <div className="w-12 h-12 rounded-2xl border border-white/8 glass flex items-center justify-center">
          <InboxIcon className="w-5 h-5 text-white/20" />
        </div>
        <p className="text-white/30 text-sm font-sans">No payment cycles yet.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence initial={false}>
        {cycles.map((cycle) => {
          const key = `${cycle.groupId}:${cycle.round}`;
          const isPayoutLoading = payoutLoading[key] ?? false;
          const showSendPayout = cycle.allPaid && cycle.payout === null;

          return (
            <motion.section
              key={key}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/8 glass p-4 space-y-4"
            >
              {/* Cycle heading */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-white/80 text-sm font-sans font-semibold">
                    {cycle.groupName}
                  </h3>
                  <p className="text-white/30 text-xs font-sans mt-0.5">
                    Round {cycle.round}
                  </p>
                </div>
                <span
                  className={`text-xs font-sans px-2 py-0.5 rounded-full flex-shrink-0 ${
                    cycle.allPaid
                      ? "bg-mint-400/15 text-mint-400"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {cycle.allPaid ? "All paid" : "In progress"}
                </span>
              </div>

              {/* Collection VAs */}
              {cycle.collections.length > 0 && (
                <div className="space-y-2">
                  {cycle.collections.map((va) => (
                    <CollectionCard
                      key={va.reference}
                      va={va}
                      memberName={deriveMemberName(va.memberId)}
                      amountNgn={cycle.potTotal / Math.max(cycle.collections.length, 1)}
                    />
                  ))}
                </div>
              )}

              {/* Payout record */}
              {cycle.payout && (
                <div className="pt-1">
                  <PayoutCard
                    record={cycle.payout}
                    memberName={deriveMemberName(cycle.payout.memberId)}
                    groupName={cycle.groupName}
                    onRetry={() => handleRetryPayout(cycle)}
                    retryLoading={isPayoutLoading}
                  />
                </div>
              )}

              {/* Send payout CTA */}
              <AnimatePresence>
                {showSendPayout && (
                  <motion.div
                    key="send-payout"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-1"
                  >
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      loading={isPayoutLoading}
                      onClick={() => handleSendPayout(cycle)}
                    >
                      Send Payout · ₦{cycle.potTotal.toLocaleString()}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
