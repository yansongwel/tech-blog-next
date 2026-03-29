"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSiteConfig } from "@/lib/useSiteConfig";

type Template = "matrix" | "cyber" | "terminal" | "radar" | "glitch";

interface VisitorInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
}

export default function LoadingScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "done">("loading");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  const config = useSiteConfig();
  const template = (config.loading_template || "matrix") as Template;
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Fetch visitor info
  useEffect(() => {
    fetch("/api/visitor-info")
      .then((res) => res.json())
      .then((data) => { if (data.ip) setVisitorInfo(data); })
      .catch(() => {});
  }, []);

  // ===================== CANVAS EFFECTS =====================

  const drawMatrix = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, drops: number[], fontSize: number) => {
    const chars = "01アイウエオカキクケコサシスセソ<>/{}[]ABCDEF";
    ctx.fillStyle = "rgba(10, 10, 15, 0.05)";
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${fontSize}px monospace`;
    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillStyle = Math.random() > 0.5 ? "#6366f1" : "#06b6d4";
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }, []);

  const drawCyber = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.fillStyle = "rgba(10, 10, 15, 0.1)";
    ctx.fillRect(0, 0, w, h);
    // Hex grid
    const size = 30;
    for (let x = 0; x < w + size * 2; x += size * 1.5) {
      for (let y = 0; y < h + size * 2; y += size * 1.732) {
        const offsetX = ((y / (size * 1.732)) % 2) * size * 0.75;
        const cx = x + offsetX;
        const cy = y;
        const dist = Math.sqrt((cx - w / 2) ** 2 + (cy - h / 2) ** 2);
        const pulse = Math.sin(frame * 0.02 - dist * 0.005) * 0.5 + 0.5;
        if (pulse > 0.6) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + Math.cos(angle) * size * 0.4;
            const py = cy + Math.sin(angle) * size * 0.4;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = `rgba(99, 102, 241, ${pulse * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    // Floating data lines
    for (let i = 0; i < 5; i++) {
      const y = (frame * (1 + i * 0.5) + i * 200) % (h + 100) - 50;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 20) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + frame * 0.05) * 15);
      }
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.15 + i * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, []);

  const drawRadar = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.fillStyle = "rgba(10, 10, 15, 0.08)";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(w, h) * 0.35;
    // Circles
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * (i / 4), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 + i * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Cross lines
    ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
    ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
    // Sweep
    const angle = (frame * 0.03) % (Math.PI * 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gradient = (ctx as any).createConicGradient?.(angle, cx, cy);
    if (gradient) {
      gradient.addColorStop(0, "rgba(6, 182, 212, 0.3)");
      gradient.addColorStop(0.1, "rgba(6, 182, 212, 0)");
      gradient.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.fill();
    } else {
      // Fallback: sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Glow trail
      for (let a = 0; a < 0.5; a += 0.02) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle - a) * maxR, cy + Math.sin(angle - a) * maxR);
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 - a * 0.6})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    // Random blips
    if (frame % 30 === 0) {
      const bx = cx + (Math.random() - 0.5) * maxR * 1.6;
      const by = cy + (Math.random() - 0.5) * maxR * 1.6;
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
      ctx.fill();
    }
  }, []);

  const drawGlitch = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.fillStyle = "rgba(10, 10, 15, 0.15)";
    ctx.fillRect(0, 0, w, h);
    // Scanlines
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.01 + Math.random() * 0.01})`;
      ctx.fillRect(0, y, w, 1);
    }
    // Glitch blocks
    if (frame % 5 === 0) {
      for (let i = 0; i < 3; i++) {
        const gy = Math.random() * h;
        const gh = Math.random() * 20 + 5;
        const gx = Math.random() * w * 0.3;
        const gw = Math.random() * w * 0.7;
        ctx.fillStyle = Math.random() > 0.5
          ? `rgba(99, 102, 241, ${Math.random() * 0.15})`
          : `rgba(6, 182, 212, ${Math.random() * 0.15})`;
        ctx.fillRect(gx, gy, gw, gh);
      }
    }
    // Digital noise
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = Math.random() * 3 + 1;
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "99, 102, 241" : "6, 182, 212"}, ${Math.random() * 0.5})`;
      ctx.fillRect(x, y, s, s);
    }
    // Horizontal shift
    if (frame % 60 < 5) {
      const shift = (Math.random() - 0.5) * 20;
      const sy = Math.random() * h;
      const sh = Math.random() * 40 + 10;
      const imgData = ctx.getImageData(0, sy, w, sh);
      ctx.putImageData(imgData, shift, sy);
    }
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || phase === "done") return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);
    let frame = 0;
    let animId: number;

    const animate = () => {
      frame++;
      switch (template) {
        case "cyber":
          drawCyber(ctx, canvas.width, canvas.height, frame);
          break;
        case "radar":
          drawRadar(ctx, canvas.width, canvas.height, frame);
          break;
        case "glitch":
          drawGlitch(ctx, canvas.width, canvas.height, frame);
          break;
        case "terminal":
          // Terminal uses DOM, minimal canvas
          ctx.fillStyle = "rgba(10, 10, 15, 0.03)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
        default: // matrix
          drawMatrix(ctx, canvas.width, canvas.height, drops, fontSize);
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [phase, template, drawMatrix, drawCyber, drawRadar, drawGlitch]);

  // Terminal mode: simulated boot log
  useEffect(() => {
    if (template !== "terminal" || (phase !== "loading" && phase !== "ready")) return;
    const siteName = config.site_name || "TechBlog";
    const lines = [
      `> Booting ${siteName} System v3.0.2...`,
      "> Initializing kernel modules...",
      "> [OK] Network stack loaded",
      "> [OK] GPU acceleration enabled",
      "> Scanning visitor signature...",
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) {
        setTerminalLines((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 400);
    return () => clearInterval(timer);
  }, [template, phase, config.site_name]);

  // Add visitor info to terminal after it loads
  useEffect(() => {
    if (template !== "terminal" || !visitorInfo) return;
    const timer = setTimeout(() => {
      const location = [visitorInfo.city, visitorInfo.region, visitorInfo.country].filter(Boolean).join(", ");
      setTerminalLines((prev) => [
        ...prev,
        `> [DETECT] IP: ${visitorInfo.ip}`,
        location ? `> [LOCATE] ${location}` : "> [LOCATE] Unknown region",
        `> [OK] Welcome, traveler from ${location || "the void"}`,
        "> System ready. Launching interface...",
      ]);
    }, 2200);
    return () => clearTimeout(timer);
  }, [template, visitorInfo]);

  // Auto-enter config from backend
  const autoEnter = config.loading_auto_enter === "true";
  const autoDelay = parseInt(config.loading_duration || "0") * 1000;
  const [countdown, setCountdown] = useState<number | null>(null);

  // Progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setPhase("ready");
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Auto-enter countdown (only when enabled and progress complete)
  useEffect(() => {
    if (phase !== "ready" || !autoEnter || autoDelay <= 0) return;
    const seconds = Math.ceil(autoDelay / 1000);
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, autoEnter, autoDelay]);

  const handleEnter = () => {
    setPhase("done");
    onCompleteRef.current();
  };

  if (phase === "done") return null;

  const locationStr = visitorInfo
    ? [visitorInfo.city, visitorInfo.region, visitorInfo.country].filter(Boolean).join(", ")
    : "";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg px-6">
        {/* Logo */}
        <div
          className={`transition-all duration-1000 text-center ${
            phase === "ready" ? "scale-110 opacity-100" : "opacity-90"
          }`}
        >
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text tracking-wider">
            {config.site_name || "TechBlog"}
          </h1>
          <p className="text-center text-muted mt-2 font-mono text-sm">
            {config.site_description || "Loading..."}
          </p>
        </div>

        {/* Visitor Welcome (non-terminal templates) */}
        {template !== "terminal" && visitorInfo && (
          <div className="animate-fade-in text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-mono text-white/60">
                IP: <span className="text-cyan-400">{visitorInfo.ip}</span>
              </span>
            </div>
            {locationStr && (
              <p className="text-xs text-white/40 font-mono">
                Signal from <span className="text-indigo-400">{locationStr}</span>
              </p>
            )}
          </div>
        )}

        {/* Terminal output (terminal template only) */}
        {template === "terminal" && (
          <div className="w-full max-w-md bg-black/60 border border-green-500/20 rounded-lg p-4 font-mono text-xs space-y-1 max-h-48 overflow-hidden backdrop-blur-sm">
            {terminalLines.map((line, i) => (
              <div
                key={i}
                className={`animate-fade-in ${
                  line.includes("[OK]") ? "text-green-400" :
                  line.includes("[DETECT]") || line.includes("[LOCATE]") ? "text-cyan-400" :
                  line.includes("Welcome") ? "text-indigo-400 font-bold" :
                  "text-white/70"
                }`}
              >
                {line}
              </div>
            ))}
            <span className="inline-block w-2 h-4 bg-green-400/80 animate-pulse" />
          </div>
        )}

        {/* Progress bar (visible during loading phase) */}
        {phase === "loading" && (
          <div className="w-64 space-y-2">
            <div className="h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: template === "terminal"
                    ? "linear-gradient(90deg, #22c55e, #06b6d4)"
                    : template === "glitch"
                      ? "linear-gradient(90deg, #f43f5e, #6366f1)"
                      : "linear-gradient(90deg, #6366f1, #06b6d4)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-white/40">
              <span>{Math.min(Math.floor(progress), 100)}%</span>
              <span>{template === "terminal" ? "BOOT" : "LOADING"}...</span>
            </div>
          </div>
        )}

        {/* Enter button (visible when ready) */}
        {phase === "ready" && (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <button
              onClick={handleEnter}
              className="group relative cursor-pointer"
            >
              {/* Outer glow ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-60 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 animate-pulse" />
              {/* Button body */}
              <div className="relative flex items-center gap-3 px-10 py-4 bg-[#0a0a0f]/80 border border-white/10 rounded-2xl backdrop-blur-xl group-hover:border-primary/50 transition-all duration-300 group-hover:scale-105">
                <span className="text-lg font-bold tracking-widest text-white group-hover:text-primary-light transition-colors">
                  探 索 世 界
                </span>
                <svg className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
            {/* Auto-enter countdown */}
            {autoEnter && countdown !== null && countdown > 0 && (
              <p className="text-xs font-mono text-white/30 animate-pulse">
                {countdown}s 后自动进入
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
