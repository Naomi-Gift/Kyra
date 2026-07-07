"use client";
import { useEffect, useState } from "react";
import { CreditCard, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { PaymentMethodForm } from "@/components/app/PaymentMethodForm";
import { useAppData } from "@/components/app/AppDataProvider";
import { usePolling } from "@/hooks/usePolling";

type AccountData = {
  account: {
    id: string;
    name: string;
    email: string;
    balance: number;
    totalContributed: number;
    totalReceived: number;
    activeGroups: number;
  };
};

type PaymentMethodData = {
  paymentMethod: { accountName: string; bankName: string; accountNumber: string } | null;
};

export default function AccountPage() {
  const { activity: allActivity } = useAppData();
  const { data: accountData } = usePolling<AccountData>("/api/account", 15_000);
  const { data: pmData } = usePolling<PaymentMethodData>(
    "/api/account/payment-method?memberId=mem_maria",
    10_000
  );

  const account = accountData?.account;
  const transactions = allActivity
    .filter((a) => a.type === "contribution" || a.type === "payout")
    .slice(0, 6);
  const hasPaymentMethod = !!pmData?.paymentMethod;

  return (
    <div className="space-y-5 px-4 pb-6 pt-20 sm:px-6 lg:p-8 lg:pt-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Account</h1>
        <p className="text-white/35 text-sm font-sans mt-0.5">
          {account ? account.email : "Your balance, payment method, and activity"}
        </p>
      </div>

      {/* Payment method callout — shown prominently when not yet set */}
      {!hasPaymentMethod && (
        <div className="flex items-start gap-3 rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4">
          <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CreditCard className="w-4 h-4 text-gold-400" />
          </div>
          <div>
            <p className="text-gold-300 text-sm font-sans font-medium">Add your bank account</p>
            <p className="text-white/40 text-xs font-sans mt-0.5 leading-relaxed">
              Kyra needs your bank details to send your payout when it&apos;s your turn. Fill in the form below — it takes 30 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Balance card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(139,92,246,0.05) 100%)",
          border: "1px solid rgba(251,191,36,0.15)",
        }}
      >
        <div
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)" }}
        />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <CreditCard className="w-4 h-4 text-white/30" />
            <span className="text-white/30 text-xs font-sans tracking-widest uppercase">Account Balance</span>
            <Badge variant="mint" dot className="ml-auto">
              {hasPaymentMethod ? "Payout ready" : "Setup needed"}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="font-serif text-4xl font-bold text-white sm:text-5xl">
              <AnimatedCounter value={account?.balance ?? 0} prefix="₦" decimals={2} duration={1500} />
            </div>
            <p className="text-white/30 text-sm font-sans">
              {account?.name ?? "Loading…"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { label: "Total contributed", value: `₦${(account?.totalContributed ?? 0).toLocaleString()}` },
              { label: "Total received",    value: `₦${(account?.totalReceived ?? 0).toLocaleString()}` },
              { label: "Active groups",     value: String(account?.activeGroups ?? 0) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-left glass sm:text-center">
                <p className="text-white/70 text-sm font-mono font-medium">{s.value}</p>
                <p className="text-white/25 text-xs font-sans mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment method form — always visible, highlighted when not set */}
      <div className={hasPaymentMethod ? "" : "ring-1 ring-gold-500/20 rounded-2xl"}>
        <PaymentMethodForm />
      </div>

      {/* Payment method confirmed badge */}
      {hasPaymentMethod && (
        <div className="flex items-center gap-2 text-mint-400/70 text-xs font-sans px-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Bank account saved · payouts will go to {pmData?.paymentMethod?.bankName} ···{" "}
          {pmData?.paymentMethod?.accountNumber.slice(-4)}
        </div>
      )}

      {/* Transaction history */}
      <div className="rounded-2xl p-4 space-y-3 glass sm:p-5">
        <h3 className="font-serif text-base font-semibold text-white">History</h3>

        {transactions.length === 0 ? (
          <p className="text-white/25 text-sm font-sans py-4 text-center">
            Activity will appear here once your first cycle runs.
          </p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const isIn = tx.type === "payout";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isIn ? "bg-mint-400/10" : "bg-coral-400/10"
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="w-4 h-4 text-mint-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-coral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-sm font-sans truncate">{tx.description}</p>
                    <p className="text-white/25 text-xs font-sans">
                      {new Date(tx.occurredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-sm font-mono font-medium ${
                      isIn ? "text-mint-400" : "text-coral-400"
                    }`}
                  >
                    {tx.amount != null
                      ? `${isIn ? "+" : "-"}₦${tx.amount.toLocaleString()}`
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
