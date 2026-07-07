import { GlowOrbs } from "@/components/ui/GlowOrbs";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4 relative overflow-hidden">
      <GlowOrbs />

      {/* Subtle grid — same as landing hero */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.018]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(251,191,36,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,191,36,0.8) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
