"use client";
import { motion } from "framer-motion";
import { CreditCard, Users, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface OnboardingGuideProps {
  hasPaymentMethod: boolean;
  hasGroups: boolean;
  onAddBank: () => void;
  onCreateGroup: () => void;
}

const steps = [
  {
    id: 1,
    icon: CreditCard,
    title: "Add your bank account",
    desc: "So Kyra knows where to send your payout when it's your turn.",
    cta: "Add bank account",
    href: "/app/account",
    action: "bank",
    color: "gold",
  },
  {
    id: 2,
    icon: Users,
    title: "Create a savings circle",
    desc: "Name your group, set the contribution amount, and add members.",
    cta: "Create group",
    href: null,
    action: "group",
    color: "violet",
  },
  {
    id: 3,
    icon: Zap,
    title: "Kyra handles the rest",
    desc: "Virtual accounts are issued, contributions collected, payouts sent — all automated.",
    cta: null,
    href: null,
    action: null,
    color: "mint",
  },
] as const;

const colorMap = {
  gold:   { bg: "bg-gold-500/10",   border: "border-gold-500/20",   icon: "text-gold-400",   badge: "bg-gold-500/15 text-gold-300"   },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", icon: "text-violet-400", badge: "bg-violet-500/15 text-violet-300" },
  mint:   { bg: "bg-mint-500/10",   border: "border-mint-500/20",   icon: "text-mint-400",   badge: "bg-mint-500/15 text-mint-300"   },
};

export function OnboardingGuide({ hasPaymentMethod, hasGroups, onAddBank, onCreateGroup }: OnboardingGuideProps) {
  const completedSteps = [hasPaymentMethod, hasGroups, false];
  const currentStep = completedSteps.findIndex((done) => !done) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/8 glass overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-white">Get started</h2>
          <p className="text-white/35 text-xs font-sans mt-0.5">
            3 steps to your first automated savings circle
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                completedSteps[s.id - 1]
                  ? "w-5 bg-mint-400"
                  : s.id === currentStep
                  ? "w-5 bg-gold-400"
                  : "w-2.5 bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-white/5">
        {steps.map((step, i) => {
          const done = completedSteps[i];
          const active = step.id === currentStep && !done;
          const colors = colorMap[step.color];

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                active ? "bg-white/[0.02]" : ""
              }`}
            >
              {/* Icon / check */}
              <div
                className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border mt-0.5 transition-all duration-300 ${
                  done
                    ? "bg-mint-500/10 border-mint-500/20"
                    : `${colors.bg} ${colors.border}`
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-mint-400" />
                ) : (
                  <step.icon className={`w-4 h-4 ${colors.icon}`} />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-sans font-medium ${done ? "text-white/40 line-through" : "text-white"}`}>
                    {step.title}
                  </p>
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-full ${colors.badge}`}
                    >
                      Up next
                    </motion.span>
                  )}
                </div>
                <p className="text-white/30 text-xs font-sans leading-relaxed">{step.desc}</p>
              </div>

              {/* CTA */}
              {step.cta && active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex-shrink-0"
                >
                  {step.action === "bank" ? (
                    <Button variant="primary" size="sm" onClick={onAddBank}>
                      {step.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : step.action === "group" ? (
                    <Button variant="primary" size="sm" onClick={onCreateGroup}>
                      {step.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : null}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
