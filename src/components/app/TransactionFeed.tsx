"use client";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import type { ActivityItem } from "@/lib/backend/types";
import { useAppData } from "@/components/app/AppDataProvider";

type EnrichedActivity = ActivityItem & { groupName: string; memberName: string };

type Tx = {
  id: string;
  type: "collect" | "release" | "cycle";
  description: string;
  amount: string;
  address: string;
  time: string;
  positive: boolean | null;
};

const initialTxs: Tx[] = [
  { id: "t1", type: "collect", description: "Contribution — Family Circle",   amount: "+₦25.00",   address: "Maria S.",  time: "2 min ago",  positive: true  },
  { id: "t2", type: "release", description: "Payout sent — Colleagues Fund",  amount: "+₦400.00",  address: "James K.",  time: "14 min ago", positive: true  },
  { id: "t3", type: "collect", description: "Contribution — City Savers",     amount: "+₦100.00",  address: "Aisha K.",  time: "1 hr ago",   positive: true  },
  { id: "t4", type: "cycle",   description: "New cycle — Family Circle",       amount: "—",         address: "Kyra",      time: "2 hr ago",   positive: null  },
  { id: "t5", type: "collect", description: "Contribution — Family Circle",   amount: "+₦25.00",   address: "David M.",  time: "3 hr ago",   positive: true  },
  { id: "t6", type: "release", description: "Payout sent — Family Circle",    amount: "+₦125.00",  address: "Tom W.",    time: "1 day ago",  positive: true  },
];

function mapActivityToTx(item: EnrichedActivity): Tx {
  const type: Tx["type"] =
    item.type === "contribution" ? "collect" :
    item.type === "payout"       ? "release" :
                                   "cycle";

  const amount =
    item.amount !== null
      ? `+₦${item.amount.toLocaleString()}`
      : "—";

  const positive: boolean | null =
    item.type === "contribution" || item.type === "payout" ? true : null;

  return {
    id:          item.id,
    type,
    description: item.description,
    amount,
    address:     item.memberName,
    time:        new Date(item.occurredAt).toLocaleString(),
    positive,
  };
}

const typeIcon  = { collect: Zap, release: ArrowUpRight, cycle: RefreshCw };
const typeStyle = {
  collect: "text-mint-400 bg-mint-400/10 border-mint-400/15",
  release: "text-gold-400 bg-gold-400/10 border-gold-400/20",
  cycle:   "text-violet-400 bg-violet-400/10 border-violet-400/15",
};

export function TransactionFeed() {
  const { activity } = useAppData();
  const txs = useMemo(
    () => (activity.length > 0 ? activity.map(mapActivityToTx) : initialTxs),
    [activity]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/6 p-4 space-y-4 glass sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg font-semibold text-white">Recent Activity</h3>
        <span className="flex items-center gap-1.5 text-mint-400 text-xs font-sans">
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-mint-400 inline-block"
          />
          Live
        </span>
      </div>

      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {txs.map((tx) => {
            const Icon  = typeIcon[tx.type] || ArrowDownRight;
            const style = typeStyle[tx.type] || "text-white/40 bg-white/5 border-white/8";
            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                whileHover={{ x: 3, backgroundColor: "rgba(255,255,255,0.02)" }}
                className="flex items-center gap-3 rounded-xl p-2.5 cursor-default sm:p-3"
              >
                <motion.div
                  whileHover={{ scale: 1.12 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${style}`}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/65 text-sm font-sans truncate">{tx.description}</p>
                  <p className="text-white/25 text-xs font-sans">{tx.address}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-mono font-medium ${
                    tx.positive === true ? "text-mint-400" : tx.positive === false ? "text-coral-400" : "text-white/25"
                  }`}>
                    {tx.amount}
                  </p>
                  <p className="text-white/20 text-xs font-sans">{tx.time}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ x: 3 }}
        className="w-full text-center text-white/25 text-xs font-sans py-1.5 hover:text-white/50 transition-colors flex items-center justify-center gap-1"
      >
        View full history <ArrowUpRight className="w-3 h-3" />
      </motion.button>
    </motion.div>
  );
}
