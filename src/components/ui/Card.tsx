import { clsx } from "clsx";
import { ReactNode } from "react";

type CardVariant = "default" | "gold" | "violet" | "mint";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  lift?: boolean;
  onClick?: () => void;
}

const variants: Record<CardVariant, string> = {
  default: "glass",
  gold: "glass-gold border-glow-gold",
  violet: "glass-violet border-glow-violet",
  mint: "bg-mint-500/4 border border-mint-500/15",
};

export function Card({
  children,
  variant = "default",
  className,
  lift,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl p-6",
        variants[variant],
        lift && "card-lift cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
