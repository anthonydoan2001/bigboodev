'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, ReactNode } from 'react';

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetchDelay?: number;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * PrefetchLink - Enhanced Link component with hover-based prefetching
 *
 * Performance benefits:
 * - Prefetches route data on hover (before click)
 * - Reduces perceived navigation time by 100-300ms
 * - Uses requestIdleCallback for non-blocking prefetch
 * - Debounced to prevent excessive prefetch calls
 *
 * Use for:
 * - Primary navigation links
 * - Frequently accessed routes
 * - Links that are likely to be clicked
 */
export function PrefetchLink({
  href,
  children,
  className,
  prefetchDelay = 100,
  title,
  style,
}: PrefetchLinkProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPrefetched, setIsPrefetched] = useState(false);

  const handleMouseEnter = useCallback(() => {
    // Don't prefetch if already done
    if (isPrefetched) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce prefetch to avoid excessive calls on quick mouse movements
    timeoutRef.current = setTimeout(() => {
      // Use requestIdleCallback if available for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        requestIdleCallback(
          () => {
            router.prefetch(href);
            setIsPrefetched(true);
          },
          { timeout: 500 }
        );
      } else {
        router.prefetch(href);
        setIsPrefetched(true);
      }
    }, prefetchDelay);
  }, [href, router, isPrefetched, prefetchDelay]);

  const handleMouseLeave = useCallback(() => {
    // Cancel pending prefetch if user moves away quickly
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Also prefetch on focus for keyboard navigation
  const handleFocus = useCallback(() => {
    if (!isPrefetched) {
      router.prefetch(href);
      setIsPrefetched(true);
    }
  }, [href, router, isPrefetched]);

  return (
    <Link
      href={href}
      className={className}
      title={title}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      prefetch={false} // Disable automatic prefetch, we handle it manually
    >
      {children}
    </Link>
  );
}

export default PrefetchLink;
