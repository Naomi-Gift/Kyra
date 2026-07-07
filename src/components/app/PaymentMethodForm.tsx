"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Building2, Hash, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Bank } from "@/lib/banks";
import type { PaymentMethod } from "@/lib/backend/types";

const DEMO_MEMBER_ID = "mem_maria";

export function PaymentMethodForm({ memberId = DEMO_MEMBER_ID }: { memberId?: string }) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [loadingBanks, setLoadingBanks] = useState(true);
  const [loadingMethod, setLoadingMethod] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 11.2 – Load banks from GET /api/banks
  useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data: { banks: Bank[] }) => {
        setBanks(data.banks);
      })
      .catch(() => toast.error("Failed to load banks."))
      .finally(() => setLoadingBanks(false));
  }, []);

  // 11.4 – Pre-fill from GET /api/account/payment-method on mount
  useEffect(() => {
    fetch(`/api/account/payment-method?memberId=${memberId}`)
      .then((r) => r.json())
      .then((data: { paymentMethod: PaymentMethod | null }) => {
        if (data.paymentMethod) {
          setBankCode(data.paymentMethod.bankCode);
          setAccountNumber(data.paymentMethod.accountNumber);
          setAccountName(data.paymentMethod.accountName);
        }
      })
      .catch(() => {
        // silently ignore — form just stays empty
      })
      .finally(() => setLoadingMethod(false));
  }, [memberId]);

  // 11.5 – Submit → POST /api/account/payment-method
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankCode || !accountNumber.trim() || !accountName.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          accountNumber: accountNumber.trim(),
          bankCode,
          accountName: accountName.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      toast.success("Payment method saved!");
      setSaved(true);
      // Re-enable after 2 s
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save payment method.");
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingBanks || loadingMethod;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-5 glass sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-gold-400" />
        </div>
        <div>
          <h3 className="font-serif text-base font-semibold text-white">Payment Method</h3>
          <p className="text-white/30 text-xs font-sans">Bank account for payout disbursements</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* 11.2 – Bank dropdown */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-white/50 text-xs font-sans uppercase tracking-wider">
          <Building2 className="w-3 h-3" />
          Bank
        </label>
        <div className="relative">
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            disabled={isLoading}
            className={[
              "w-full appearance-none rounded-xl px-4 py-2.5 pr-10",
              "bg-white/5 border border-white/10",
              "text-sm font-sans text-white",
              "focus:outline-none focus:border-gold-500/40 focus:bg-white/8",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-colors duration-200",
              !bankCode ? "text-white/30" : "text-white",
            ].join(" ")}
          >
            <option value="" disabled className="bg-obsidian-950 text-white/40">
              {loadingBanks ? "Loading banks…" : "Select a bank"}
            </option>
            {banks.map((bank) => (
              <option
                key={bank.code}
                value={bank.code}
                className="bg-obsidian-950 text-white"
              >
                {bank.name}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* 11.3 – Account number input */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-white/50 text-xs font-sans uppercase tracking-wider">
          <Hash className="w-3 h-3" />
          Account Number
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          placeholder="0123456789"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          disabled={isLoading}
          className={[
            "w-full rounded-xl px-4 py-2.5",
            "bg-white/5 border border-white/10",
            "text-sm font-mono text-white placeholder:text-white/20",
            "focus:outline-none focus:border-gold-500/40 focus:bg-white/8",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-colors duration-200",
          ].join(" ")}
        />
      </div>

      {/* 11.3 – Account name input */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-white/50 text-xs font-sans uppercase tracking-wider">
          <User className="w-3 h-3" />
          Account Name
        </label>
        <input
          type="text"
          placeholder="Maria Johnson"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          disabled={isLoading}
          className={[
            "w-full rounded-xl px-4 py-2.5",
            "bg-white/5 border border-white/10",
            "text-sm font-sans text-white placeholder:text-white/20",
            "focus:outline-none focus:border-gold-500/40 focus:bg-white/8",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-colors duration-200",
          ].join(" ")}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={saving}
        disabled={isLoading || saving || saved}
      >
        {saved ? "Saved ✓" : "Save Payment Method"}
      </Button>
    </form>
  );
}
