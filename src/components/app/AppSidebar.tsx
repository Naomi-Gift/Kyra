"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BarChart3, Settings, Bot, Home, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const nav = [
  { href: "/app",              label: "Dashboard",  icon: LayoutDashboard },
  { href: "/app/groups",       label: "Groups",     icon: Users           },
  { href: "/app/analytics",    label: "Analytics",  icon: BarChart3       },
  { href: "/app/agent",        label: "Agent",      icon: Bot             },
  { href: "/app/wallet",       label: "Wallet",     icon: Wallet          },
  { href: "/app/settings",     label: "Settings",   icon: Settings        },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/5 bg-obsidian-950/85 px-4 backdrop-blur-xl lg:hidden"
      >
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 font-serif text-sm font-bold text-obsidian-950 shadow-gold">
            C
          </span>
          <span className="truncate font-serif text-base font-bold text-white">ChoreAgent</span>
        </Link>
        <span className="rounded-full border border-mint-500/20 bg-mint-500/10 px-2.5 py-1 text-[11px] font-medium text-mint-400">
          Active
        </span>
      </motion.header>

      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 top-0 bottom-0 z-40 hidden w-60 flex-col border-r border-white/5 glass lg:flex"
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-gold"
            >
              <span className="text-obsidian-950 font-serif font-bold text-sm">C</span>
            </motion.div>
            <div>
              <motion.span
                whileHover={{ x: 2 }}
                className="font-serif font-bold text-white text-base block leading-none"
              >
                ChoreAgent
              </motion.span>
              <span className="text-white/25 text-[10px] font-sans">on Celo Mainnet</span>
            </div>
          </Link>
        </div>

      {/* Nav */}
        <nav className="flex-1 p-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }, i) => {
            const active = pathname === href;
            return (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href={href}>
                  <motion.div
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans transition-colors duration-200",
                      active
                        ? "text-gold-300"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebarActive"
                        className="absolute inset-0 rounded-xl bg-gold-500/10 border border-gold-500/20"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    {!active && (
                      <motion.span
                        className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 bg-white/4 transition-opacity"
                      />
                    )}

                    <Icon className={clsx("w-4 h-4 flex-shrink-0 relative z-10", active && "text-gold-400")} />
                    <span className="relative z-10">{label}</span>

                    {active && (
                      <motion.span
                        layoutId="activeDot"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400 relative z-10"
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

      {/* Agent status card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="p-4 border-t border-white/5"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-gold rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs font-sans">Automation</span>
              <span className="flex items-center gap-1.5 text-mint-400 text-xs">
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-mint-400 inline-block"
                />
                Active
              </span>
            </div>
            <p className="text-white/55 text-xs font-sans">Next run in 11h 23m</p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "52%" }}
                transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Back home */}
        <div className="p-4 pt-0">
          <Link href="/">
            <motion.span
              whileHover={{ x: 2 }}
              className="flex items-center gap-2 text-white/20 text-xs hover:text-white/50 transition-colors font-sans"
            >
              <Home className="w-3.5 h-3.5" />
              Back to home
            </motion.span>
          </Link>
        </div>
      </motion.aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 bg-obsidian-950/92 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-gold-500/10 text-gold-300"
                    : "text-white/35 hover:bg-white/5 hover:text-white/70"
                )}
              >
                <Icon className={clsx("h-4 w-4", active && "text-gold-400")} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
