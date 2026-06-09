"use client";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useMagnetic } from "@/hooks/useMagnetic";
import { fadeUp, fadeIn, staggerContainer } from "@/lib/motion";
import Link from "next/link";

const stats = [
  { value: 1247, label: "Active Members", prefix: "", suffix: "+", decimals: 0 },
  { value: 312500, label: "Saved to Date", prefix: "$", suffix: "", decimals: 0 },
  { value: 47, label: "Groups Running", prefix: "", suffix: "", decimals: 0 },
];

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const primaryRef = useMagnetic(0.3) as React.RefObject<HTMLDivElement>;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const yOrb1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const yOrb2 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const yContent = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const springY1 = useSpring(yOrb1, { stiffness: 60, damping: 20 });
  const springY2 = useSpring(yOrb2, { stiffness: 60, damping: 20 });

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 overflow-hidden"
    >
      {/* Parallax orb 1 */}
      <motion.div
        className="absolute top-24 right-16 w-96 h-96 opacity-[0.12] -z-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{
          y: springY1,
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.4) 60deg, transparent 120deg)",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
        }}
      />
      {/* Parallax orb 2 */}
      <motion.div
        className="absolute bottom-32 left-12 w-72 h-72 opacity-[0.08] -z-10"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          y: springY2,
          background:
            "conic-gradient(from 180deg, transparent 0deg, rgba(139,92,246,0.5) 60deg, transparent 120deg)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.022]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(251,191,36,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,191,36,0.8) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <motion.div
        style={{ y: yContent, opacity }}
        className="max-w-5xl mx-auto text-center space-y-10 will-change-transform"
      >
        {/* Social proof pill */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="flex items-center gap-2 glass rounded-full px-4 py-2 border border-white/8 cursor-default"
          >
            <div className="flex -space-x-1.5">
              {["bg-gold-400", "bg-violet-400", "bg-mint-400", "bg-coral-400"].map(
                (c, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 400 }}
                    className={`w-5 h-5 rounded-full ${c} border border-obsidian-900`}
                  />
                )
              )}
            </div>
            <span className="text-white/50 text-xs font-sans">
              1,200+ members saving together
            </span>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.06, type: "spring" }}
                >
                  <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.div
          variants={staggerContainer(0.12, 0.2)}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.h1
            variants={fadeUp}
            className="font-serif text-[clamp(2.8rem,7vw,6rem)] font-bold leading-[1.05] tracking-tight text-white"
          >
            Save together.
          </motion.h1>
          <motion.div variants={fadeUp} className="relative inline-block">
            <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] font-bold leading-[1.05] tracking-tight">
              <span className="text-shimmer">Get paid</span>
              {" "}
              <span className="font-serif italic font-normal text-white/45">
                automatically.
              </span>
            </h1>
            {/* Animated underline */}
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 rounded-full"
            />
          </motion.div>
          <motion.p
            variants={fadeUp}
            className="max-w-2xl mx-auto text-white/50 text-lg leading-relaxed font-sans font-light pt-2"
          >
            ChoreAgent is a savings circle app where every member contributes,
            everyone gets a turn with the full pot, and nothing is left to trust
            — because it all runs on-chain.
          </motion.p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.65 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <div ref={primaryRef}>
            <Link href="/app">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button variant="primary" size="xl" className="group relative overflow-hidden">
                  <motion.span
                    className="absolute inset-0 bg-white/15"
                    initial={{ x: "-100%", skewX: "-15deg" }}
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.5 }}
                  />
                  Start saving
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="#how-it-works">
              <Button variant="outline" size="xl">
                See how it works
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust points */}
        <motion.div
          variants={staggerContainer(0.1, 0.8)}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-center justify-center gap-6 text-white/30 text-xs font-sans"
        >
          {["No signup required", "Zero fees", "Non-custodial"].map((point) => (
            <motion.span
              key={point}
              variants={fadeUp}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-mint-400/60" />
              {point}
            </motion.span>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer(0.12, 0.9)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.9 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 300, damping: 24 },
                },
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="glass rounded-2xl p-4 text-center space-y-1 cursor-default"
            >
              <div className="text-gold-400 font-serif text-2xl font-bold">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={2000}
                />
              </div>
              <div className="text-white/35 text-xs font-sans">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1.5"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 rounded-full bg-gold-400/50"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
