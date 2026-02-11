'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getBookDownloadUrl } from '@/lib/api/calibre';
import {
  useReadingProgress,
  useSaveReadingProgress,
  useBookmarks,
  useBookmarkMutations,
} from '@/lib/hooks/useBooks';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { usePdfReaderStore } from '@/lib/stores/pdf-reader-store';
import { ReaderControls } from './ReaderControls';
import { PdfSettingsPanel } from './PdfSettingsPanel';
import { PdfTocSidebar } from './PdfTocSidebar';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Settings,
  List,
  Bookmark,
  BookmarkCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624`;
const PDFJS_CDN_WORKER = `${PDFJS_CDN}/build/pdf.worker.min.mjs`;

const PAGE_GAP = 8;
const PADDING_X_SM = 16;  // horizontal padding on small screens (<640px)
const PADDING_X_LG = 32;  // horizontal padding on larger screens
const PADDING_Y = 16;

interface PdfReaderProps {
  bookId: number;
  title: string;
}

interface PdfOutlineItem {
  title: string;
  dest: string | unknown[] | null;
  items: PdfOutlineItem[];
  bold: boolean;
  italic: boolean;
}

export function PdfReader({ bookId, title }: PdfReaderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedAtScaleRef = useRef<Map<number, string>>(new Map());
  const renderingCountRef = useRef(0);
  const updateVisibleRef = useRef<() => void>(() => {});
  const hasRestoredPositionRef = useRef(false);
  const prevScaleRef = useRef(0);
  const prevViewModeRef = useRef<string>('');
  const pageCacheRef = useRef<Map<number, PDFPageProxy>>(new Map());
  const MAX_CONCURRENT_RENDERS = 3;
  const MAX_PAGE_CACHE = 20;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [defaultPageSize, setDefaultPageSize] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const [mountedRange, setMountedRange] = useState<{ start: number; end: number }>({ start: 1, end: 1 });

  // Store
  const {
    zoomMode, customZoom, viewMode,
    isSettingsOpen, isTocOpen, isBookmarksOpen,
    closeSettings, closeToc, closeBookmarks,
    toggleSettings, toggleToc, toggleBookmarks,
  } = usePdfReaderStore();

  // Progress & bookmarks
  const bookIdStr = String(bookId);
  const { progress: savedProgress } = useReadingProgress(bookIdStr, 'pdf');
  const { saveProgress } = useSaveReadingProgress();
  const { bookmarks } = useBookmarks(bookIdStr);
  const bookmarkMutations = useBookmarkMutations(bookIdStr);

  const isCurrentlyBookmarked = bookmarks.some(
    (bm) => bm.cfi === `page:${currentPage}`
  );

  const progressPct = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  const debouncedSave = useDebouncedCallback(
    (page: number, total: number) => {
      saveProgress({
        bookId: bookIdStr,
        format: 'pdf',
        position: String(page),
        progress: page / total,
      });
    },
    2000,
    { flushOnUnmount: true }
  );

  // Auto-downgrade double to single on narrow screens
  const effectiveViewMode = useMemo(() => {
    if (viewMode === 'double' && containerWidth > 0 && containerWidth < 600) {
      return 'single';
    }
    return viewMode;
  }, [viewMode, containerWidth]);

  const effectiveIsPageMode = effectiveViewMode === 'single' || effectiveViewMode === 'double';

  // Double-page spread helpers
  const spreadStart = useMemo(() => {
    if (effectiveViewMode !== 'double') return currentPage;
    return Math.floor((currentPage - 1) / 2) * 2 + 1;
  }, [effectiveViewMode, currentPage]);

  const spreadEnd = useMemo(() => {
    if (effectiveViewMode !== 'double') return currentPage;
    return Math.min(spreadStart + 1, totalPages);
  }, [effectiveViewMode, spreadStart, totalPages]);

  // Computed scale — accounts for double-page needing 2 pages side by side
  const scale = useMemo(() => {
    if (!defaultPageSize || containerWidth === 0) return 1;
    const paddingX = containerWidth < 640 ? PADDING_X_SM : PADDING_X_LG;
    const availWidth = containerWidth - paddingX;
    const pageWidthDivisor = effectiveViewMode === 'double'
      ? defaultPageSize.width * 2 + PAGE_GAP
      : defaultPageSize.width;

    switch (zoomMode) {
      case 'fit-width':
        return availWidth / pageWidthDivisor;
      case 'fit-page': {
        const containerH = scrollContainerRef.current?.clientHeight || window.innerHeight;
        const paddingV = containerWidth < 640 ? 16 : 32;
        return Math.min(
          availWidth / pageWidthDivisor,
          (containerH - paddingV) / defaultPageSize.height
        );
      }
      case 'custom':
        return customZoom / 100;
      default:
        return availWidth / pageWidthDivisor;
    }
  }, [zoomMode, customZoom, containerWidth, defaultPageSize, effectiveViewMode]);

  const scaledWidth = defaultPageSize ? Math.floor(defaultPageSize.width * scale) : 0;
  const scaledHeight = defaultPageSize ? Math.floor(defaultPageSize.height * scale) : 0;
  const totalContentHeight = PADDING_Y * 2 + totalPages * scaledHeight + Math.max(0, totalPages - 1) * PAGE_GAP;
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const scaleKey = `${scale.toFixed(4)}-${dpr}`;

  // Get a page from cache or fetch it
  const getCachedPage = useCallback(async (pageNum: number): Promise<PDFPageProxy | null> => {
    const cached = pageCacheRef.current.get(pageNum);
    if (cached) {
      // Move to end for LRU behavior (delete + re-set)
      pageCacheRef.current.delete(pageNum);
      pageCacheRef.current.set(pageNum, cached);
      return cached;
    }
    if (!pdfDocRef.current) return null;
    const page = await pdfDocRef.current.getPage(pageNum);
    pageCacheRef.current.set(pageNum, page);
    if (pageCacheRef.current.size > MAX_PAGE_CACHE) {
      const firstKey = pageCacheRef.current.keys().next().value!;
      pageCacheRef.current.get(firstKey)?.cleanup();
      pageCacheRef.current.delete(firstKey);
    }
    return page;
  }, [MAX_PAGE_CACHE]);

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
      const viewport = page.getViewport({ scale });

      // Use scaledWidth/scaledHeight for canvas CSS dimensions to match the container div exactly.
      // The container div uses Math.floor(defaultPageSize.width * scale), so use the same values
      // to prevent sub-pixel overflow/clipping.
      canvas.style.width = `${scaledWidth}px`;
      canvas.style.height = `${scaledHeight}px`;
      canvas.width = scaledWidth * dpr;
      canvas.height = scaledHeight * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      await page.render({ canvas, viewport }).promise;
    } catch {
      // Don't clear renderedAtScaleRef — prevents retry storm
    } finally {
      renderingCountRef.current--;
      // Process remaining pages that were skipped due to concurrency limit
      requestAnimationFrame(() => updateVisibleRef.current());
    }
  }, [scale, scaleKey, dpr, scaledWidth, scaledHeight, MAX_CONCURRENT_RENDERS, getCachedPage]);

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

    // Current page = most centered
    const centerY = scrollTop + clientHeight / 2 - PADDING_Y;
    const current = Math.max(1, Math.min(totalPages, Math.floor(centerY / pageStep) + 1));
    setCurrentPage(current);

    // Buffer ±3
    const start = Math.max(1, firstVisible - 3);
    const end = Math.min(totalPages, lastVisible + 3);

    // Update mounted range (only if changed to avoid re-renders)
    setMountedRange(prev => {
      if (prev.start === start && prev.end === end) return prev;
      return { start, end };
    });

    // Clear render cache for pages outside the new range (frees memory on unmount)
    for (const key of renderedAtScaleRef.current.keys()) {
      if (key < start || key > end) {
        renderedAtScaleRef.current.delete(key);
      }
    }

    // Render buffered pages
    for (let i = start; i <= end; i++) {
      renderPage(i);
    }
  }, [totalPages, scaledHeight, containerWidth, renderPage, effectiveIsPageMode]);

  // Keep ref in sync for use inside renderPage's finally block
  updateVisibleRef.current = updateVisiblePages;

  // Scroll to a specific page (scroll mode)
  const scrollToPage = useCallback((pageNum: number, behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container || scaledHeight === 0) return;
    const targetTop = PADDING_Y + (pageNum - 1) * (scaledHeight + PAGE_GAP);
    container.scrollTo({ top: targetTop, behavior });
  }, [scaledHeight]);

  // Mode-aware goToPage (used by TOC, bookmarks, progress slider)
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      if (effectiveIsPageMode) {
        setCurrentPage(page);
      } else {
        scrollToPage(page);
      }
    },
    [totalPages, scrollToPage, effectiveIsPageMode]
  );

  // Navigation
  const handlePrevious = useCallback(() => {
    if (effectiveViewMode === 'double') {
      const newStart = Math.max(1, spreadStart - 2);
      setCurrentPage(newStart);
    } else if (effectiveViewMode === 'single') {
      setCurrentPage(p => Math.max(1, p - 1));
    } else {
      scrollToPage(Math.max(1, currentPage - 1));
    }
  }, [effectiveViewMode, currentPage, scrollToPage, spreadStart]);

  const handleNext = useCallback(() => {
    if (effectiveViewMode === 'double') {
      const newStart = Math.min(totalPages, spreadStart + 2);
      setCurrentPage(newStart);
    } else if (effectiveViewMode === 'single') {
      setCurrentPage(p => Math.min(totalPages, p + 1));
    } else {
      scrollToPage(Math.min(totalPages, currentPage + 1));
    }
  }, [effectiveViewMode, currentPage, totalPages, scrollToPage, spreadStart]);

  const handleProgressChange = useCallback(
    (value: number) => {
      if (totalPages > 0) {
        const targetPage = Math.max(1, Math.round((value / 100) * totalPages));
        goToPage(targetPage);
      }
    },
    [totalPages, goToPage]
  );

  // Bookmark toggle
  const handleToggleBookmark = useCallback(async () => {
    const cfi = `page:${currentPage}`;
    const existing = bookmarks.find((bm) => bm.cfi === cfi);
    if (existing) {
      await bookmarkMutations.remove(existing.id);
    } else {
      await bookmarkMutations.create({
        bookId: bookIdStr,
        cfi,
        label: `Page ${currentPage}`,
        progress: currentPage / totalPages,
      });
    }
  }, [currentPage, bookmarks, bookmarkMutations, bookIdStr, totalPages]);

  // Resolve PDF outline destination to page number
  const resolveDestination = useCallback(
    async (dest: unknown): Promise<number | null> => {
      const pdfDoc = pdfDocRef.current;
      if (!pdfDoc) return null;

      try {
        let resolvedDest = dest;
        if (typeof dest === 'string') {
          resolvedDest = await pdfDoc.getDestination(dest);
        }
        if (!Array.isArray(resolvedDest) || resolvedDest.length === 0) return null;

        const ref = resolvedDest[0];
        const pageIndex = await pdfDoc.getPageIndex(ref);
        return pageIndex + 1;
      } catch {
        return null;
      }
    },
    []
  );

  // Initialize PDF document
  useEffect(() => {
    let mounted = true;

    async function loadPdf() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN_WORKER;

        const downloadUrl = getBookDownloadUrl(bookId, 'pdf');
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to download PDF');

        const arrayBuffer = await response.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({
          data: arrayBuffer,
          wasmUrl: `${PDFJS_CDN}/wasm/`,
        }).promise;

        if (!mounted) {
          pdfDoc.destroy();
          return;
        }

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);

        // Get first page dimensions
        const firstPage = await pdfDoc.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        if (mounted) setDefaultPageSize({ width: vp.width, height: vp.height });

        // Extract outline
        const pdfOutline = await pdfDoc.getOutline();
        if (mounted && pdfOutline) {
          setOutline(pdfOutline as unknown as PdfOutlineItem[]);
        }

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      mounted = false;
      // Clean up cached page objects
      for (const page of pageCacheRef.current.values()) {
        page.cleanup();
      }
      pageCacheRef.current.clear();
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Container resize observer
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Scroll listener for visible page tracking + lazy rendering (scroll mode only)
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
  }, [updateVisiblePages, isLoading, effectiveIsPageMode]);

  // Page-mode render effect — render current page(s) when currentPage or scale changes
  useEffect(() => {
    if (!effectiveIsPageMode || isLoading || totalPages === 0 || scaledHeight === 0) return;

    const pagesToRender = effectiveViewMode === 'double'
      ? [spreadStart, ...(spreadEnd > spreadStart ? [spreadEnd] : [])]
      : [currentPage];

    // Update mounted range for page mode
    const start = pagesToRender[0];
    const end = pagesToRender[pagesToRender.length - 1];
    setMountedRange(prev => {
      if (prev.start === start && prev.end === end) return prev;
      return { start, end };
    });

    // Clear render cache for pages not in the current view
    for (const key of renderedAtScaleRef.current.keys()) {
      if (key < start || key > end) {
        renderedAtScaleRef.current.delete(key);
      }
    }

    // Render after a frame so canvas refs are mounted
    requestAnimationFrame(() => {
      for (const p of pagesToRender) {
        renderPage(p);
      }
    });
  }, [effectiveIsPageMode, isLoading, effectiveViewMode, currentPage, spreadStart, spreadEnd, totalPages, scaledHeight, renderPage]);

  // Handle view mode transitions — clear render cache, restore scroll position
  useEffect(() => {
    if (prevViewModeRef.current && prevViewModeRef.current !== effectiveViewMode) {
      // Canvases remount on mode switch, so clear render tracking
      renderedAtScaleRef.current.clear();

      // When switching to scroll mode, scroll to the current page
      if (effectiveViewMode === 'scroll') {
        requestAnimationFrame(() => {
          scrollToPage(currentPage, 'instant');
        });
      }
    }
    prevViewModeRef.current = effectiveViewMode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveViewMode]);

  // Maintain scroll position when scale changes (scroll mode only)
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

  // Restore saved position
  useEffect(() => {
    if (
      !isLoading &&
      !hasRestoredPositionRef.current &&
      containerWidth > 0 &&
      totalPages > 0 &&
      scaledHeight > 0
    ) {
      hasRestoredPositionRef.current = true;
      if (savedProgress?.position) {
        const savedPage = parseInt(savedProgress.position, 10);
        if (!isNaN(savedPage) && savedPage > 1 && savedPage <= totalPages) {
          if (effectiveIsPageMode) {
            setCurrentPage(savedPage);
          } else {
            requestAnimationFrame(() => {
              scrollToPage(savedPage, 'instant');
            });
          }
        }
      }
    }
  }, [isLoading, containerWidth, totalPages, scaledHeight, savedProgress, scrollToPage, effectiveIsPageMode]);

  // Save progress on page change
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      debouncedSave(currentPage, totalPages);
    }
  }, [currentPage, totalPages, debouncedSave]);

  // Location display
  const currentLocation = useMemo(() => {
    if (effectiveViewMode === 'double' && spreadEnd > spreadStart) {
      return `${spreadStart}-${spreadEnd} / ${totalPages}`;
    }
    return `${currentPage} / ${totalPages}`;
  }, [effectiveViewMode, currentPage, spreadStart, spreadEnd, totalPages]);

  // hasPrevious / hasNext
  const hasPrevious = effectiveViewMode === 'double' ? spreadStart > 1 : currentPage > 1;
  const hasNext = effectiveViewMode === 'double' ? spreadEnd < totalPages : currentPage < totalPages;

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Failed to load PDF</p>
          <p className="text-white/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Canvas ref callback
  const canvasRef = (pageNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) canvasMapRef.current.set(pageNum, el);
    else canvasMapRef.current.delete(pageNum);
  };

  return (
    <div className="pdf-reader-root">
      {isLoading && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
            <p className="text-white/70">Loading PDF...</p>
          </div>
        </div>
      )}

      <ReaderControls
        title={title}
        currentLocation={currentLocation}
        progress={progressPct}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onProgressChange={handleProgressChange}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        backHref="/books"
        hideBottomBar
        extraControls={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={toggleSettings}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={toggleToc}
              title="Table of Contents"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={handleToggleBookmark}
              title={isCurrentlyBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isCurrentlyBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            {bookmarks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={toggleBookmarks}
                title="Bookmarks"
              >
                <Bookmark className="h-4 w-4 fill-current" />
              </Button>
            )}
          </div>
        }
      >
        <div
          ref={scrollContainerRef}
          className={`w-full h-full ${effectiveIsPageMode ? 'overflow-hidden' : 'overflow-y-auto'}`}
          style={{ backgroundColor: '#000' }}
        >
          {defaultPageSize && containerWidth > 0 && (
            <>
              {/* Scroll mode: virtualized vertical layout */}
              {effectiveViewMode === 'scroll' && (
                <div
                  className="relative"
                  style={{ height: totalContentHeight }}
                >
                  {Array.from({ length: mountedRange.end - mountedRange.start + 1 }, (_, i) => {
                    const pageNum = mountedRange.start + i;
                    const top = PADDING_Y + (pageNum - 1) * (scaledHeight + PAGE_GAP);
                    return (
                      <div
                        key={pageNum}
                        className="absolute left-1/2 -translate-x-1/2 flex-shrink-0 overflow-hidden"
                        style={{ width: scaledWidth, height: scaledHeight, top }}
                      >
                        <canvas ref={canvasRef(pageNum)} className="block shadow-lg" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Single page mode */}
              {effectiveViewMode === 'single' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="overflow-hidden" style={{ width: scaledWidth, height: scaledHeight }}>
                    <canvas
                      key={currentPage}
                      ref={canvasRef(currentPage)}
                      className="block shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Double page mode */}
              {effectiveViewMode === 'double' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex" style={{ gap: PAGE_GAP }}>
                    <div className="overflow-hidden" style={{ width: scaledWidth, height: scaledHeight }}>
                      <canvas
                        key={spreadStart}
                        ref={canvasRef(spreadStart)}
                        className="block shadow-lg"
                      />
                    </div>
                    {spreadEnd > spreadStart && (
                      <div className="overflow-hidden" style={{ width: scaledWidth, height: scaledHeight }}>
                        <canvas
                          key={spreadEnd}
                          ref={canvasRef(spreadEnd)}
                          className="block shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ReaderControls>

      {/* Sidebars */}
      {isSettingsOpen && <PdfSettingsPanel onClose={closeSettings} />}

      {isTocOpen && (
        <PdfTocSidebar
          outline={outline}
          currentPage={currentPage}
          onNavigate={goToPage}
          onClose={closeToc}
          resolveDestination={resolveDestination}
        />
      )}

      {isBookmarksOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={closeBookmarks} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l z-[70] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Bookmarks</h3>
              <button
                onClick={closeBookmarks}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                  No bookmarks yet. Use the bookmark button to add one.
                </p>
              ) : (
                <div className="space-y-1">
                  {bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      className="group flex items-center gap-2 p-2.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        const page = parseInt(bm.cfi.replace('page:', ''), 10);
                        if (!isNaN(page)) {
                          goToPage(page);
                          closeBookmarks();
                        }
                      }}
                    >
                      <Bookmark className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {bm.label || `Page ${bm.cfi.replace('page:', '')}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(bm.progress * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          bookmarkMutations.remove(bm.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
