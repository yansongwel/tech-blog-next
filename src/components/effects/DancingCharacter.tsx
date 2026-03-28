"use client";

import { useState, useEffect, useRef } from "react";
import { useSiteConfig } from "@/lib/useSiteConfig";

export default function DancingCharacter() {
  const config = useSiteConfig();
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pulse, setPulse] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const messages = [
    `Welcome to ${config.site_name || "TechBlog"}!`,
    "Explore the tech universe",
    "Knowledge is power",
    "Happy Coding!",
    "Stay curious",
    "Level up your skills",
  ];

  const handleClick = () => {
    setPulse(true);
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
    setTimeout(() => setMessage(""), 3000);
    setTimeout(() => setPulse(false), 600);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-40"
      style={{
        bottom: position.y ? "auto" : "100px",
        left: position.x ? `${position.x}px` : "20px",
        top: position.y ? `${position.y}px` : "auto",
      }}
    >
      {/* Speech bubble */}
      {message && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 glass rounded-xl px-4 py-2 text-xs text-accent-light whitespace-nowrap animate-fade-in font-mono">
          {message}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary/30" />
        </div>
      )}

      {/* Holographic AI Core */}
      <div
        className="relative cursor-grab active:cursor-grabbing select-none"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          className="drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        >
          {/* Outer rotating ring */}
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 32 32"
              to="360 32 32"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Middle ring */}
          <circle
            cx="32" cy="32" r="22"
            fill="none"
            stroke="url(#ringGrad2)"
            strokeWidth="0.8"
            strokeDasharray="8 3"
            opacity="0.4"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 32 32"
              to="0 32 32"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Core glow */}
          <circle cx="32" cy="32" r="14" fill="url(#coreGrad)" opacity="0.9">
            <animate
              attributeName="r"
              values={pulse ? "14;18;14" : "14;15;14"}
              dur={pulse ? "0.3s" : "2s"}
              repeatCount="indefinite"
            />
          </circle>

          {/* Inner bright core */}
          <circle cx="32" cy="32" r="6" fill="#fff" opacity="0.3">
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Orbiting dots */}
          {[0, 120, 240].map((angle, i) => (
            <circle key={i} cx="32" cy="8" r="2" fill={i === 0 ? "#6366f1" : i === 1 ? "#06b6d4" : "#8b5cf6"}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`${angle} 32 32`}
                to={`${angle + 360} 32 32`}
                dur={`${3 + i}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.4;1"
                dur={`${1.5 + i * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* Hex pattern in core */}
          <text x="32" y="36" textAnchor="middle" fill="#fff" fontSize="12" fontFamily="monospace" opacity="0.8">
            AI
          </text>

          <defs>
            <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="60%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0.6" />
            </radialGradient>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="ringGrad2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-surface border border-border rounded-full text-xs text-muted hover:text-foreground flex items-center justify-center cursor-pointer"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
