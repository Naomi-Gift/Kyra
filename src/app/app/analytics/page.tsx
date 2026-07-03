"use client";
import { SavingsChart } from "@/components/app/SavingsChart";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Lock } from "lucide-react";

const premiumMetrics = [
  { label: "Avg cycle completion rate", value: "98.2%", locked: false },
  { label: "Default rate", value: "0.4%", locked: false },
  { label: "Retention (30d)", value: "91.7%", locked: true },
  { label: "Group velocity score", value: "—", locked: true },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-5 px-4 pb-6 pt-20 sm:px-6 lg:p-8 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Analytics</h1>
          <p className="text-white/35 text-sm font-sans mt-0.5">
            Performance across all groups
          </p>
        </div>
        <Badge variant="gold" dot>
          Updated 11h ago
        </Badge>
      </div>

      {/* Chart */}
      <SavingsChart />

      {/* Metrics grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {[
          { label: "Items this month", value: 4820, prefix: "", suffix: "" },
          { label: "Cash collected", value: 85400, prefix: "$", suffix: "" },
          { label: "Groups active", value: 47, prefix: "", suffix: "" },
          { label: "On-time rate", value: 98, prefix: "", suffix: "%" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl p-4 space-y-2 glass">
            <p className="text-white/30 text-xs font-sans tracking-widest uppercase">
              {m.label}
            </p>
            <p className="font-serif text-2xl font-bold text-white">
              <AnimatedCounter
                value={m.value}
                prefix={m.prefix}
                suffix={m.suffix}
                decimals={0}
                duration={1500}
              />
            </p>
          </div>
        ))}
      </div>

      {/* Premium section */}
      <div className="rounded-2xl p-4 space-y-4 glass-gold sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-white">
              Premium Analytics
            </h3>
            <p className="text-white/35 text-xs font-sans">
              Advanced retention, completion, and member behavior insights
            </p>
          </div>
          <Badge variant="gold">Pro</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {premiumMetrics.map((m) => (
            <div
              key={m.label}
              className={`glass rounded-xl p-3 ${m.locked ? "opacity-50" : ""}`}
            >
              <p className="text-white/30 text-xs font-sans">{m.label}</p>
              <div className="flex items-center gap-2 mt-1">
                {m.locked ? (
                  <Lock className="w-4 h-4 text-gold-400/50" />
                ) : (
                  <p className="text-white/80 text-lg font-mono font-medium">
                    {m.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-300 text-sm font-sans hover:bg-gold-500/20 transition-colors">
          Unlock premium analytics
        </button>
      </div>
    </div>
  );
}
