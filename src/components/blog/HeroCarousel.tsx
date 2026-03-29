"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Slide {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  category: { name: string; slug: string };
  slug: string;
}

const gradients = [
  "#1a1a2e, #6366f1",
  "#0f3460, #06b6d4",
  "#1a1a2e, #ec4899",
  "#0d1b2a, #06b6d4",
  "#1a1a2e, #f59e0b",
];

export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    fetch("/api/posts?limit=5")
      .then((res) => res.json())
      .then((data) => { if (data.posts?.length > 0) setSlides(data.posts); })
      .catch(() => {});
  }, []);

  const transitioningRef = useRef(false);
  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);

  const goTo = useCallback((index: number) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setCurrent(index);
    setTimeout(() => { transitioningRef.current = false; }, 500);
  }, []);

  const next = useCallback(() => {
    if (slides.length > 0) goTo((currentRef.current + 1) % slides.length);
  }, [slides.length, goTo]);

  const prev = useCallback(() => {
    if (slides.length > 0) goTo((currentRef.current - 1 + slides.length) % slides.length);
  }, [slides.length, goTo]);

  // Auto-advance (pause on hover)
  useEffect(() => {
    if (slides.length === 0 || paused) return;
    intervalRef.current = setInterval(next, 6000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [slides.length, paused, next]);

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    };
    el.addEventListener("keydown", handleKey);
    return () => el.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (slides.length === 0) {
    return (
      <div className="w-full h-[500px] md:h-[600px] rounded-2xl glass flex items-center justify-center">
        <div className="text-center text-muted">
          <p className="text-lg">暂无推荐文章</p>
          <p className="text-sm mt-1">发布第一篇文章后这里会自动展示</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="推荐文章轮播"
      aria-roledescription="carousel"
      className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-2xl group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`第 ${index + 1} 张，共 ${slides.length} 张: ${slide.title}`}
          aria-hidden={index !== current}
          className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            index === current
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          <div
            className="absolute inset-0"
            style={
              slide.coverImage
                ? {
                    backgroundImage: `url(${slide.coverImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    background: `linear-gradient(135deg, ${gradients[index % gradients.length]})`,
                  }
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/80 text-white rounded-full mb-4">
              {slide.category.name}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
              {slide.title}
            </h2>
            <p className="text-white/70 text-lg max-w-2xl line-clamp-2">
              {slide.excerpt || ""}
            </p>
            <Link
              href={`/blog/${slide.slug}`}
              className="mt-6 inline-block px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-medium transition-colors cursor-pointer"
            >
              阅读全文
            </Link>
          </div>
        </div>
      ))}

      <button
        onClick={prev}
        aria-label="上一张"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="下一张"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            aria-label={`跳转到第 ${index + 1} 张`}
            aria-current={index === current ? "true" : undefined}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              index === current
                ? "w-8 bg-primary"
                : "w-2.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
