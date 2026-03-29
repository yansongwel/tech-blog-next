"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MusicPlayer from "@/components/layout/MusicPlayer";
import ParticleBackground from "@/components/effects/ParticleBackground";
import MouseTrail from "@/components/effects/MouseTrail";
import DancingCharacter from "@/components/effects/DancingCharacter";
import LoadingScreen from "@/components/effects/LoadingScreen";
import ScrollButtons from "@/components/layout/ScrollButtons";
import ThemeApplier from "@/components/ThemeApplier";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // null = not yet determined (avoids hydration mismatch)
  // true = show loading screen, false = skip
  const [loading, setLoading] = useState<boolean | null>(null);

  useEffect(() => {
    const visited = sessionStorage.getItem("visited");
    if (visited) {
      setLoading(false);
    } else {
      sessionStorage.setItem("visited", "true");
      setLoading(true);
    }
  }, []);

  return (
    <>
      {loading === true && <LoadingScreen onComplete={() => setLoading(false)} />}
      <ThemeApplier />
      <ParticleBackground />
      <MouseTrail />
      <Navbar />
      <main className="relative z-10 min-h-screen pt-16">{children}</main>
      <Footer />
      <MusicPlayer />
      <ScrollButtons />
      <DancingCharacter />
    </>
  );
}
