"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { fadeLeft, fadeRight, staggerContainer, fadeUp } from "@/lib/motion";

type ActivityItem = {
  id: number;
  type: "collect" | "release" | "check" | "cycle";
  message: string;
  time: string;
  amount?: string;
};

const seedActivity: ActivityItem[] = [
  { id: 1, type: "release",  message: "Pot sent to Maria S. — Family Circle", time: "just now",  amount: "$150.00" },
  { id: 2, type: "collect",  message: "Contribution received — James K.",      time: "12s ago",   amount: "$30.00"  },
  { id: 3, type: "collect",  message: "Contribution received — Priya N.",      time: "28s ago",   amount: "$30.00"  },
  { id: 4, type: "check",    message: "All 6 members verified · cycle ready",  time: "45s ago"                      },
  { id: 5, type: "cycle",    message: "New cycle started · Round 3 of 6",      time: "1m ago"                       },
  { id: 6, type: "collect",  message: "Contribution received — Alex T.",       time: "2m ago",    amount: "$30.00"  },
];

const typeConfig = {
  collect: { icon: Zap,          color: "text-mint-400",    bg: "bg-mint-400/10",    border: "border-mint-400/15"   },
  release: { icon: ArrowRight,   color: "text-gold-400",    bg: "bg-gold-400/10",    border: "border-gold-400/20"   },
  check:   { icon: CheckCircle2, color: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/15" },
  cycle:   { icon: Clock,        color: "text-white/50",    bg: "bg-white/5",        border: "border-white/8"        },
};

const names  = ["Sofia R.", "David M.", "Aisha K.", "Tom W.", "Lena C.", "Marco P."];
const groups = ["Family Circle", "Colleagues Fund", "Weekend Crew", "City Savers"];

export function AgentActivity() {
  const [items, setItems]     = useState(seedActivity);
  const [latestId, setLatestId] = useState(6);

  const sectionRef = useRef(null);
  const inView     = useInView(sectionRef, { once: true, amount: 0.25 });

  useEffect(() => {
    const interval = setInterval(() => {
      const id    = latestId + 1;
      const types: ActivityItem["type"][] = ["collect", "check", "collect", "release"];
      const type  = types[Math.floor(Math.random() * types.length)];
      const name  = names[Math.floor(Math.random() * names.length)];
      const group = groups[Math.floor(Math.random() * groups.length)];

      const messages: Record<ActivityItem["type"], string> = {
        collect: `Contribution received — ${name}`,
        release: `Pot sent to ${name} — ${group}`,
        check:   `All members verified · cycle ready`,
        cycle:   `New cycle started · ${group}`,
      };

      const newItem: ActivityItem = {
        id,
        type,
        message: messages[type],
        time: "just now",
        amount: (type === "collect" || type === "release")
          ? `$${(Math.random() * 120 + 20).toFixed(2)}`
          : undefined,
      };

      setItems(prev => [newItem, ...prev.slice(0, 5)]);
      setLatestId(id);
    }, 3200);

    return () => clearInterval(interval);
  }, [latestId]);

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-28">
      {/* Faint mid-page glow */}
      <div className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.04), transparent)" }} />

      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: copy ───────────────────────────────── */}
          <motion.div
            variants={staggerContainer(0.1, 0)}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="space-y-6 sm:space-y-7"
          >
            <motion.p variants={fadeUp} className="text-white/30 text-xs font-sans tracking-[0.3em] uppercase">
              Always on
            </motion.p>

            <motion.h2 variants={fadeUp} className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold text-white leading-tight">
              Works while{" "}
              <motion.span
                className="font-serif italic text-gold-400 inline-block"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                you're living
              </motion.span>
              <br />your life
            </motion.h2>

            <motion.p variants={fadeUp} className="text-white/40 text-base leading-relaxed font-light max-w-md">
              Every day, ChoreAgent wakes up, checks your group's schedule,
              collects from members, rotates the pot, and sends a plain-English
              summary. You don't lift a finger.
            </motion.p>

            {/* Uptime row */}
            <motion.div variants={fadeUp} className="space-y-2 max-w-sm">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-white/30">Agent uptime</span>
                <span className="text-mint-400 font-medium">99.8%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: "99.8%" } : { width: 0 }}
                  transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-mint-500 to-mint-400"
                />
              </div>
            </motion.div>

            {/* Micro-stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: TrendingUp, label: "Collections", value: "14,820" },
                { icon: CheckCircle2, label: "On-time rate", value: "98.2%" },
                { icon: Zap, label: "Avg per cycle", value: "~110 txns" },
              ].map(({ icon: Icon, label, value }) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="glass rounded-xl p-3 space-y-1 text-center border border-white/5"
                >
                  <Icon className="w-3.5 h-3.5 text-white/25 mx-auto" />
                  <p className="text-white/70 text-sm font-mono font-medium">{value}</p>
                  <p className="text-white/25 text-[10px] font-sans">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: live feed ─────────────────────────── */}
          <motion.div
            variants={staggerContainer(0.08, 0.3)}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="space-y-3"
          >
            {/* Feed header */}
            <motion.div variants={fadeUp} className="mb-2 flex items-center justify-between gap-3">
              <span className="text-white/30 text-xs font-sans tracking-widest uppercase">
                Live activity
              </span>
              <span className="flex items-center gap-1.5 text-mint-400 text-xs font-sans">
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-mint-400 inline-block"
                />
                Active now
              </span>
            </motion.div>

            {/* Feed items */}
            <div className="space-y-2 relative">
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => {
                  const cfg = typeConfig[item.type];
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 32, scale: 0.96 }}
                      animate={{ opacity: 1 - i * 0.1, x: 0, scale: 1 - i * 0.008 }}
                      exit={{ opacity: 0, x: -24, scale: 0.95, transition: { duration: 0.25 } }}
                      transition={{ type: "spring", stiffness: 340, damping: 28 }}
                      className={`flex items-start gap-3 rounded-xl border p-3 glass ${cfg.border}`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 0.3 }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                      >
                        <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <p className="text-white/70 text-sm font-sans truncate">
                          {item.message}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                        {item.amount && (
                          <span className="text-gold-400 text-xs font-mono font-semibold">
                            {item.amount}
                          </span>
                        )}
                        <span className="text-white/20 text-xs font-sans whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Footer strip */}
            <motion.div
              variants={fadeUp}
              className="rounded-xl border border-white/5 p-3 text-center glass"
            >
              <span className="text-white/20 text-xs font-sans">
                Fully automated · no manual steps · all on-chain
              </span>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
