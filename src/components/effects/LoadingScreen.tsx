"use client";

import { useEffect, useState, useRef } from "react";
import { useSiteConfig } from "@/lib/useSiteConfig";

export default function LoadingScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"matrix" | "logo" | "done">("matrix");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  const config = useSiteConfig();
  onCompleteRef.current = onComplete;

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || phase !== "matrix") return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF<>/{}[]";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 15, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#6366f1";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.5 ? "#6366f1" : "#06b6d4";
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, [phase]);

  // Progress bar - only runs once on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setPhase("logo");
          setTimeout(() => onCompleteRef.current(), 1200);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div
          className={`transition-all duration-1000 ${
            phase === "logo" ? "scale-110 opacity-100" : "opacity-90"
          }`}
        >
          <h1 className="text-6xl font-bold gradient-text tracking-wider">
            {config.site_name || "TechBlog"}
          </h1>
          <p className="text-center text-muted mt-2 font-mono text-sm">
            {config.site_description || "Loading..."}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: "linear-gradient(90deg, #6366f1, #06b6d4)",
            }}
          />
        </div>
        <span className="text-xs font-mono text-muted">
          {Math.min(Math.floor(progress), 100)}% Loading...
        </span>
      </div>
    </div>
  );
}
