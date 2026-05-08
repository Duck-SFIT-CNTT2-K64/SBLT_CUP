"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function RevealOnScroll({
  children,
  className,
  delay = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("kn-reveal-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("kn-reveal", className)}
      style={delay > 0 ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
