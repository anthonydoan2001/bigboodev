import { useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PAGE_GAP, PADDING_Y } from './usePdfScale';

const MAX_CONCURRENT_RENDERS = 3;

interface UsePdfRendererOptions {
  pdfDocRef: React.RefObject<PDFDocumentProxy | null>;
  pageCacheRef: React.RefObject<Map<number, PDFPageProxy>>;
  maxPageCache: number;
  totalPages: number;
  scale: number;
  scaleKey: string;
  dpr: number;
  scaledWidth: number;
  scaledHeight: number;
  effectiveIsPageMode: boolean;
  effectiveViewMode: 'scroll' | 'single' | 'double';
  currentPage: number;
  spreadStart: number;
  spreadEnd: number;
  containerWidth: number;
  isLoading: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollToPage: (pageNum: number, behavior?: ScrollBehavior) => void;
  prevScaleRef: React.MutableRefObject<number>;
  prevViewModeRef: React.MutableRefObject<string>;
}

export function usePdfRenderer({
  pdfDocRef,
  pageCacheRef,
  maxPageCache,
  totalPages,
  scale,
  scaleKey,
  dpr,
  scaledWidth,
  scaledHeight,
  effectiveIsPageMode,
  effectiveViewMode,
  currentPage,
  spreadStart,
  spreadEnd,
  containerWidth,
  isLoading,
  scrollContainerRef,
  scrollToPage,
  prevScaleRef,
  prevViewModeRef,
}: UsePdfRendererOptions) {
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedAtScaleRef = useRef<Map<number, string>>(new Map());
  const renderingCountRef = useRef(0);
  const updateVisibleRef = useRef<() => void>(() => {});

  const [mountedRange, setMountedRange] = useState<{ start: number; end: number }>({ start: 1, end: 1 });

  // Get a page from cache or fetch it
  const getCachedPage = useCallback(async (pageNum: number): Promise<PDFPageProxy | null> => {
    const cached = pageCacheRef.current.get(pageNum);
    if (cached) {
      pageCacheRef.current.delete(pageNum);
      pageCacheRef.current.set(pageNum, cached);
      return cached;
    }
    if (!pdfDocRef.current) return null;
    const page = await pdfDocRef.current.getPage(pageNum);
    pageCacheRef.current.set(pageNum, page);
    if (pageCacheRef.current.size > maxPageCache) {
      const firstKey = pageCacheRef.current.keys().next().value!;
      pageCacheRef.current.get(firstKey)?.cleanup();
      pageCacheRef.current.delete(firstKey);
    }
    return page;
  }, [pdfDocRef, pageCacheRef, maxPageCache]);

  // Render a single page (concurrency-limited)
  const renderPage = useCallback(async (pageNum: number) => {
    if (renderedAtScaleRef.current.get(pageNum) === scaleKey) return;
    if (renderingCountRef.current >= MAX_CONCURRENT_RENDERS) return;

    const canvas = canvasMapRef.current.get(pageNum);
    if (!canvas || !pdfDocRef.current) return;

    renderedAtScaleRef.current.set(pageNum, scaleKey);
    renderingCountRef.current++;

    try {
      const page = await getCachedPage(pageNum);
      if (!page) return;

      const viewport = page.getViewport({ scale: scale * dpr });

      canvas.style.width = `${scaledWidth}px`;
      canvas.style.height = `${scaledHeight}px`;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    } catch {
      // Don't clear renderedAtScaleRef — prevents retry storm
    } finally {
      renderingCountRef.current--;
      requestAnimationFrame(() => updateVisibleRef.current());
    }
  }, [scale, scaleKey, dpr, scaledWidth, scaledHeight, getCachedPage, pdfDocRef]);

  // Compute visible range and render buffered pages (scroll mode only)
  const updateVisiblePages = useCallback(() => {
    if (effectiveIsPageMode) return;

    const container = scrollContainerRef.current;
    if (!container || totalPages === 0 || scaledHeight === 0 || containerWidth === 0) return;

    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const pageStep = scaledHeight + PAGE_GAP;

    const firstVisible = Math.max(1, Math.floor((scrollTop - PADDING_Y) / pageStep) + 1);
    const lastVisible = Math.min(totalPages, Math.ceil((scrollTop + clientHeight - PADDING_Y) / pageStep));

    const start = Math.max(1, firstVisible - 3);
    const end = Math.min(totalPages, lastVisible + 3);

    setMountedRange(prev => {
      if (prev.start === start && prev.end === end) return prev;
      return { start, end };
    });

    for (const key of renderedAtScaleRef.current.keys()) {
      if (key < start || key > end) {
        renderedAtScaleRef.current.delete(key);
      }
    }

    for (let i = start; i <= end; i++) {
      renderPage(i);
    }
  }, [totalPages, scaledHeight, containerWidth, renderPage, effectiveIsPageMode, scrollContainerRef]);

  // Keep ref in sync for use inside renderPage's finally block
  updateVisibleRef.current = updateVisiblePages;

  // Scroll listener for visible page tracking (scroll mode)
  useEffect(() => {
    if (effectiveIsPageMode) return;

    const container = scrollContainerRef.current;
    if (!container || isLoading) return;

    let raf: number;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateVisiblePages);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    updateVisiblePages();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(raf);
    };
  }, [updateVisiblePages, isLoading, effectiveIsPageMode, scrollContainerRef]);

  // Page-mode render effect
  useEffect(() => {
    if (!effectiveIsPageMode || isLoading || totalPages === 0 || scaledHeight === 0) return;

    const pagesToRender = effectiveViewMode === 'double'
      ? [spreadStart, ...(spreadEnd > spreadStart ? [spreadEnd] : [])]
      : [currentPage];

    const start = pagesToRender[0];
    const end = pagesToRender[pagesToRender.length - 1];
    setMountedRange(prev => {
      if (prev.start === start && prev.end === end) return prev;
      return { start, end };
    });

    for (const key of renderedAtScaleRef.current.keys()) {
      if (key < start || key > end) {
        renderedAtScaleRef.current.delete(key);
      }
    }

    requestAnimationFrame(() => {
      for (const p of pagesToRender) {
        renderPage(p);
      }
    });
  }, [effectiveIsPageMode, isLoading, effectiveViewMode, currentPage, spreadStart, spreadEnd, totalPages, scaledHeight, renderPage]);

  // Handle view mode transitions
  useEffect(() => {
    if (prevViewModeRef.current && prevViewModeRef.current !== effectiveViewMode) {
      renderedAtScaleRef.current.clear();

      if (effectiveViewMode === 'scroll') {
        requestAnimationFrame(() => {
          scrollToPage(currentPage, 'instant');
        });
      }
    }
    prevViewModeRef.current = effectiveViewMode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveViewMode]);

  // Maintain scroll position when scale changes (scroll mode)
  useEffect(() => {
    if (effectiveIsPageMode) {
      prevScaleRef.current = scale;
      return;
    }
    if (prevScaleRef.current !== 0 && prevScaleRef.current !== scale) {
      requestAnimationFrame(() => {
        scrollToPage(currentPage, 'instant');
      });
    }
    prevScaleRef.current = scale;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, effectiveIsPageMode]);

  // Canvas ref callback
  const canvasRef = (pageNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) canvasMapRef.current.set(pageNum, el);
    else canvasMapRef.current.delete(pageNum);
  };

  return {
    mountedRange,
    canvasRef,
    updateVisiblePages,
  };
}
