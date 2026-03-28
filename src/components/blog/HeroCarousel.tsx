"use client";

import { useEffect, useRef, useState } from "react";
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

// Fallback gradient colors per index
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/posts?limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (data.posts?.length > 0) {
          setSlides(data.posts);
        }
      })
      .catch(() => {});
  }, []);

  const goTo = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const next = () => {
    if (slides.length > 0) goTo((current + 1) % slides.length);
  };
  const prev = () => {
    if (slides.length > 0) goTo((current - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (slides.length === 0) return;
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [current, slides.length]);

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
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-2xl group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
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
            <p className="text-white/70 text-lg max-w-2xl">
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
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              index === current
                ? "w-8 bg-primary"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
