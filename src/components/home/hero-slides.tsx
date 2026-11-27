"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Shows one slide at a time with dot controls; auto-advances unless the user prefers reduced motion. */
export function HeroSlides({ count, children }: { count: number; children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const slides = Children.toArray(children);

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => window.clearInterval(t);
  }, [count]);

  return (
    <div className="relative">
      {slides.map((slide, i) => (
        <div key={i} hidden={i !== index} aria-hidden={i !== index}>
          {slide}
        </div>
      ))}
      {count > 1 && (
        <div className="absolute right-2 bottom-0 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === index ? "bg-primary w-6" : "w-2.5 bg-white shadow",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
