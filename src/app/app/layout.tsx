import { AppSidebar } from "@/components/app/AppSidebar";
import { GlowOrbs } from "@/components/ui/GlowOrbs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-obsidian-950">
      <GlowOrbs />
      <AppSidebar />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  );
}
