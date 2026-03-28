"use client";

import { useState, useEffect, useRef } from "react";

// Animated pixel-art character using CSS sprite animation
// Can be replaced with Live2D model later
export default function DancingCharacter() {
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const messages = [
    "Welcome! 欢迎来到TechBlog~",
    "今天学到新知识了吗？",
    "点个赞再走呗~",
    "记得订阅哦！",
    "Happy Coding! 🎉",
    "有问题欢迎留言~",
  ];

  const handleClick = () => {
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
    setTimeout(() => setMessage(""), 3000);
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 glass rounded-xl px-3 py-2 text-xs text-foreground whitespace-nowrap animate-fade-in">
          {message}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
        </div>
      )}

      {/* Character - CSS animated dancing figure */}
      <div
        className="relative cursor-grab active:cursor-grabbing select-none"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {/* SVG Dancing Character */}
        <svg
          width="60"
          height="80"
          viewBox="0 0 60 80"
          className="drop-shadow-lg"
        >
          {/* Head */}
          <circle cx="30" cy="16" r="12" fill="#FFD93D" stroke="#333" strokeWidth="1.5">
            <animate
              attributeName="cy"
              values="16;14;16"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Eyes */}
          <circle cx="25" cy="14" r="2" fill="#333">
            <animate
              attributeName="cy"
              values="14;12;14"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="35" cy="14" r="2" fill="#333">
            <animate
              attributeName="cy"
              values="14;12;14"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Smile */}
          <path
            d="M24 19 Q30 24 36 19"
            fill="none"
            stroke="#333"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M24 19 Q30 24 36 19;M24 17 Q30 22 36 17;M24 19 Q30 24 36 19"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </path>
          {/* Body */}
          <rect x="22" y="28" width="16" height="22" rx="4" fill="#6366f1">
            <animate
              attributeName="y"
              values="28;26;28"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </rect>
          {/* Left arm */}
          <line x1="22" y1="32" x2="8" y2="42" stroke="#FFD93D" strokeWidth="4" strokeLinecap="round">
            <animate
              attributeName="x2"
              values="8;4;8"
              dur="0.3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="y2"
              values="42;35;42"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </line>
          {/* Right arm */}
          <line x1="38" y1="32" x2="52" y2="42" stroke="#FFD93D" strokeWidth="4" strokeLinecap="round">
            <animate
              attributeName="x2"
              values="52;56;52"
              dur="0.3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="y2"
              values="42;35;42"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </line>
          {/* Left leg */}
          <line x1="26" y1="50" x2="18" y2="72" stroke="#333" strokeWidth="4" strokeLinecap="round">
            <animate
              attributeName="x2"
              values="18;14;18"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </line>
          {/* Right leg */}
          <line x1="34" y1="50" x2="42" y2="72" stroke="#333" strokeWidth="4" strokeLinecap="round">
            <animate
              attributeName="x2"
              values="42;46;42"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </line>
          {/* Shoes */}
          <ellipse cx="18" cy="74" rx="6" ry="3" fill="#06b6d4">
            <animate
              attributeName="cx"
              values="18;14;18"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </ellipse>
          <ellipse cx="42" cy="74" rx="6" ry="3" fill="#06b6d4">
            <animate
              attributeName="cx"
              values="42;46;42"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </ellipse>
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
