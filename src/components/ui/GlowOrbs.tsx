"use client";
import { motion } from "framer-motion";

export function GlowOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
      {/* Top-left violet — slow drift */}
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="orb w-[640px] h-[640px] -top-64 -left-32"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)" }}
      />
      {/* Top-right gold — counter-drift */}
      <motion.div
        animate={{ x: [0, -25, 20, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="orb w-[520px] h-[520px] -top-32 -right-48"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)" }}
      />
      {/* Bottom-left mint */}
      <motion.div
        animate={{ x: [0, 20, -15, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        className="orb w-[420px] h-[420px] bottom-0 -left-32"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)" }}
      />
      {/* Center deep — subtle breathe */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="orb w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 60%)" }}
      />
    </div>
  );
}
