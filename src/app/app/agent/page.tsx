"use client";
import { useState } from "react";
import { Bot, Play, Clock, CheckCircle2, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

const agentLogs = [
  { time: "11:02:14", type: "info", msg: "Agent woke up · checking group schedules" },
  { time: "11:02:15", type: "info", msg: "Found 3 groups due for collection" },
  { time: "11:02:17", type: "success", msg: "Collected $25 from 0x4f2a…9e1c — Grupo Familia" },
  { time: "11:02:18", type: "success", msg: "Collected $25 from 0xb831…ff02 — Grupo Familia" },
  { time: "11:02:19", type: "success", msg: "Collected $25 from 0x7c3b…22e9 — Grupo Familia" },
  { time: "11:02:20", type: "success", msg: "Collected $25 from 0x9d44…1a78 — Grupo Familia" },
  { time: "11:02:21", type: "success", msg: "Collected $25 from 0x3a12…bb34 — Grupo Familia" },
  { time: "11:02:22", type: "success", msg: "Pot released to 0x4f2a…9e1c — $125 total" },
  { time: "11:02:23", type: "info", msg: "Cycle #7 complete · advancing to cycle #8" },
  { time: "11:02:25", type: "success", msg: "All Tech Builders collections processed · $400 pot" },
  { time: "11:02:26", type: "info", msg: "Summary sent · 110 transactions · 0 errors" },
  { time: "11:02:26", type: "info", msg: "Agent sleeping until next cycle" },
];

const logStyle = {
  info: "text-white/45",
  success: "text-mint-400",
  error: "text-coral-400",
  warn: "text-gold-400",
};

const logDot = {
  info: "bg-white/20",
  success: "bg-mint-400",
  error: "bg-coral-400",
  warn: "bg-gold-400",
};

export default function AgentPage() {
  const [triggerLoading, setTriggerLoading] = useState(false);

  const handleManualRun = async () => {
    setTriggerLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setTriggerLoading(false);
    toast.success("Agent run triggered!", {
      description: "Agent will process all due cycles now.",
    });
  };

  return (
    <div className="space-y-5 px-4 pb-6 pt-20 sm:px-6 lg:p-8 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Agent</h1>
          <p className="text-white/35 text-sm font-sans mt-0.5">
            Kyra runtime status and logs
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          loading={triggerLoading}
          onClick={handleManualRun}
          className="w-full sm:w-auto"
        >
          <Play className="w-4 h-4" />
          Run Now
        </Button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          {
            icon: Bot,
            label: "Status",
            value: "Sleeping",
            sub: "Next run in 11h 23m",
            badge: { label: "Scheduled", variant: "violet" as const },
          },
          {
            icon: CheckCircle2,
            label: "Last Run",
            value: "11h ago",
            sub: "110 txns · 0 errors",
            badge: { label: "Success", variant: "mint" as const },
          },
          {
            icon: Clock,
            label: "Total Runs",
            value: "247",
            sub: "Since deployment",
            badge: { label: "Lifetime", variant: "default" as const },
          },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-white/5">
                <card.icon className="w-4 h-4 text-white/40" />
              </div>
              <Badge variant={card.badge.variant}>{card.badge.label}</Badge>
            </div>
            <div>
              <p className="text-white/30 text-xs font-sans">{card.label}</p>
              <p className="font-serif text-2xl font-bold text-white mt-0.5">
                {card.value}
              </p>
              <p className="text-white/30 text-xs font-sans mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agent identity */}
      <div className="rounded-2xl p-4 space-y-3 glass-violet sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-base font-semibold text-white">
            Agent Identity
          </h3>
          <Badge variant="violet">EC-SECP</Badge>
        </div>
        <div className="space-y-2">
          {[
            { label: "Address", value: "0xDeAdBeEf…ChOrEaGeNt1337" },
            { label: "Registered on", value: "Celo Mainnet" },
            { label: "Auth method", value: "self-signed · EC-SECP256k1" },
            { label: "Allowed op", value: "collectFromMember() only" },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
              <span className="text-white/30 font-sans">{row.label}</span>
              <span className="break-all text-white/60 font-mono text-xs sm:text-right">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log terminal */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/2">
          <Terminal className="w-4 h-4 text-white/30" />
          <span className="text-white/30 text-xs font-mono">
            agent.log · last run 11h ago
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-coral-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-gold-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-mint-500/50" />
          </div>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto p-3 font-mono text-xs sm:p-4">
          {agentLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 sm:gap-3">
              <span className="text-white/20 flex-shrink-0">{log.time}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${logDot[log.type as keyof typeof logDot]}`}
              />
              <span className={logStyle[log.type as keyof typeof logStyle]}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
