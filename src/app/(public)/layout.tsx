"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MusicPlayer from "@/components/layout/MusicPlayer";
import ParticleBackground from "@/components/effects/ParticleBackground";
import MouseTrail from "@/components/effects/MouseTrail";
import DancingCharacter from "@/components/effects/DancingCharacter";
import LoadingScreen from "@/components/effects/LoadingScreen";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(() => {
    // Only show full loading animation on first visit
    if (typeof window !== "undefined") {
      const visited = sessionStorage.getItem("visited");
      if (visited) return false;
      sessionStorage.setItem("visited", "true");
      return true;
    }
    return true;
  });

  return (
    <>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      <ParticleBackground />
      <MouseTrail />
      <Navbar />
      <main className="relative z-10 min-h-screen pt-16">{children}</main>
      <Footer />
      <MusicPlayer />
      <DancingCharacter />
    </>
  );
}
