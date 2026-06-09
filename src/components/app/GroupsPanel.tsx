"use client";
import { useState } from "react";
import { Users, ChevronRight, Plus, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const groups = [
  {
    id: 1,
    name: "Family Circle",
    members: 5,
    maxMembers: 5,
    amount: 25,
    cycle: 7,
    currentRound: 4,
    nextPayout: "Maria S.",
    status: "active",
    potTotal: 125,
    daysLeft: 2,
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    id: 2,
    name: "Colleagues Fund",
    members: 8,
    maxMembers: 10,
    amount: 50,
    cycle: 14,
    currentRound: 2,
    nextPayout: "James K.",
    status: "active",
    potTotal: 400,
    daysLeft: 6,
    emoji: "💼",
  },
  {
    id: 3,
    name: "City Savers",
    members: 12,
    maxMembers: 12,
    amount: 100,
    cycle: 30,
    currentRound: 1,
    nextPayout: "Aisha K.",
    status: "collecting",
    potTotal: 1200,
    daysLeft: 14,
    emoji: "🏙️",
  },
];

export function GroupsPanel() {
  const [selected, setSelected] = useState<number | null>(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-white">Your Groups</h2>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Button variant="secondary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            New Group
          </Button>
        </motion.div>
      </div>

      <div className="space-y-3">
        {groups.map((group, i) => {
          const isOpen = selected === group.id;
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                onClick={() => setSelected(isOpen ? null : group.id)}
                whileHover={{ scale: isOpen ? 1 : 1.01 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={`glass rounded-2xl p-4 cursor-pointer border transition-all duration-300 ${
                  isOpen
                    ? "border-gold-500/25 shadow-[0_0_0_1px_rgba(251,191,36,0.15),0_8px_32px_rgba(251,191,36,0.06)]"
                    : "border-white/5 hover:border-white/12"
                }`}
              >
                {/* Group header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/15 to-violet-500/15 flex items-center justify-center border border-white/8 text-lg"
                    >
                      {group.emoji}
                    </motion.div>
                    <div>
                      <p className="font-sans font-medium text-white text-sm">{group.name}</p>
                      <p className="text-white/30 text-xs font-sans">
                        {group.members}/{group.maxMembers} members · ${group.amount}/cycle
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={group.status === "active" ? "mint" : group.status === "collecting" ? "gold" : "default"}
                      dot
                    >
                      {group.status}
                    </Badge>
                    <motion.div
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    >
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </motion.div>
                  </div>
                </div>

                {/* Expandable detail */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-white/6 space-y-3">
                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-sans text-white/40">
                            <span>Round {group.currentRound} of {group.members}</span>
                            <span>{group.daysLeft}d remaining</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(group.currentRound / group.members) * 100}%` }}
                              transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Pot total",     value: `$${group.potTotal}` },
                            { label: "Next payout",   value: group.nextPayout     },
                            { label: "Cycle",         value: `${group.cycle}d`    },
                          ].map((item, j) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: j * 0.06 }}
                              className="text-center p-2 rounded-lg bg-white/3 border border-white/5"
                            >
                              <p className="text-white/70 text-xs font-sans font-medium">{item.value}</p>
                              <p className="text-white/25 text-[10px] font-sans mt-0.5">{item.label}</p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Verified line */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-2 text-xs text-mint-400/70 font-sans"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          All {group.members} members ready · collects in {group.daysLeft} days
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
