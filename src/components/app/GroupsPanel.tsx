"use client";
import { Users, ChevronRight, Plus, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/components/app/AppDataProvider";

const GROUP_EMOJIS: Record<string, string> = {};
const EMOJI_LIST = ["👨‍👩‍👧‍👦", "💼", "🏙️", "🌱", "🏆", "💡", "🎯", "🤝"];
function emojiFor(id: string): string {
  if (!GROUP_EMOJIS[id]) {
    GROUP_EMOJIS[id] = EMOJI_LIST[Object.keys(GROUP_EMOJIS).length % EMOJI_LIST.length];
  }
  return GROUP_EMOJIS[id];
}

type GroupRow = {
  id: string;
  name: string;
  memberCount: number;
  members: Array<{ id: string; name: string; email: string; status: string }>;
  amount: number;
  cycleDays: number;
  currentRound: number;
  nextPayout: string;
  status: string;
  potTotal: number;
  daysLeft: number;
};

export function GroupsPanel({ onNewGroup }: { onNewGroup?: () => void } = {}) {
  const { groups, loading } = useAppData();
  const [selected, setSelected] = useState<string | null>(null);

  if (loading.groups && groups.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-2xl p-4 h-16 animate-pulse opacity-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-white">Your Groups</h2>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Button variant="secondary" size="sm" onClick={onNewGroup}>
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
                className={`rounded-2xl p-4 cursor-pointer border transition-all duration-300 glass ${
                  isOpen
                    ? "border-gold-500/25 shadow-[0_0_0_1px_rgba(251,191,36,0.15),0_8px_32px_rgba(251,191,36,0.06)]"
                    : "border-white/5 hover:border-white/12"
                }`}
              >
                {/* Group header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/15 to-violet-500/15 flex items-center justify-center border border-white/8 text-lg"
                    >
                      {emojiFor(group.id)}
                    </motion.div>
                    <div className="min-w-0">
                      <p className="truncate font-sans font-medium text-white text-sm">{group.name}</p>
                      <p className="text-white/30 text-xs font-sans">
                        {group.memberCount} members · ₦{group.amount}/cycle
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Badge
                      variant={
                        group.status === "active"
                          ? "mint"
                          : group.status === "collecting"
                          ? "gold"
                          : "default"
                      }
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
                            <span>
                              Round {group.currentRound} of {group.memberCount}
                            </span>
                            <span>{group.daysLeft}d remaining</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(group.currentRound / group.memberCount) * 100}%`,
                              }}
                              transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {[
                            { label: "Pot total", value: `₦${group.potTotal.toLocaleString()}` },
                            { label: "Next payout", value: group.nextPayout },
                            { label: "Cycle", value: `${group.cycleDays}d` },
                          ].map((item, j) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: j * 0.06 }}
                              className="text-center p-2 rounded-lg bg-white/3 border border-white/5"
                            >
                              <p className="text-white/70 text-xs font-sans font-medium">
                                {item.value}
                              </p>
                              <p className="text-white/25 text-[10px] font-sans mt-0.5">
                                {item.label}
                              </p>
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
                          {group.memberCount} members · collects in {group.daysLeft} days
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}

        {groups.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 text-center space-y-4 border border-dashed border-white/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mx-auto">
              <Users className="w-5 h-5 text-gold-400/60" />
            </div>
            <div className="space-y-1">
              <p className="text-white/55 text-sm font-sans font-medium">No savings circles yet</p>
              <p className="text-white/25 text-xs font-sans leading-relaxed">
                Create a group to start collecting. Kyra issues virtual accounts and handles payouts automatically.
              </p>
            </div>
            {onNewGroup && (
              <Button variant="primary" size="sm" onClick={onNewGroup} className="mx-auto">
                <Plus className="w-3.5 h-3.5" />
                Create your first group
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
