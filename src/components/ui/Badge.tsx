import { clsx } from "clsx";
import { ReactNode } from "react";

type BadgeVariant = "gold" | "violet" | "mint" | "coral" | "default";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  gold: "bg-gold-500/10 text-gold-400 border-gold-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  mint: "bg-mint-500/10 text-mint-400 border-mint-500/20",
  coral: "bg-coral-500/10 text-coral-400 border-coral-500/20",
  default: "bg-white/5 text-white/60 border-white/10",
};

const dotColors: Record<BadgeVariant, string> = {
  gold: "bg-gold-400",
  violet: "bg-violet-400",
  mint: "bg-mint-400",
  coral: "bg-coral-400",
  default: "bg-white/40",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        "font-sans tracking-wide",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full pulse-dot",
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
