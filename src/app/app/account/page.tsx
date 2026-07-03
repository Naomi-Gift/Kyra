"use client";
import { CreditCard, Copy, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { toast } from "sonner";

const transactions = [
  { type: "out", label: "Group contribution — Family Circle", amount: "-$25.00", time: "2 days ago" },
  { type: "out", label: "Group contribution — Tech Builders", amount: "-$50.00", time: "6 days ago" },
  { type: "in", label: "Pot received — Family Circle cycle #6", amount: "+$125.00", time: "8 days ago" },
  { type: "out", label: "Group contribution — Family Circle", amount: "-$25.00", time: "9 days ago" },
  { type: "out", label: "Group contribution — City Savers", amount: "-$100.00", time: "12 days ago" },
];

export default function AccountPage() {
  const copy = () => {
    navigator.clipboard.writeText("acct_kyra_demo");
    toast.success("Account ID copied!");
  };

  return (
    <div className="space-y-5 px-4 pb-6 pt-20 sm:px-6 lg:p-8 lg:pt-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Account</h1>
        <p className="text-white/35 text-sm font-sans mt-0.5">
          Your saved balance, payment method, and activity
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
            <CreditCard className="w-4 h-4 text-white/30" />
            <span className="text-white/30 text-xs font-sans tracking-widest uppercase">
              Account Balance
            </span>
            <Badge variant="mint" dot className="ml-auto">
              Verified
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

          {/* Account ID */}
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 w-fit">
            <span className="text-white/50 text-xs font-mono">acct_kyra_demo</span>
            <button onClick={copy} className="text-white/30 hover:text-gold-400 transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
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

      {/* Payment methods */}
      <div className="rounded-2xl p-4 space-y-3 glass sm:p-5">
        <h3 className="font-serif text-base font-semibold text-white">
          Payment Methods
        </h3>
        <p className="text-white/30 text-xs font-sans">
          Saved methods used for scheduled group collections
        </p>
        <div className="space-y-2">
          {[
            { group: "Family Circle", method: "Visa ending 4242", limit: "$25.00/cycle" },
            { group: "Tech Builders", method: "Bank account ending 0198", limit: "$50.00/cycle" },
            { group: "City Savers", method: "Visa ending 4242", limit: "$100.00/cycle" },
          ].map((a) => (
            <div key={a.group} className="flex flex-col gap-1 py-3 border-b border-white/5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-white/60 text-sm font-sans">{a.group}</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono">
                <span className="text-white/30">{a.method}</span>
                <span className="text-gold-400">{a.limit}</span>
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
