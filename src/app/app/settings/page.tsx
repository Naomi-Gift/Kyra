"use client";
import { useState } from "react";
import { Bell, Shield, Smartphone, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    cycleStart: true,
    collectionDone: true,
    payoutReceived: true,
    agentError: true,
    telegram: false,
  });

  const handleSave = () => {
    toast.success("Settings saved");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/35 text-sm font-sans mt-0.5">
          Notifications, security, and preferences
        </p>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-white/40" />
          <h3 className="font-serif text-base font-semibold text-white">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: "cycleStart", label: "Cycle started", desc: "When a new savings cycle begins" },
            { key: "collectionDone", label: "Collection complete", desc: "After agent collects from all members" },
            { key: "payoutReceived", label: "Payout received", desc: "When the pot lands in your wallet" },
            { key: "agentError", label: "Agent errors", desc: "If a collection fails" },
            { key: "telegram", label: "Telegram bot", desc: "Get summaries via Telegram" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white/70 text-sm font-sans">{item.label}</p>
                <p className="text-white/25 text-xs font-sans">{item.desc}</p>
              </div>
              <button
                onClick={() =>
                  setNotifications((n) => ({
                    ...n,
                    [item.key]: !n[item.key as keyof typeof n],
                  }))
                }
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  notifications[item.key as keyof typeof notifications]
                    ? "bg-gold-500"
                    : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                    notifications[item.key as keyof typeof notifications]
                      ? "left-5"
                      : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-white/40" />
          <h3 className="font-serif text-base font-semibold text-white">Security</h3>
        </div>
        <div className="space-y-2">
          {[
            { label: "Agent address", value: "0xDeAdBeEf…1337", badge: "Verified" },
            { label: "Contract", value: "0xAbCd…EfGh (Celo)", badge: "Audited" },
            { label: "Auth method", value: "ERC-2771 forwarder", badge: null },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-white/30 text-sm font-sans">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs font-mono">{row.value}</span>
                {row.badge && (
                  <Badge variant="mint" className="text-[10px]">{row.badge}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MiniPay */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-white/40" />
          <h3 className="font-serif text-base font-semibold text-white">MiniPay</h3>
          <Badge variant="mint" dot className="ml-auto">Connected</Badge>
        </div>
        <p className="text-white/35 text-xs font-sans">
          Your MiniPay wallet is connected. Transactions are gasless via ERC-2771 meta-transactions.
        </p>
      </div>

      <Button variant="primary" size="lg" onClick={handleSave}>
        <Save className="w-4 h-4" />
        Save Settings
      </Button>
    </div>
  );
}
