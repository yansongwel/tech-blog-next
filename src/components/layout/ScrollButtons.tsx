"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function ScrollButtons() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        setShowTop(scrollY > 200);
        setShowBottom(scrollY + windowHeight < docHeight - 100);
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });

  return (
    <div className="fixed right-5 bottom-24 z-40 flex flex-col gap-2">
      {showTop && (
        <button
          onClick={scrollToTop}
          aria-label="回到顶部"
          className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted hover:text-foreground hover:border-primary/50 transition-all cursor-pointer animate-fade-in focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
      {showBottom && (
        <button
          onClick={scrollToBottom}
          aria-label="到达底部"
          className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted hover:text-foreground hover:border-primary/50 transition-all cursor-pointer animate-fade-in focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
