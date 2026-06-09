"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { staggerContainer, fadeUp, scaleIn } from "@/lib/motion";

const pillars = [
  {
    layer: "Automation",
    items: ["Smart Scheduling", "Auto-Collection", "Instant Payouts"],
    color: "gold",
  },
  {
    layer: "Security",
    items: ["Non-Custodial", "Contract-Enforced", "Audited"],
    color: "violet",
  },
  {
    layer: "Payments",
    items: ["cUSD Stable", "Zero Gas Fees", "Instant Settlement"],
    color: "mint",
  },
  {
    layer: "Access",
    items: ["Mobile-First", "Any Wallet", "No Sign-Up"],
    color: "coral",
  },
];

const colorMap: Record<string, string> = {
  gold:   "border-gold-500/20 bg-gold-500/8 text-gold-300",
  violet: "border-violet-500/20 bg-violet-500/8 text-violet-300",
  mint:   "border-mint-500/20 bg-mint-500/8 text-mint-300",
  coral:  "border-coral-500/20 bg-coral-500/8 text-coral-300",
};
const labelMap: Record<string, string> = {
  gold:   "text-gold-400/50",
  violet: "text-violet-400/50",
  mint:   "text-mint-400/50",
  coral:  "text-coral-400/50",
};
const glowMap: Record<string, string> = {
  gold:   "rgba(251,191,36,0.12)",
  violet: "rgba(139,92,246,0.12)",
  mint:   "rgba(16,185,129,0.12)",
  coral:  "rgba(244,63,94,0.10)",
};

const trustedBy = [
  { name: "Celo Network",    role: "Blockchain Infrastructure" },
  { name: "MiniPay",         role: "Mobile Wallet Partner"     },
  { name: "3,200+ Members",  role: "Across 47 active groups"   },
];

export function TechStack() {
  const ref      = useRef(null);
  const inView   = useInView(ref, { once: true, amount: 0.2 });
  const trustRef = useRef(null);
  const trustInView = useInView(trustRef, { once: true, amount: 0.4 });

  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24
        bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-white/30 text-xs font-sans tracking-[0.3em] uppercase">
            What powers ChoreAgent
          </p>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,3rem)] font-bold text-white">
            Savings infrastructure you can{" "}
            <span className="font-serif italic font-normal text-white/40">
              actually trust
            </span>
          </h2>
          <p className="max-w-xl mx-auto text-white/35 text-base font-light">
            Every layer is purpose-built for real savings groups — not experiments.
          </p>
        </motion.div>

        {/* Pillars */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.layer}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{
                  y: -5,
                  boxShadow: `0 20px 50px ${glowMap[p.color]}`,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="glass rounded-2xl p-5 space-y-4 border border-white/6 h-full"
              >
                <p className={`text-xs font-sans tracking-widest uppercase ${labelMap[p.color]}`}>
                  {p.layer}
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.items.map((item, j) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.2 + i * 0.1 + j * 0.06, type: "spring", stiffness: 400 }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans border ${colorMap[p.color]}`}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Trusted-by strip */}
        <motion.div
          ref={trustRef}
          initial={{ opacity: 0, y: 24 }}
          animate={trustInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 glass rounded-2xl p-6 border border-white/5"
        >
          <p className="text-white/25 text-xs font-sans tracking-[0.3em] uppercase mb-6 text-center">
            Trusted by
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            {trustedBy.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0 }}
                animate={trustInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.12 }}
                className="text-center space-y-1 py-4 sm:py-0"
              >
                <p className="text-white/70 font-serif font-semibold text-base">
                  {t.name}
                </p>
                <p className="text-white/25 text-xs font-sans">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
