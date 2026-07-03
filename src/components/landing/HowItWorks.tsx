"use client";
import { Users, Bot, Repeat, Banknote } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { staggerContainer, fadeUp } from "@/lib/motion";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Form your group",
    description:
      "Invite your people — family, friends, coworkers. Set a contribution amount and how often the pot rotates.",
    bg: "from-gold-500/10 to-transparent",
    border: "border-gold-500/15",
    iconColor: "text-gold-400",
    glow: "rgba(251,191,36,0.15)",
  },
  {
    number: "02",
    icon: Bot,
    title: "Add payment details",
    description:
      "Each member securely saves a card or bank account. That's the only setup they ever need to do.",
    bg: "from-violet-500/10 to-transparent",
    border: "border-violet-500/15",
    iconColor: "text-violet-400",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    number: "03",
    icon: Repeat,
    title: "Collections run automatically",
    description:
      "Kyra collects from every member on schedule, every time — with zero reminders or manual steps.",
    bg: "from-mint-500/10 to-transparent",
    border: "border-mint-500/15",
    iconColor: "text-mint-400",
    glow: "rgba(16,185,129,0.15)",
  },
  {
    number: "04",
    icon: Banknote,
    title: "Everyone gets their turn",
    description:
      "The full pot is sent directly to a different member each cycle. Transparent, fair, and easy to track.",
    bg: "from-coral-500/10 to-transparent",
    border: "border-coral-500/15",
    iconColor: "text-coral-400",
    glow: "rgba(244,63,94,0.15)",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const lineRef = useRef(null);
  const lineInView = useInView(lineRef, { once: true, amount: 0.5 });

  return (
    <section id="how-it-works" className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-28">
      {/* Background accent */}
      <div className="absolute inset-0 -z-10 opacity-[0.015]"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(251,191,36,1) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 space-y-4 text-center sm:mb-24"
        >
          <p className="text-white/30 text-xs font-sans tracking-[0.3em] uppercase">
            How it works
          </p>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-bold text-white">
            Four steps to a{" "}
            <span className="font-serif italic font-normal text-white/45">
              self-running circle
            </span>
          </h2>
          <p className="max-w-xl mx-auto text-white/40 text-base font-light">
            Set it up in minutes. Then watch it run indefinitely.
          </p>
        </motion.div>

        {/* Steps */}
        <div ref={ref} className="relative grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* Animated connector line */}
          <div ref={lineRef} className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={lineInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="h-full bg-gradient-to-r from-gold-500/30 via-violet-500/20 to-coral-500/20 origin-left"
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{
                duration: 0.6,
                delay: i * 0.13,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative group"
            >
              <motion.div
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 20px 60px ${step.glow}`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={`h-full rounded-2xl border bg-gradient-to-b ${step.bg} ${step.border} p-5 space-y-4 sm:p-6`}
              >
                {/* Step number + icon */}
                <div className="flex items-start justify-between">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 0.15 } : { opacity: 0 }}
                    transition={{ delay: 0.3 + i * 0.13 }}
                    className={`font-serif text-5xl font-bold leading-none ${step.iconColor}`}
                  >
                    {step.number}
                  </motion.span>
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className={`p-2.5 rounded-xl bg-white/5 border border-white/8 ${step.iconColor}`}
                  >
                    <step.icon className="w-5 h-5" />
                  </motion.div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>

                {/* Animated bottom border on hover */}
                <motion.div
                  className={`absolute bottom-0 left-4 right-4 h-px`}
                  style={{ background: `linear-gradient(90deg, transparent, ${step.glow}, transparent)` }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileHover={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 flex justify-center sm:mt-16"
        >
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/6 px-4 py-2.5 text-center text-xs text-white/30 font-sans glass sm:px-5"
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-mint-400"
            />
            Fully automated · no reminders · no manual steps
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
