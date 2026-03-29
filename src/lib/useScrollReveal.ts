"use client";

import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to reveal `.scroll-reveal` children
 * inside the given container. Uses a MutationObserver to automatically
 * pick up dynamically added elements (e.g., after data fetching).
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    // Observe all current scroll-reveal elements
    const observeAll = () => {
      container.querySelectorAll(".scroll-reveal:not(.revealed)").forEach((el) => {
        io.observe(el);
      });
    };
    observeAll();

    // Watch for new elements added to the DOM (e.g., after fetch completes)
    const mo = new MutationObserver(() => observeAll());
    mo.observe(container, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return ref;
}
