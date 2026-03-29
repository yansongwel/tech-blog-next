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

const CELL_SIZE = 120; // Grid cell size matches connection distance

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: Star[] = [];
    const starCount = 100; // Reduced from 150 for better perf

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

    const mousePos = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Reusable spatial grid to avoid Map allocation per frame
    const grid = new Map<string, number[]>();

    function buildGrid(): void {
      grid.clear();
      for (let i = 0; i < stars.length; i++) {
        const cx = Math.floor(stars[i].x / CELL_SIZE);
        const cy = Math.floor(stars[i].y / CELL_SIZE);
        const key = `${cx},${cy}`;
        const cell = grid.get(key);
        if (cell) cell.push(i);
        else grid.set(key, [i]);
      }
    }

    function getNeighborIndices(grid: Map<string, number[]>, x: number, y: number): number[] {
      const cx = Math.floor(x / CELL_SIZE);
      const cy = Math.floor(y / CELL_SIZE);
      const result: number[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cell = grid.get(`${cx + dx},${cy + dy}`);
          if (cell) result.push(...cell);
        }
      }
      return result;
    }

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      buildGrid();

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
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

        // Draw connections to nearby stars (grid lookup, not O(n²))
        const neighbors = getNeighborIndices(grid, star.x, star.y);
        for (const j of neighbors) {
          if (j <= i) continue; // Avoid duplicate lines
          const other = stars[j];
          const dx = star.x - other.x;
          const dy = star.y - other.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < CELL_SIZE * CELL_SIZE) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / CELL_SIZE) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse attraction
        const mdx = mousePos.x - star.x;
        const mdy = mousePos.y - star.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 200) {
          const force = (200 - mdist) / 200;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${force * 0.2})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
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
