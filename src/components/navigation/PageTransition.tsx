'use client';

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition wraps page content with fade/slide transitions
 * Respects user's reduced motion preferences
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousPathname = useRef(pathname);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      setDisplayChildren(children);
      return;
    }

    // Only animate when pathname changes
    if (pathname !== previousPathname.current) {
      setIsAnimating(true);

      // Wait for exit animation, then update content
      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        previousPathname.current = pathname;

        // Small delay to ensure DOM update before entrance animation
        requestAnimationFrame(() => {
          setIsAnimating(false);
        });
      }, 150);

      return () => clearTimeout(exitTimer);
    } else {
      // No pathname change, just update children
      setDisplayChildren(children);
    }
  }, [pathname, children, prefersReducedMotion]);

  // If reduced motion is preferred, render without animation
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        isAnimating
          ? "opacity-0 translate-y-2"
          : "opacity-100 translate-y-0",
        className
      )}
    >
      {displayChildren}
    </div>
  );
}
