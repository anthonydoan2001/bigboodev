'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { ReadingMode } from '@/lib/reader-settings';

interface ContinuousViewerProps {
  bookId: string;
  totalPages: number;
  readingMode: ReadingMode;
  zoom: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
  onScrolledToPosition?: () => void;
}

export function ContinuousViewer({
  bookId,
  totalPages,
  readingMode,
  zoom,
  currentPage,
  onPageChange,
  onScrolledToPosition,
}: ContinuousViewerProps) {
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  const [hasScrolledToInitialPage, setHasScrolledToInitialPage] = useState(false);
  const scrollStartedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const previousZoomRef = useRef<number>(zoom);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset scroll flag only when bookId changes (not when currentPage changes)
  useEffect(() => {
    setHasScrolledToInitialPage(false);
    scrollStartedRef.current = false;
    previousZoomRef.current = zoom;
  }, [bookId, zoom]);

  const isVertical = readingMode === 'continuous-vertical';
  const isRTL = readingMode.includes('rtl');

  // Preserve scroll position when zoom changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || previousZoomRef.current === zoom) {
      previousZoomRef.current = zoom;
      return;
    }

    const currentPageEl = pageRefs.current.get(currentPage);
    if (!currentPageEl) {
      previousZoomRef.current = zoom;
      return;
    }

    // Save the current scroll position and zoom ratio
    const savedScrollTop = container.scrollTop;
    const savedScrollLeft = container.scrollLeft;
    const oldZoom = previousZoomRef.current;
    const zoomRatio = zoom / oldZoom;

    // Update zoom ref
    previousZoomRef.current = zoom;

    // Immediately update scroll position
    requestAnimationFrame(() => {
      if (!container) return;

      // Mark as programmatic scroll
      (container as any).__isProgrammaticScroll = true;

      if (isVertical) {
        container.scrollTop = savedScrollTop * zoomRatio;
      } else {
        container.scrollLeft = savedScrollLeft * zoomRatio;
      }

      // Reset flag quickly
      setTimeout(() => {
        (container as any).__isProgrammaticScroll = false;
      }, 100);
    });
  }, [zoom, currentPage, isVertical]);

  // Load pages with priority: current page first, then others - optimized
  useEffect(() => {
    if (totalPages === 0) return;

    const loadPage = (pageNum: number) => {
      if (loadedPages.has(pageNum)) return;

      const img = new window.Image();
      img.src = `/api/komga/pages/${bookId}/${pageNum}`;
      img.onload = () => {
        setLoadedPages(prev => new Set(prev).add(pageNum));
        // Store image dimensions for horizontal layout calculations
        if (!isVertical && img.naturalWidth && img.naturalHeight) {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const viewportHeight = window.innerHeight - 64;
          const calculatedWidth = viewportHeight * aspectRatio;
          setImageDimensions(prev => {
            const newMap = new Map(prev);
            newMap.set(pageNum, { width: calculatedWidth, height: viewportHeight });
            return newMap;
          });
        }
      };
      img.onerror = () => {
        setLoadedPages(prev => new Set(prev).add(pageNum));
      };
    };

    // Load current page and adjacent pages immediately
    const pagesToLoad = [currentPage];
    if (currentPage > 1) pagesToLoad.push(currentPage - 1);
    if (currentPage < totalPages) pagesToLoad.push(currentPage + 1);
    if (currentPage > 2) pagesToLoad.push(currentPage - 2);
    if (currentPage + 1 < totalPages) pagesToLoad.push(currentPage + 2);

    pagesToLoad.forEach(loadPage);

    // Load remaining pages progressively
    const loadRemaining = () => {
      for (let i = 1; i <= totalPages; i++) {
        if (!pagesToLoad.includes(i)) {
          setTimeout(() => loadPage(i), i * 2);
        }
      }
    };

    requestAnimationFrame(loadRemaining);
  }, [bookId, totalPages, isVertical, currentPage, loadedPages]);

  // Handle scroll to detect visible pages and update current page - optimized with RAF
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let isScheduled = false;

    const updatePageFromScroll = () => {
      isScheduled = false;

      // Don't update page during programmatic scrolling
      if ((container as any).__isProgrammaticScroll) return;

      const containerRect = container.getBoundingClientRect();
      const visible = new Set<number>();

      pageRefs.current.forEach((pageEl, pageNum) => {
        const pageRect = pageEl.getBoundingClientRect();

        // Check if page is visible in viewport
        if (
          pageRect.top < containerRect.bottom &&
          pageRect.bottom > containerRect.top &&
          pageRect.left < containerRect.right &&
          pageRect.right > containerRect.left
        ) {
          visible.add(pageNum);
        }
      });

      setVisiblePages(visible);

      // Determine current page based on scroll position
      if (visible.size > 0) {
        const sortedVisible = Array.from(visible).sort((a, b) => {
          const aEl = pageRefs.current.get(a);
          const bEl = pageRefs.current.get(b);
          if (!aEl || !bEl) return 0;

          if (isVertical) {
            // Vertical: page closest to center of viewport
            const viewportCenter = containerRect.top + containerRect.height / 2;
            const aRect = aEl.getBoundingClientRect();
            const bRect = bEl.getBoundingClientRect();
            const aCenter = aRect.top + aRect.height / 2;
            const bCenter = bRect.top + bRect.height / 2;
            return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
          } else {
            // Horizontal: page closest to center of viewport
            const viewportCenter = containerRect.left + containerRect.width / 2;
            const aRect = aEl.getBoundingClientRect();
            const bRect = bEl.getBoundingClientRect();
            const aCenter = aRect.left + aRect.width / 2;
            const bCenter = bRect.left + bRect.width / 2;
            return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
          }
        });

        const newCurrentPage = sortedVisible[0];
        if (newCurrentPage !== currentPage && onPageChange) {
          onPageChange(newCurrentPage);
        }
      }
    };

    const handleScroll = () => {
      if (!isScheduled) {
        isScheduled = true;
        rafId = requestAnimationFrame(updatePageFromScroll);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    requestAnimationFrame(() => {
      requestAnimationFrame(updatePageFromScroll);
    });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [bookId, totalPages, isVertical, isRTL, currentPage, onPageChange]);

  // Scroll to current page on initial load (optimized for speed)
  useEffect(() => {
    if (hasScrolledToInitialPage || !currentPage || scrollStartedRef.current) return;

    const container = containerRef.current;
    const pageEl = pageRefs.current.get(currentPage);
    if (!container || !pageEl) return;

    const scrollToPage = () => {
      if (scrollStartedRef.current || hasScrolledToInitialPage) return;

      scrollStartedRef.current = true;
      (container as any).__isProgrammaticScroll = true;

      requestAnimationFrame(() => {
        const targetPageEl = pageRefs.current.get(currentPage);
        if (!targetPageEl) {
          (container as any).__isProgrammaticScroll = false;
          scrollStartedRef.current = false;
          return;
        }

        if (isVertical) {
          container.scrollTop = targetPageEl.offsetTop;
        } else {
          // For horizontal scrolling, scroll to center the page in viewport
          const pageRect = targetPageEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const scrollLeft = targetPageEl.offsetLeft - (containerRect.width / 2) + (pageRect.width / 2);
          container.scrollLeft = Math.max(0, scrollLeft);
        }

        setHasScrolledToInitialPage(true);
        onScrolledToPosition?.();

        setTimeout(() => {
          (container as any).__isProgrammaticScroll = false;
        }, 300);
      });
    };

    // Try to scroll immediately if page is loaded
    if (loadedPages.has(currentPage) && (isVertical || imageDimensions.has(currentPage))) {
      requestAnimationFrame(scrollToPage);
    } else {
      // Wait a bit for images to load, then scroll anyway
      const timeout = setTimeout(scrollToPage, 200);
      return () => clearTimeout(timeout);
    }
  }, [bookId, currentPage, isRTL, isVertical, loadedPages, imageDimensions, hasScrolledToInitialPage, onScrolledToPosition]);

  // Container and layout based on reading mode
  const containerClassName = isVertical
    ? 'relative w-full h-full overflow-y-auto overflow-x-hidden' // Vertical: scroll up/down
    : 'relative w-full h-full overflow-x-auto overflow-y-hidden'; // Horizontal: scroll left/right

  const pagesContainerClassName = isVertical
    ? 'flex flex-col items-center' // Vertical: stack pages vertically
    : isRTL
    ? 'flex flex-row items-center flex-row-reverse' // RTL: reverse order (right to left)
    : 'flex flex-row items-center'; // LTR: normal order (left to right)

  // For continuous mode, zoom should scale the entire container
  const imageStyle: React.CSSProperties = {
    transform: `scale(${zoom})`,
    transformOrigin: isVertical ? 'top center' : 'left center',
    display: 'flex',
    width: isVertical ? '100%' : 'max-content',
    height: isVertical ? 'max-content' : '100%',
    minWidth: isVertical ? '100%' : 'max-content',
    willChange: 'transform',
    // Ensure horizontal container expands properly and doesn't wrap
    flexWrap: 'nowrap',
  };

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'auto',
        // Ensure container can scroll horizontally
        ...(isVertical ? {} : { 
          overflowX: 'auto',
          overflowY: 'hidden',
        }),
      }}
    >
      <div 
        className={pagesContainerClassName} 
        style={{
          ...imageStyle,
          // Ensure horizontal container has proper width
          ...(isVertical ? {} : {
            width: 'max-content',
            minWidth: 'max-content',
          }),
        }}
      >
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1;
          const pageUrl = `/api/komga/pages/${bookId}/${pageNum}`;
          const isLoaded = loadedPages.has(pageNum);

          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) {
                  pageRefs.current.set(pageNum, el);
                } else {
                  pageRefs.current.delete(pageNum);
                }
              }}
              style={{
                flexShrink: 0,
                height: isVertical ? '100vh' : 'calc(100vh - 64px)',
                width: isVertical
                  ? '100%'
                  : (imageDimensions.get(pageNum)?.width || '100vw'),
                minWidth: isVertical ? '100%' : (imageDimensions.get(pageNum)?.width || '100vw'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                contain: 'layout style paint',
                contentVisibility: visiblePages.has(pageNum) ? 'visible' : 'auto',
              }}
            >
              {isLoaded ? (
                <img
                  src={pageUrl}
                  alt={`Page ${pageNum}`}
                  loading={Math.abs(pageNum - currentPage) <= 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{
                    display: 'block',
                    objectFit: 'contain',
                    height: isVertical ? '100vh' : 'calc(100vh - 64px)',
                    width: 'auto',
                    maxHeight: isVertical ? '100vh' : 'calc(100vh - 64px)',
                    maxWidth: isVertical ? '100%' : 'none',
                    flexShrink: 0,
                  }}
                  onLoad={(e) => {
                    // Update dimensions when image loads
                    if (!isVertical) {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        const viewportHeight = window.innerHeight - 64;
                        const calculatedWidth = viewportHeight * aspectRatio;
                        setImageDimensions(prev => {
                          const newMap = new Map(prev);
                          newMap.set(pageNum, { width: calculatedWidth, height: viewportHeight });
                          return newMap;
                        });
                      }
                    }
                  }}
                />
              ) : (
                <div style={{
                  width: isVertical ? '100%' : (imageDimensions.get(pageNum)?.width || '100vw'),
                  height: isVertical ? '100vh' : 'calc(100vh - 64px)',
                  flexShrink: 0,
                }}>
                  <Skeleton className="w-full h-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
