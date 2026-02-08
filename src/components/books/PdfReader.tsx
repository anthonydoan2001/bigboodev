'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
import { cn } from '@/lib/utils';
import { useSwipeable } from 'react-swipeable';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const PDFJS_CDN_WORKER = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs`;

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const [pageTransition, setPageTransition] = useState(false);

  // For spread mode - second canvas
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const textLayer2Ref = useRef<HTMLDivElement>(null);

  // Store values
  const {
    zoomMode, customZoom, theme, spreadMode,
    isSettingsOpen, isTocOpen, isBookmarksOpen,
    closeSettings, closeToc, closeBookmarks,
    toggleSettings, toggleToc, toggleBookmarks,
  } = usePdfReaderStore();

  const bookIdStr = String(bookId);
  const { progress: savedProgress } = useReadingProgress(bookIdStr, 'pdf');
  const { saveProgress } = useSaveReadingProgress();

  // Bookmarks
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

  // Render a single page to a canvas + text layer
  const renderPageToCanvas = useCallback(
    async (
      pageNum: number,
      canvas: HTMLCanvasElement,
      textLayer: HTMLDivElement | null,
      container: HTMLElement,
    ) => {
      const pdfDoc = pdfDocRef.current;
      if (!pdfDoc || pageNum < 1 || pageNum > pdfDoc.numPages) return;

      const page = await pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });

      // Calculate scale based on zoom mode
      let scale: number;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // For spread mode, each canvas gets half the width
      const availableWidth = spreadMode === 'double'
        ? (containerWidth - 16) / 2 // 16px gap between pages
        : containerWidth;

      switch (zoomMode) {
        case 'fit-width':
          scale = availableWidth / unscaledViewport.width;
          break;
        case 'fit-page':
          scale = Math.min(
            availableWidth / unscaledViewport.width,
            containerHeight / unscaledViewport.height
          );
          break;
        case 'custom':
          scale = customZoom / 100;
          break;
        default:
          scale = availableWidth / unscaledViewport.width;
      }

      const viewport = page.getViewport({ scale });
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      await page.render({
        canvas,
        viewport,
      }).promise;

      // Render text layer for text selection
      if (textLayer) {
        textLayer.innerHTML = '';
        textLayer.style.width = `${Math.floor(viewport.width)}px`;
        textLayer.style.height = `${Math.floor(viewport.height)}px`;

        const pdfjsLib = await import('pdfjs-dist');
        const textContent = await page.getTextContent();
        const textLayerApi = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport,
        });
        await textLayerApi.render();
      }
    },
    [zoomMode, customZoom, spreadMode]
  );

  // Render current page(s)
  const renderCurrentPage = useCallback(async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !pdfDocRef.current) return;

    await renderPageToCanvas(currentPage, canvas, textLayerRef.current, container);

    // Render second page for spread mode
    if (spreadMode === 'double' && canvas2Ref.current) {
      const nextPage = currentPage + 1;
      if (nextPage <= totalPages) {
        canvas2Ref.current.style.display = 'block';
        if (textLayer2Ref.current) textLayer2Ref.current.style.display = 'block';
        await renderPageToCanvas(nextPage, canvas2Ref.current, textLayer2Ref.current, container);
      } else {
        canvas2Ref.current.style.display = 'none';
        if (textLayer2Ref.current) textLayer2Ref.current.style.display = 'none';
      }
    }
  }, [currentPage, renderPageToCanvas, spreadMode, totalPages]);

  // Navigation
  const handlePrevious = useCallback(() => {
    setCurrentPage((p) => {
      const step = spreadMode === 'double' ? 2 : 1;
      const newPage = Math.max(1, p - step);
      if (newPage !== p) {
        setPageTransition(true);
        setTimeout(() => setPageTransition(false), 150);
      }
      return newPage;
    });
  }, [spreadMode]);

  const handleNext = useCallback(() => {
    setCurrentPage((p) => {
      const step = spreadMode === 'double' ? 2 : 1;
      const newPage = Math.min(totalPages, p + step);
      if (newPage !== p) {
        setPageTransition(true);
        setTimeout(() => setPageTransition(false), 150);
      }
      return newPage;
    });
  }, [totalPages, spreadMode]);

  const handleProgressChange = useCallback(
    (value: number) => {
      if (totalPages > 0) {
        const targetPage = Math.max(1, Math.round((value / 100) * totalPages));
        setCurrentPage(targetPage);
      }
    },
    [totalPages]
  );

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  // Touch swipe
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    trackMouse: false,
    delta: 50,
  });

  // Merge swipe ref with container ref
  const mergedRef = useCallback(
    (el: HTMLDivElement | null) => {
      containerRef.current = el;
      swipeHandlers.ref(el);
    },
    [swipeHandlers]
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
        // If dest is a string, resolve the named destination first
        if (typeof dest === 'string') {
          resolvedDest = await pdfDoc.getDestination(dest);
        }
        if (!Array.isArray(resolvedDest) || resolvedDest.length === 0) return null;

        const ref = resolvedDest[0];
        const pageIndex = await pdfDoc.getPageIndex(ref);
        return pageIndex + 1; // 1-based
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
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (!mounted) {
          pdfDoc.destroy();
          return;
        }

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);

        // Extract outline
        const pdfOutline = await pdfDoc.getOutline();
        if (mounted && pdfOutline) {
          setOutline(pdfOutline as unknown as PdfOutlineItem[]);
        }

        // Restore saved position
        if (savedProgress?.position) {
          const savedPage = parseInt(savedProgress.position, 10);
          if (!isNaN(savedPage) && savedPage >= 1 && savedPage <= pdfDoc.numPages) {
            setCurrentPage(savedPage);
          }
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
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Re-render on page change, zoom change, etc.
  useEffect(() => {
    if (!isLoading && pdfDocRef.current) {
      renderCurrentPage();
    }
  }, [isLoading, renderCurrentPage]);

  // Save progress on page change
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      debouncedSave(currentPage, totalPages);
    }
  }, [currentPage, totalPages, debouncedSave]);

  // Re-render on window resize (debounced)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (pdfDocRef.current) renderCurrentPage();
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [renderCurrentPage]);

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

  const hasOutline = outline.length > 0;

  return (
    <>
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
        currentLocation={`${currentPage} / ${totalPages}`}
        progress={progressPct}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onProgressChange={handleProgressChange}
        hasPrevious={currentPage > 1}
        hasNext={currentPage < totalPages}
        backHref="/books"
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
            {hasOutline && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={toggleToc}
                title="Table of Contents"
              >
                <List className="h-4 w-4" />
              </Button>
            )}
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
          ref={mergedRef}
          className={cn(
            'w-full h-full overflow-auto flex items-start justify-center',
            zoomMode !== 'custom' && 'items-center'
          )}
          style={{
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#525659',
          }}
          onMouseDown={swipeHandlers.onMouseDown}
        >
          <div
            className={cn(
              'flex gap-4 transition-opacity duration-150',
              pageTransition && 'opacity-80'
            )}
            style={
              theme === 'dark'
                ? { filter: 'invert(1) hue-rotate(180deg)' }
                : undefined
            }
          >
            {/* Main page */}
            <div className="relative">
              <canvas ref={canvasRef} className="block shadow-lg" />
              <div ref={textLayerRef} className="pdf-text-layer" />
            </div>

            {/* Second page (spread mode) */}
            {spreadMode === 'double' && (
              <div className="relative">
                <canvas
                  ref={canvas2Ref}
                  className="block shadow-lg"
                  style={{ display: 'none' }}
                />
                <div
                  ref={textLayer2Ref}
                  className="pdf-text-layer"
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        </div>
      </ReaderControls>

      {/* Sidebars */}
      {isSettingsOpen && <PdfSettingsPanel onClose={closeSettings} />}

      {isTocOpen && hasOutline && (
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
    </>
  );
}
