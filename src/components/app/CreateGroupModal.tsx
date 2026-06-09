"use client";
import { useState } from "react";
import { X, Plus, Minus, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({ name: "", amount: 25, cycleDays: 7, members: [""] });
  const [loading, setLoading] = useState(false);

  const addMember    = () => setForm(f => ({ ...f, members: [...f.members, ""] }));
  const removeMember = (i: number) => setForm(f => ({ ...f, members: f.members.filter((_, idx) => idx !== i) }));
  const updateMember = (i: number, val: string) => setForm(f => ({ ...f, members: f.members.map((m, idx) => idx === i ? val : m) }));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    toast.success("Group created!", { description: "ChoreAgent will start the first cycle automatically." });
    onClose();
    setTimeout(() => setStep(1), 400);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-obsidian-950/85 backdrop-blur-md"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(12px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
          />

          {/* Modal card */}
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-lg glass-gold rounded-2xl shadow-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h2 className="font-serif text-xl font-semibold text-white">
                  Create a savings group
                </h2>
                <p className="text-white/35 text-xs font-sans mt-0.5">Step {step} of 2</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Step progress */}
            <div className="flex gap-2 px-6 pt-4">
              {[1, 2].map((s) => (
                <div key={s} className="relative flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: s <= step ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-0 left-0 bg-gold-400 rounded-full"
                  />
                </div>
              ))}
            </div>

            {/* Step panels */}
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-white/45 text-xs font-sans tracking-widest uppercase">Group Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Family Savings Circle"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-gold-500/40 border border-white/6 transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-white/45 text-xs font-sans tracking-widest uppercase">Amount per member</label>
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setForm(f => ({ ...f, amount: Math.max(5, f.amount - 5) }))}
                        className="w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <div className="flex-1 text-center">
                        <motion.span
                          key={form.amount}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="font-serif text-3xl font-bold text-gold-400 inline-block"
                        >
                          ${form.amount}
                        </motion.span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setForm(f => ({ ...f, amount: Math.min(500, f.amount + 5) }))}
                        className="w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <input type="range" min={5} max={500} step={5} value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) })}
                      className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/45 text-xs font-sans tracking-widest uppercase">Cycle duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[7, 14, 30].map((d) => (
                        <motion.button
                          key={d}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setForm({ ...form, cycleDays: d })}
                          className={`relative py-2.5 rounded-xl text-sm font-sans border overflow-hidden ${
                            form.cycleDays === d
                              ? "border-gold-500/30 text-gold-300"
                              : "border-white/8 text-white/40 hover:text-white/60"
                          }`}
                        >
                          {form.cycleDays === d && (
                            <motion.span
                              layoutId="cyclePill"
                              className="absolute inset-0 bg-gold-500/10"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{d} days</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button variant="primary" size="lg" fullWidth disabled={!form.name} onClick={() => setStep(2)}>
                      Next: Add Members
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-white/45 text-xs font-sans tracking-widest uppercase">Member wallet addresses</label>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      <AnimatePresence>
                        {form.members.map((m, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              placeholder="0x…"
                              value={m}
                              onChange={(e) => updateMember(i, e.target.value)}
                              className="flex-1 glass rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 text-sm font-mono focus:outline-none border border-white/6 focus:ring-1 focus:ring-gold-500/30 transition-all"
                            />
                            {form.members.length > 1 && (
                              <motion.button
                                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                onClick={() => removeMember(i)}
                                className="p-2 text-white/30 hover:text-coral-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <button onClick={addMember} className="flex items-center gap-1.5 text-violet-400 text-xs font-sans hover:text-violet-300 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add another member
                    </button>
                  </div>

                  <div className="flex gap-2 p-3 rounded-xl bg-gold-500/5 border border-gold-500/12 text-gold-300/60 text-xs font-sans leading-relaxed">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    Each member approves their contribution once. ChoreAgent handles everything after that.
                  </div>

                  {/* Summary */}
                  <div className="glass rounded-xl p-3 space-y-1.5 text-xs font-sans text-white/35">
                    {[
                      ["Group name", form.name],
                      ["Per member", `$${form.amount}`],
                      ["Cycle", `${form.cycleDays} days`],
                      ["Members", String(form.members.filter(Boolean).length)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}</span>
                        <span className="text-white/65">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 border-t border-white/5">
                      <span>Total pot</span>
                      <span className="text-gold-400 font-medium">${form.amount * form.members.filter(Boolean).length}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.div whileHover={{ scale: 1.01 }} className="flex-1">
                      <Button variant="outline" size="lg" fullWidth onClick={() => setStep(1)}>Back</Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.01 }} className="flex-1">
                      <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSubmit}>
                        Create Group
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
