"use client";
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { PayoutRecord } from "@/lib/backend/types";
import { Button } from "@/components/ui/Button";

interface PayoutCardProps {
  record: PayoutRecord;
  memberName: string;
  groupName: string;
  onRetry: () => void;
  retryLoading?: boolean;
}

export function PayoutCard({
  record,
  memberName,
  groupName,
  onRetry,
  retryLoading = false,
}: PayoutCardProps) {
  const amountFormatted = `₦${(record.amountKobo / 100).toLocaleString()}`;

  // ── Success ────────────────────────────────────────────────────────────────
  if (record.status === "success") {
    const sessionId = record.nombaSessionId
      ? record.nombaSessionId.length > 20
        ? `${record.nombaSessionId.slice(0, 20)}…`
        : record.nombaSessionId
      : null;

    return (
      <motion.div
        layout
        className="rounded-xl border border-mint-400/20 bg-mint-400/5 p-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-mint-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white/80 text-sm font-sans font-medium truncate">
                {memberName}
              </p>
              <p className="text-white/35 text-xs font-sans truncate">{groupName}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-mint-400/15 text-mint-400">
              Confirmed
            </span>
            <span className="text-white/60 text-sm font-mono font-medium">
              {amountFormatted}
            </span>
          </div>
        </div>

        {sessionId && (
          <p className="mt-2 text-white/20 text-[10px] font-mono">
            session: {sessionId}
          </p>
        )}

        <p className="mt-1.5 text-white/15 text-[10px] font-sans">
          {new Date(record.createdAt).toLocaleString()}
        </p>
      </motion.div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (record.status === "failed") {
    return (
      <motion.div
        layout
        className="rounded-xl border border-coral-400/20 bg-coral-400/5 p-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <XCircle className="w-4 h-4 text-coral-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white/80 text-sm font-sans font-medium truncate">
                {memberName}
              </p>
              <p className="text-white/35 text-xs font-sans truncate">{groupName}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-coral-400/15 text-coral-400">
              Failed
            </span>
            <span className="text-white/60 text-sm font-mono font-medium">
              {amountFormatted}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <Button
            variant="danger"
            size="sm"
            fullWidth
            loading={retryLoading}
            onClick={onRetry}
          >
            <RefreshCw className="w-3 h-3" />
            Retry Payout
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Pending ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      className="rounded-xl border border-gold-400/15 glass p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className="w-4 h-4 text-gold-400 animate-spin flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-white/80 text-sm font-sans font-medium truncate">
              {memberName}
            </p>
            <p className="text-white/35 text-xs font-sans truncate">{groupName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-400">
            Pending
          </span>
          <span className="text-white/60 text-sm font-mono font-medium">
            {amountFormatted}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
