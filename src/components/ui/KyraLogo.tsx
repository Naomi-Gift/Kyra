"use client";

/**
 * KyraLogo
 *
 * A standalone SVG logo component used in the Navbar and AppSidebar.
 *
 * Mark:  Geometric "K" built from two diagonal strokes meeting a vertical bar,
 *        set inside a rounded square with a gold gradient fill.
 *        The strokes are cut in obsidian so they read on any dark background.
 *
 * Props:
 *   size        — pixel size of the mark square (default 32)
 *   showWordmark — whether to render "Kyra" text beside the mark (default true)
 *   className   — extra classes on the wrapper
 */

import { motion } from "framer-motion";

interface KyraLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function KyraLogo({ size = 32, showWordmark = true, className }: KyraLogoProps) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      {/* ── Mark ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Primary gold gradient */}
          <linearGradient id="kyra-gold" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="55%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Subtle inner shine */}
          <linearGradient id="kyra-shine" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background rounded square */}
        <rect width="32" height="32" rx="8" fill="url(#kyra-gold)" />

        {/* Inner shine overlay */}
        <rect width="32" height="32" rx="8" fill="url(#kyra-shine)" />

        {/* ── K glyph ──
            Vertical bar: x=10, from y=8 to y=24
            Upper diagonal: from (10,16) → (22,8)
            Lower diagonal: from (10,16) → (22,24)
            Stroke width 3, round caps for a clean premium feel
        */}
        <line x1="10.5" y1="8"  x2="10.5" y2="24" stroke="#050508" strokeWidth="3"   strokeLinecap="round" />
        <line x1="10.5" y1="16" x2="22"   y2="8"  stroke="#050508" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="10.5" y1="16" x2="22"   y2="24" stroke="#050508" strokeWidth="2.8" strokeLinecap="round" />
      </svg>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <span
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: "-0.01em" }}
          className="text-white leading-none select-none"
        >
          Kyra
        </span>
      )}
    </span>
  );
}

/**
 * Animated version — wraps KyraLogo with Framer Motion hover / tap.
 * Use this in interactive contexts (nav, sidebar brand).
 */
export function KyraLogoAnimated({ size = 32, showWordmark = true, className }: KyraLogoProps) {
  return (
    <motion.span
      className={`flex items-center gap-2 ${className ?? ""}`}
      whileHover="hover"
      whileTap="tap"
    >
      <motion.span
        variants={{
          hover: { scale: 1.08, rotate: -4 },
          tap:   { scale: 0.95 },
        }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        style={{ display: "inline-flex" }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="kyra-gold-a" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#fde68a" />
              <stop offset="55%"  stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="kyra-shine-a" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#kyra-gold-a)" />
          <rect width="32" height="32" rx="8" fill="url(#kyra-shine-a)" />
          <line x1="10.5" y1="8"  x2="10.5" y2="24" stroke="#050508" strokeWidth="3"   strokeLinecap="round" />
          <line x1="10.5" y1="16" x2="22"   y2="8"  stroke="#050508" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="10.5" y1="16" x2="22"   y2="24" stroke="#050508" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </motion.span>

      {showWordmark && (
        <motion.span
          variants={{ hover: { x: 2 }, tap: { x: 0 } }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: "-0.01em" }}
          className="text-white leading-none select-none"
        >
          Kyra
        </motion.span>
      )}
    </motion.span>
  );
}
