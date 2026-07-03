"use client";
import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardStats }    from "@/components/app/DashboardStats";
import { GroupsPanel }       from "@/components/app/GroupsPanel";
import { SavingsChart }      from "@/components/app/SavingsChart";
import { TransactionFeed }   from "@/components/app/TransactionFeed";
import { CreateGroupModal }  from "@/components/app/CreateGroupModal";
import { Button }            from "@/components/ui/Button";
import { Badge }             from "@/components/ui/Badge";
import { PageTransition }    from "@/components/ui/PageTransition";

export default function AppDashboard() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen space-y-5 px-4 pb-6 pt-20 sm:px-6 lg:p-8 lg:pt-8">

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
            <p className="text-white/35 text-sm font-sans mt-0.5">
              Good morning · Automation ran 11h ago
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/6 text-white/40 transition-colors glass hover:text-white"
            >
              <Bell className="w-4 h-4" />
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold-400"
              />
            </motion.button>
            <motion.div className="flex-1 sm:flex-none" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="primary" size="md" onClick={() => setCreateOpen(true)} fullWidth>
                <Plus className="w-4 h-4" />
                New Group
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <DashboardStats />

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">
          <div className="space-y-5 xl:col-span-2 xl:space-y-6">
            <SavingsChart />
            <TransactionFeed />
          </div>
          <div>
            <GroupsPanel />
          </div>
        </div>

        {/* Automation status strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
          whileHover={{ scale: 1.005 }}
          className="flex flex-col gap-4 rounded-2xl border border-white/5 p-4 glass sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ boxShadow: ["0 0 0px rgba(139,92,246,0)", "0 0 16px rgba(139,92,246,0.3)", "0 0 0px rgba(139,92,246,0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm"
            >
              ⚡
            </motion.div>
            <div>
              <p className="text-white/60 text-sm font-sans">
                Automation ran successfully · collected $550 across 3 groups
              </p>
              <p className="text-white/25 text-xs font-sans">
                All automated · 0 issues · 11h ago
              </p>
            </div>
          </div>
          <Badge variant="mint" dot>Healthy</Badge>
        </motion.div>

        <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </PageTransition>
  );
}
