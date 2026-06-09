import { clsx } from "clsx";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: [
    "relative overflow-hidden",
    "bg-gradient-to-r from-gold-500 to-gold-400",
    "text-obsidian-950 font-semibold",
    "shadow-gold",
    "hover:from-gold-400 hover:to-gold-300",
    "active:scale-[0.98]",
    "before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%]",
    "hover:before:translate-x-[100%] before:transition-transform before:duration-500 before:skew-x-12",
  ].join(" "),
  secondary: [
    "glass-violet",
    "text-violet-300 font-medium",
    "hover:bg-violet-500/10 hover:text-violet-200",
    "active:scale-[0.98]",
  ].join(" "),
  ghost: [
    "bg-transparent text-white/60",
    "hover:text-white hover:bg-white/5",
    "active:scale-[0.98]",
  ].join(" "),
  outline: [
    "border border-white/15 bg-transparent",
    "text-white/70 hover:text-white",
    "hover:border-white/30 hover:bg-white/5",
    "active:scale-[0.98]",
  ].join(" "),
  danger: [
    "bg-coral-500/10 border border-coral-500/20",
    "text-coral-400 hover:bg-coral-500/20",
    "active:scale-[0.98]",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-2.5 text-sm rounded-xl",
  xl: "px-8 py-3.5 text-base rounded-2xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading,
  onClick,
  type = "button",
  fullWidth,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2",
        "font-sans transition-all duration-200",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "select-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading…
        </>
      ) : (
        children
      )}
    </button>
  );
}
