"use client";
import { TrendingUp, Users, Zap, Repeat } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useAppData } from "@/components/app/AppDataProvider";

type Metrics = {
  totalSaved: number;
  activeMembers: number;
  automatedItems: number;
  activeCycles: number;
  completingSoon: number;
};

const STAT_SHAPE = [
  {
    key: "totalSaved" as const,
    icon: TrendingUp,
    label: "Total Saved",
    prefix: "₦",
    suffix: "",
    decimals: 0,
    getChange: (m: Metrics) => "+12.4% this month",
    positive: true as const,
    accent: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.18)",
    iconColor: "text-gold-400",
  },
  {
    key: "activeMembers" as const,
    icon: Users,
    label: "Active Members",
    prefix: "",
    suffix: "",
    decimals: 0,
    getChange: () => "+34 this week",
    positive: true as const,
    accent: "rgba(255,255,255,0.02)",
    border: "rgba(255,255,255,0.1)",
    iconColor: "text-white/40",
  },
  {
    key: "automatedItems" as const,
    icon: Zap,
    label: "Transactions",
    prefix: "",
    suffix: "",
    decimals: 0,
    getChange: () => "All automated",
    positive: true as const,
    accent: "rgba(139,92,246,0.05)",
    border: "rgba(139,92,246,0.18)",
    iconColor: "text-violet-400",
  },
  {
    key: "activeCycles" as const,
    icon: Repeat,
    label: "Active Cycles",
    prefix: "",
    suffix: "",
    decimals: 0,
    getChange: (m: Metrics) =>
      m.completingSoon > 0 ? `${m.completingSoon} completing soon` : "All on track",
    positive: null as null,
    accent: "rgba(16,185,129,0.05)",
    border: "rgba(16,185,129,0.18)",
    iconColor: "text-mint-400",
  },
];

// Skeleton card shown while loading
function StatSkeleton({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: i * 0.09 }}
      className="h-28 rounded-2xl border border-white/6 glass animate-pulse opacity-40"
    />
  );
}

export function DashboardStats() {
  const { metrics, loading } = useAppData();

  if (loading.metrics && !metrics) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        {STAT_SHAPE.map((_, i) => <StatSkeleton key={i} i={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {STAT_SHAPE.map((stat, i) => {
        const value = metrics ? metrics[stat.key] : 0;
        const change = metrics ? stat.getChange(metrics) : "—";
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              whileHover={{
                y: -3,
                boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${stat.border}`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="h-full rounded-2xl border border-white/6 p-4 space-y-3 glass sm:p-5 sm:space-y-4"
              style={{ backgroundColor: stat.accent }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white/35 text-xs font-sans tracking-widest uppercase">
                  {stat.label}
                </span>
                <motion.div
                  whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                  className="p-2 rounded-lg bg-white/5"
                >
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </motion.div>
              </div>

              <div className="space-y-1">
                <div className="font-serif text-2xl font-bold text-white sm:text-3xl">
                  <AnimatedCounter
                    value={value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    duration={1800}
                  />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.09 }}
                  className={`text-xs font-sans ${
                    stat.positive === true
                      ? "text-mint-400"
                      : stat.positive === false
                      ? "text-coral-400"
                      : "text-white/30"
                  }`}
                >
                  {change}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
