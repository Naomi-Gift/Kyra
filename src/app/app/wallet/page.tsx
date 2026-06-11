"use client";
import { Wallet, Copy, ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { toast } from "sonner";

const transactions = [
  { type: "out", label: "Group contribution — Grupo Familia", amount: "-$25.00", time: "2 days ago" },
  { type: "out", label: "Group contribution — Tech Builders", amount: "-$50.00", time: "6 days ago" },
  { type: "in", label: "Pot received — Grupo Familia cycle #6", amount: "+$125.00", time: "8 days ago" },
  { type: "out", label: "Group contribution — Grupo Familia", amount: "-$25.00", time: "9 days ago" },
  { type: "out", label: "Group contribution — Celo Savers", amount: "-$100.00", time: "12 days ago" },
];

export default function WalletPage() {
  const copy = () => {
    navigator.clipboard.writeText("0x4f2a...9e1c");
    toast.success("Address copied!");
  };

  return (
    <div className="space-y-5 px-4 pb-6 pt-20 sm:px-6 lg:p-8 lg:pt-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Wallet</h1>
        <p className="text-white/35 text-sm font-sans mt-0.5">
          Your cUSD balance and activity
        </p>
      </div>

      {/* Balance card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(139,92,246,0.05) 100%)",
          border: "1px solid rgba(251,191,36,0.15)",
        }}
      >
        {/* BG decoration */}
        <div
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)",
          }}
        />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Wallet className="w-4 h-4 text-white/30" />
            <span className="text-white/30 text-xs font-sans tracking-widest uppercase">
              cUSD Balance
            </span>
            <Badge variant="mint" dot className="ml-auto">
              MiniPay
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="font-serif text-4xl font-bold text-white sm:text-5xl">
              <AnimatedCounter value={843.50} prefix="$" decimals={2} duration={1500} />
            </div>
            <p className="text-white/30 text-sm font-sans">
              ≈ $843.50 USD
            </p>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 w-fit">
            <span className="text-white/50 text-xs font-mono">0x4f2a…9e1c</span>
            <button onClick={copy} className="text-white/30 hover:text-gold-400 transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a href="#" className="text-white/30 hover:text-gold-400 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { label: "Total contributed", value: "$200.00" },
              { label: "Total received", value: "$125.00" },
              { label: "Active groups", value: "3" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-left glass sm:text-center">
                <p className="text-white/70 text-sm font-mono font-medium">{s.value}</p>
                <p className="text-white/25 text-xs font-sans mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Allowances */}
      <div className="rounded-2xl p-4 space-y-3 glass sm:p-5">
        <h3 className="font-serif text-base font-semibold text-white">
          ChoreAgent Allowances
        </h3>
        <p className="text-white/30 text-xs font-sans">
          Approved spending for automated collections
        </p>
        <div className="space-y-2">
          {[
            { group: "Grupo Familia", approved: "$25.00", used: "$125.00" },
            { group: "Tech Builders", approved: "$50.00", used: "$100.00" },
            { group: "Celo Savers DAO", approved: "$100.00", used: "$100.00" },
          ].map((a) => (
            <div key={a.group} className="flex flex-col gap-1 py-3 border-b border-white/5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-white/60 text-sm font-sans">{a.group}</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono">
                <span className="text-white/30">approved {a.approved}</span>
                <span className="text-gold-400">used {a.used}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl p-4 space-y-3 glass sm:p-5">
        <h3 className="font-serif text-base font-semibold text-white">
          History
        </h3>
        <div className="space-y-1">
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                tx.type === "in" ? "bg-mint-400/10" : "bg-coral-400/10"
              }`}>
                {tx.type === "in"
                  ? <ArrowDownLeft className="w-4 h-4 text-mint-400" />
                  : <ArrowUpRight className="w-4 h-4 text-coral-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-sm font-sans truncate">{tx.label}</p>
                <p className="text-white/25 text-xs font-sans">{tx.time}</p>
              </div>
              <span className={`flex-shrink-0 text-sm font-mono font-medium ${
                tx.type === "in" ? "text-mint-400" : "text-coral-400"
              }`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
