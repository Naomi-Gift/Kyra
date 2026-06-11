"use client";
import { TrendingUp, Users, Zap, Repeat } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const stats = [
  {
    icon: TrendingUp,
    label: "Total Saved",
    value: 312500,
    prefix: "$",
    suffix: "",
    decimals: 0,
    change: "+12.4% this month",
    positive: true,
    accent: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.18)",
    iconColor: "text-gold-400",
  },
  {
    icon: Users,
    label: "Active Members",
    value: 1247,
    prefix: "",
    suffix: "",
    decimals: 0,
    change: "+34 this week",
    positive: true,
    accent: "rgba(255,255,255,0.02)",
    border: "rgba(255,255,255,0.1)",
    iconColor: "text-white/40",
  },
  {
    icon: Zap,
    label: "Transactions",
    value: 14820,
    prefix: "",
    suffix: "",
    decimals: 0,
    change: "All automated",
    positive: true,
    accent: "rgba(139,92,246,0.05)",
    border: "rgba(139,92,246,0.18)",
    iconColor: "text-violet-400",
  },
  {
    icon: Repeat,
    label: "Active Cycles",
    value: 47,
    prefix: "",
    suffix: "",
    decimals: 0,
    change: "3 completing soon",
    positive: null,
    accent: "rgba(16,185,129,0.05)",
    border: "rgba(16,185,129,0.18)",
    iconColor: "text-mint-400",
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            whileHover={{ y: -3, boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${stat.border}` }}
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
                  value={stat.value}
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
                {stat.change}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
