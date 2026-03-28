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

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start with loading=true on both server and client to avoid hydration mismatch
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const visited = sessionStorage.getItem("visited");
    if (visited) {
      setLoading(false);
    } else {
      sessionStorage.setItem("visited", "true");
    }
  }, []);

  return (
    <>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
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
