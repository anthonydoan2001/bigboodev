'use client';

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, ReactNode, useSyncExternalStore } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Reduced motion preference using useSyncExternalStore
function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
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
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => setDisplayChildren(children), 0);
      return () => clearTimeout(timer);
    }

    // Only animate when pathname changes
    if (pathname !== previousPathname.current) {
      // Use setTimeout to make setState asynchronous
      const startTimer = setTimeout(() => setIsAnimating(true), 0);

      // Wait for exit animation, then update content
      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        previousPathname.current = pathname;

        // Small delay to ensure DOM update before entrance animation
        requestAnimationFrame(() => {
          setIsAnimating(false);
        });
      }, 150);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(exitTimer);
      };
    } else {
      // No pathname change, just update children
      const timer = setTimeout(() => setDisplayChildren(children), 0);
      return () => clearTimeout(timer);
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
