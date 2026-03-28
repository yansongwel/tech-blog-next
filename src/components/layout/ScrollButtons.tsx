"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function ScrollButtons() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      setShowTop(scrollY > 300);
      setShowBottom(scrollY + windowHeight < docHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);
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
          className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted hover:text-foreground hover:border-primary/50 transition-all cursor-pointer animate-fade-in"
          title="回到顶部"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
      {showBottom && (
        <button
          onClick={scrollToBottom}
          className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted hover:text-foreground hover:border-primary/50 transition-all cursor-pointer animate-fade-in"
          title="到达底部"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
