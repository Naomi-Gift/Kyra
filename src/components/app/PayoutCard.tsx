"use client";
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import type { PayoutRecord } from "@/lib/backend/types";

interface PayoutCardProps {
  record: PayoutRecord;
  memberName: string;
  groupName: string;
  onRetry: () => void;
}

export function PayoutCard({ record, memberName, groupName, onRetry }: PayoutCardProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      color: "text-mint-400",
      bg: "border-mint-400/20 bg-mint-400/5",
      badge: "bg-mint-400/15 text-mint-400",
      label: "Confirmed",
    },
    failed: {
      icon: XCircle,
      color: "text-coral-400",
      bg: "border-coral-400/20 bg-coral-400/5",
      badge: "bg-coral-400/15 text-coral-400",
      label: "Failed",
    },
    pending: {
      icon: Clock,
      color: "text-gold-400",
      bg: "border-gold-400/15 glass",
      badge: "bg-gold-400/15 text-gold-400",
      label: "Pending",
    },
  };

  const cfg = statusConfig[record.status];
  const Icon = cfg.icon;
  const amountNgn = (record.amountKobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  });

  return (
    <motion.div
      layout
      className={`rounded-xl border p-3 ${cfg.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
          <div className="min-w-0">
            <p className="text-white/80 text-sm font-sans font-medium truncate">
              {groupName} · Round {record.round}
            </p>
            <p className="text-white/35 text-xs font-sans">→ {memberName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-xs font-sans px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className="text-white/60 text-sm font-mono font-medium">{amountNgn}</span>
        </div>
      </div>

      {record.status === "success" && record.nombaSessionId && (
        <p className="mt-2 text-white/20 text-[10px] font-mono">
          session: {record.nombaSessionId}
        </p>
      )}

      {record.status === "pending" && (
        <div className="mt-2 flex items-center gap-1.5 text-white/25 text-xs font-sans">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-3 h-3" />
          </motion.div>
          Processing…
        </div>
      )}

      {record.status === "failed" && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRetry}
          disabled={retrying}
          className="mt-3 w-full rounded-lg border border-coral-400/20 bg-coral-400/5 px-3 py-2 text-xs font-sans text-coral-400 hover:bg-coral-400/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {retrying ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw className="w-3 h-3" />
            </motion.div>
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {retrying ? "Retrying…" : "Retry Payout"}
        </motion.button>
      )}

      <p className="mt-1.5 text-white/15 text-[10px] font-mono truncate">ref: {record.reference}</p>
    </motion.div>
  );
}
