import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { AutomationActivity } from "@/components/landing/AutomationActivity";
import { TechStack } from "@/components/landing/TechStack";
import { Footer } from "@/components/landing/Footer";
import { GlowOrbs } from "@/components/ui/GlowOrbs";
import { CursorGlow } from "@/components/ui/CursorGlow";

export default function Home() {
  return (
    <div className="min-h-screen bg-obsidian-950 overflow-x-hidden">
      <GlowOrbs />
      <CursorGlow />
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <div id="features">
        <FeaturesGrid />
      </div>
      <div id="automation">
        <AutomationActivity />
      </div>
      <TechStack />
      <Footer />
    </div>
  );
}
