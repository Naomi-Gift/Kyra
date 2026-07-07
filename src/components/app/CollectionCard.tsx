"use client";
import { CheckCircle2, Circle, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { CollectionVirtualAccount } from "@/lib/backend/types";

interface CollectionCardProps {
  va: CollectionVirtualAccount;
  memberName: string;
  amountNgn: number;
}

export function CollectionCard({ va, memberName, amountNgn }: CollectionCardProps) {
  const paid = !!va.paidAt;

  const copyAccount = () => {
    navigator.clipboard.writeText(va.accountNumber);
    toast.success("Account number copied!");
  };

  return (
    <motion.div
      layout
      className={`rounded-xl border p-3 transition-colors ${
        paid
          ? "border-mint-400/20 bg-mint-400/5"
          : "border-white/8 glass"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <AnimatePresence mode="wait">
            {paid ? (
              <motion.div
                key="paid"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <CheckCircle2 className="w-4 h-4 text-mint-400 flex-shrink-0" />
              </motion.div>
            ) : (
              <motion.div key="pending" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Circle className="w-4 h-4 text-white/20 flex-shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="min-w-0">
            <p className="text-white/80 text-sm font-sans font-medium truncate">{memberName}</p>
            {paid ? (
              <p className="text-white/30 text-xs font-mono truncate">
                {va.bankName} · {va.accountNumber}
              </p>
            ) : (
              <p className="text-white/30 text-xs font-sans">
                ₦{amountNgn.toLocaleString()} due
              </p>
            )}
          </div>
        </div>

        <motion.span
          layout
          className={`flex-shrink-0 text-xs font-sans px-2 py-0.5 rounded-full ${
            paid
              ? "bg-mint-400/15 text-mint-400"
              : "bg-white/5 text-white/30"
          }`}
        >
          {paid ? "Paid" : "Pending"}
        </motion.span>
      </div>

      {/* Pending — show payment details */}
      <AnimatePresence>
        {!paid && va.accountNumber && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-white/5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/25 text-[10px] font-sans uppercase tracking-wider">Pay to</p>
                <p className="text-white/70 text-sm font-mono font-medium">{va.accountNumber}</p>
                <p className="text-white/35 text-xs font-sans">{va.bankName}</p>
              </div>
              <button
                onClick={copyAccount}
                className="flex items-center gap-1 text-gold-400/70 hover:text-gold-400 text-xs font-sans transition-colors"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
            <p className="text-white/20 text-[10px] font-mono">
              ref: {va.reference.length > 20 ? `${va.reference.slice(0, 20)}…` : va.reference}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paid — show timestamp */}
      {paid && va.paidAt && (
        <p className="mt-1.5 text-white/20 text-[10px] font-sans">
          Confirmed {new Date(va.paidAt).toLocaleString()}
        </p>
      )}
    </motion.div>
  );
}
