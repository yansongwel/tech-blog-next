"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  pulse: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: Star[] = [];
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const mousePos = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        star.y += star.speed;
        star.pulse += 0.02;

        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }

        const pulseFactor = Math.sin(star.pulse) * 0.3 + 0.7;
        const alpha = star.opacity * pulseFactor;

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.fill();

        // Draw connections to nearby stars
        for (const other of stars) {
          const dx = star.x - other.x;
          const dy = star.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${
              (1 - dist / 120) * 0.15
            })`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse attraction
        const dx = mousePos.x - star.x;
        const dy = mousePos.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${force * 0.2})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
