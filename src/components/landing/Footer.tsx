"use client";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { staggerContainer, fadeUp } from "@/lib/motion";

const footerLinks = {
  Product: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Dashboard",    href: "/app"           },
    { label: "Groups",       href: "/app/groups"    },
    { label: "Analytics",    href: "/app/analytics" },
  ],
  Company: [
    { label: "About",        href: "#" },
    { label: "Blog",         href: "#" },
    { label: "Careers",      href: "#" },
    { label: "Contact",      href: "#" },
  ],
  Support: [
    { label: "Help Center",  href: "#" },
    { label: "Privacy",      href: "#" },
    { label: "Terms",        href: "#" },
    { label: "Security",     href: "#" },
  ],
};

export function Footer() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <footer className="border-t border-white/5 py-16 px-6 relative overflow-hidden">
      {/* subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px
        bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      <motion.div
        ref={ref}
        variants={staggerContainer(0.07, 0)}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Brand col */}
          <motion.div variants={fadeUp} className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-gold"
              >
                <span className="text-obsidian-950 font-serif font-bold text-sm">C</span>
              </motion.div>
              <span className="font-serif font-bold text-white text-lg">ChoreAgent</span>
            </Link>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs">
              Savings circles for the people who never had time to run one manually.
              Automated, transparent, and trustless.
            </p>
            {/* Status badge */}
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex items-center gap-2 text-white/20 text-xs font-sans"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-mint-400" />
              All systems operational
            </motion.div>
          </motion.div>

          {/* Link cols */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <motion.div key={section} variants={fadeUp} className="space-y-4">
              <p className="text-white/45 text-xs font-sans tracking-widest uppercase">
                {section}
              </p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-white/30 text-sm font-sans hover:text-white transition-colors duration-200 relative group w-fit flex"
                    >
                      <span className="relative">
                        {l.label}
                        <span className="absolute -bottom-px left-0 h-px w-0 bg-gold-400 group-hover:w-full transition-all duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          variants={fadeUp}
          className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-white/20 text-xs font-sans">
            © 2026 ChoreAgent. Built on Celo.
          </p>
          <div className="flex items-center gap-6 text-white/20 text-xs font-sans">
            {["Privacy", "Terms", "Security"].map((l) => (
              <Link key={l} href="#" className="hover:text-white/50 transition-colors">
                {l}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
