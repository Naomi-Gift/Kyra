"use client";
import {
  Brain,
  Shield,
  Smartphone,
  BarChart3,
  RefreshCw,
  DollarSign,
  Lock,
  Users,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/Badge";

const features = [
  {
    icon: Brain,
    title: "Runs itself",
    desc: "Set your group up once. Kyra handles every collection, rotation, and payout automatically — no reminders, no chasing.",
    badge: { label: "Automation", variant: "gold" as const },
    size: "large",
    accent: "rgba(251,191,36,0.06)",
    hoverBorder: "rgba(251,191,36,0.25)",
  },
  {
    icon: Smartphone,
    title: "Works on any device",
    desc: "Members join from a simple web app. No special financial tooling or technical setup required.",
    badge: { label: "Mobile", variant: "mint" as const },
    size: "normal",
    accent: "rgba(16,185,129,0.04)",
    hoverBorder: "rgba(16,185,129,0.2)",
  },
  {
    icon: Shield,
    title: "Payment-safe by design",
    desc: "Kyra stores tokenized payment methods, applies per-cycle limits, and keeps a clear audit trail for every group.",
    badge: { label: "Secure", variant: "violet" as const },
    size: "normal",
    accent: "rgba(139,92,246,0.04)",
    hoverBorder: "rgba(139,92,246,0.2)",
  },
  {
    icon: Lock,
    title: "No hidden fees",
    desc: "Members save in regular currency and avoid confusing setup, network charges, and technical friction.",
    badge: { label: "Simple", variant: "violet" as const },
    size: "normal",
    accent: "rgba(139,92,246,0.04)",
    hoverBorder: "rgba(139,92,246,0.2)",
  },
  {
    icon: BarChart3,
    title: "Full visibility",
    desc: "Every collection, payout, and cycle is logged in Kyra so members can review the group history anytime.",
    badge: { label: "Transparent", variant: "gold" as const },
    size: "large",
    accent: "rgba(251,191,36,0.05)",
    hoverBorder: "rgba(251,191,36,0.2)",
  },
  {
    icon: RefreshCw,
    title: "Keeps going",
    desc: "Once everyone has received the pot, the cycle restarts automatically. Your group builds momentum.",
    badge: { label: "Continuous", variant: "mint" as const },
    size: "normal",
    accent: "rgba(16,185,129,0.04)",
    hoverBorder: "rgba(16,185,129,0.2)",
  },
  {
    icon: DollarSign,
    title: "Cash by default",
    desc: "All savings are tracked in regular money, so the pot stays understandable for every member.",
    badge: { label: "Stable", variant: "gold" as const },
    size: "normal",
    accent: "rgba(251,191,36,0.04)",
    hoverBorder: "rgba(251,191,36,0.2)",
  },
  {
    icon: Users,
    title: "Works with any group",
    desc: "Family, friends, colleagues. Set the amount, the schedule, and the members — Kyra does the rest.",
    badge: { label: "Flexible", variant: "default" as const },
    size: "normal",
    accent: "rgba(255,255,255,0.02)",
    hoverBorder: "rgba(255,255,255,0.12)",
  },
];

export function FeaturesGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-28">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 space-y-4 text-center sm:mb-20"
        >
          <p className="text-white/30 text-xs font-sans tracking-[0.3em] uppercase">
            Why it works
          </p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-bold text-white">
            Savings circles, finally{" "}
            <span className="font-serif italic font-normal text-white/50">
              done right
            </span>
          </h2>
          <p className="max-w-xl mx-auto text-white/35 text-base font-light">
            Kyra removes every friction point that makes traditional savings
            circles fall apart.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div ref={ref} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.55,
                delay: i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`
                relative group overflow-hidden rounded-2xl
                ${feat.size === "large" && i === 0 ? "lg:col-span-2" : ""}
                ${feat.size === "large" && i === 4 ? "lg:col-span-2" : ""}
              `}
            >
              <motion.div
                whileHover={{
                  y: -4,
                  boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${feat.hoverBorder}`,
                  backgroundColor: feat.accent,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="h-full rounded-2xl border border-white/6 p-5 space-y-4 glass sm:p-6"
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                {/* Animated spotlight on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${feat.accent}, transparent 60%)`,
                  }}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <motion.div
                    whileHover={{ scale: 1.12, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.3 }}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/8 text-white/50 group-hover:text-gold-400 transition-colors duration-300"
                  >
                    <feat.icon className="w-5 h-5" />
                  </motion.div>
                  <Badge variant={feat.badge.variant}>{feat.badge.label}</Badge>
                </div>

                <div className="relative space-y-2">
                  <h3 className="font-serif text-xl font-semibold text-white group-hover:text-gold-100 transition-colors duration-300">
                    {feat.title}
                  </h3>
                  <p className="text-white/38 text-sm leading-relaxed font-light">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
