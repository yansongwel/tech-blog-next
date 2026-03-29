"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollButtons from "@/components/layout/ScrollButtons";
import ThemeApplier from "@/components/ThemeApplier";
import { useSiteConfig } from "@/lib/useSiteConfig";

// Lazy load heavy visual effects (canvas/animation components)
const LoadingScreen = dynamic(() => import("@/components/effects/LoadingScreen"), { ssr: false });
const ParticleBackground = dynamic(() => import("@/components/effects/ParticleBackground"), { ssr: false });
const MouseTrail = dynamic(() => import("@/components/effects/MouseTrail"), { ssr: false });
const DancingCharacter = dynamic(() => import("@/components/effects/DancingCharacter"), { ssr: false });
const MusicPlayer = dynamic(() => import("@/components/layout/MusicPlayer"), { ssr: false });

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = useSiteConfig();
  // null = not yet determined (avoids hydration mismatch)
  // true = show loading screen, false = skip
  const [loading, setLoading] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Sync with browser APIs (sessionStorage, window) — must run in effect
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const visited = sessionStorage.getItem("visited");
    if (visited) {
      setLoading(false);
    } else {
      sessionStorage.setItem("visited", "true");
      setLoading(true);
    }
    setIsMobile(window.innerWidth < 768 || navigator.hardwareConcurrency <= 2);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const showCharacter = !isMobile && config.dancing_character !== "off";

  return (
    <>
      {loading === true && <LoadingScreen onComplete={() => setLoading(false)} />}
      <ThemeApplier />
      {!isMobile && <ParticleBackground />}
      {!isMobile && <MouseTrail />}
      <Navbar />
      <main className="relative z-10 min-h-screen pt-16">{children}</main>
      <Footer />
      <MusicPlayer />
      <ScrollButtons />
      {showCharacter && <DancingCharacter />}
    </>
  );
}
