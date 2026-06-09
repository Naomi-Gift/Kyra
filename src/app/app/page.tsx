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
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-white/35 text-sm font-sans mt-0.5">
              Good morning · Agent ran 11h ago
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2.5 glass rounded-xl text-white/40 hover:text-white transition-colors border border-white/6"
            >
              <Bell className="w-4 h-4" />
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold-400"
              />
            </motion.button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                New Group
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <DashboardStats />

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <SavingsChart />
            <TransactionFeed />
          </div>
          <div>
            <GroupsPanel />
          </div>
        </div>

        {/* Agent status strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
          whileHover={{ scale: 1.005 }}
          className="glass rounded-2xl p-4 flex items-center justify-between border border-white/5"
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
                Agent ran successfully · collected $550 across 3 groups
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
