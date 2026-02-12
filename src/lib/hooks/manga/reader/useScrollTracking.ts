import { useEffect } from 'react';

interface UseScrollTrackingOptions {
  isPageMode: boolean;
  setCurrentPage: (page: number) => void;
  pageCount: number;
  bookId: string;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  pageRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}

export function useScrollTracking({
  isPageMode,
  setCurrentPage,
  pageCount,
  bookId,
  scrollContainerRef,
  pageRefs,
}: UseScrollTrackingOptions) {
  useEffect(() => {
    if (isPageMode) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const observerOptions: IntersectionObserverInit = {
      root: container,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const visiblePages = new Set<number>();
    let rafId: number | null = null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const pageNum = parseInt(entry.target.getAttribute('data-page') || '0', 10);
        if (pageNum > 0) {
          if (entry.isIntersecting) {
            visiblePages.add(pageNum);
          } else {
            visiblePages.delete(pageNum);
          }
        }
      });

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        if (visiblePages.size > 0) {
          const lowestVisiblePage = Math.min(...visiblePages);
          setCurrentPage(lowestVisiblePage);
        }
      });
    }, observerOptions);

    const setupTimer = setTimeout(() => {
      pageRefs.current.forEach((element) => {
        observer.observe(element);
      });
    }, 200);

    return () => {
      clearTimeout(setupTimer);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      observer.disconnect();
    };
  }, [isPageMode, setCurrentPage, pageCount, bookId, scrollContainerRef, pageRefs]);
}
