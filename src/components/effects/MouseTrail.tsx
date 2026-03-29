"use client";

import { useEffect, useRef } from "react";
import { useSiteConfig } from "@/lib/useSiteConfig";

type Skin = "indigo" | "emerald" | "flame" | "starlight" | "neon"
  | "aurora" | "sakura" | "ocean" | "cyber" | "galaxy";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number; // index into skin colors
}

const SKIN_COLORS: Record<Skin, [string, string]> = {
  indigo:    ["rgba(99, 102, 241,",  "rgba(6, 182, 212,"],    // indigo + cyan
  emerald:   ["rgba(16, 185, 129,",  "rgba(52, 211, 153,"],   // emerald + teal
  flame:     ["rgba(249, 115, 22,",  "rgba(239, 68, 68,"],    // orange + red
  starlight: ["rgba(251, 191, 36,",  "rgba(245, 158, 11,"],   // amber + gold
  neon:      ["rgba(168, 85, 247,",  "rgba(236, 72, 153,"],   // purple + pink
  aurora:    ["rgba(34, 211, 238,",  "rgba(16, 185, 129,"],   // cyan + emerald (极光)
  sakura:    ["rgba(244, 114, 182,", "rgba(251, 207, 232,"],  // pink + light pink (樱花)
  ocean:     ["rgba(14, 165, 233,",  "rgba(56, 189, 248,"],   // sky + light blue (海洋)
  cyber:     ["rgba(0, 255, 136,",   "rgba(0, 200, 255,"],    // matrix green + cyan (赛博)
  galaxy:    ["rgba(139, 92, 246,",  "rgba(217, 70, 239,"],   // violet + fuchsia (银河)
};

const SKIN_BORDER: Record<Skin, string> = {
  indigo:    "border-indigo-400",
  emerald:   "border-emerald-400",
  flame:     "border-orange-400",
  starlight: "border-amber-400",
  neon:      "border-purple-400",
  aurora:    "border-cyan-400",
  sakura:    "border-pink-300",
  ocean:     "border-sky-400",
  cyber:     "border-green-400",
  galaxy:    "border-violet-400",
};

const SKIN_DOT: Record<Skin, string> = {
  indigo:    "bg-cyan-400",
  emerald:   "bg-teal-400",
  flame:     "bg-red-400",
  starlight: "bg-amber-300",
  neon:      "bg-pink-400",
  aurora:    "bg-emerald-400",
  sakura:    "bg-pink-200",
  ocean:     "bg-sky-300",
  cyber:     "bg-green-300",
  galaxy:    "bg-fuchsia-400",
};

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const config = useSiteConfig();
  const skin = (config.mouse_skin || "indigo") as Skin;
  const skinRef = useRef(skin);
  useEffect(() => { skinRef.current = skin; }, [skin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${e.clientX}px`;
        cursorDotRef.current.style.top = `${e.clientY}px`;
      }

      // Spawn particles (cap at 300 to prevent memory bloat)
      if (particlesRef.current.length >= 300) return;
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          maxLife: 1,
          size: Math.random() * 3 + 1,
          hue: Math.random() > 0.5 ? 0 : 1,
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      const budget = Math.max(0, 300 - particlesRef.current.length);
      const count = Math.min(20, budget);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = Math.random() * 4 + 2;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: Math.random() * 4 + 2,
          hue: Math.random() > 0.5 ? 0 : 1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      const colors = SKIN_COLORS[skinRef.current] || SKIN_COLORS.indigo;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        const alpha = p.life;
        const radius = Math.max(0, p.size * p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${colors[p.hue]}${alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="mouse-trail-canvas fixed inset-0 pointer-events-none z-[9998]"
      />
      {/* Custom cursor - outer ring */}
      <div
        ref={cursorRef}
        className={`fixed w-8 h-8 border-2 ${SKIN_BORDER[skin] || SKIN_BORDER.indigo} rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 mix-blend-difference`}
      />
      {/* Custom cursor - inner dot */}
      <div
        ref={cursorDotRef}
        className={`fixed w-1.5 h-1.5 ${SKIN_DOT[skin] || SKIN_DOT.indigo} rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2`}
      />
    </>
  );
}
