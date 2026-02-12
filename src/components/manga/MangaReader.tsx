'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useMangaStore } from '@/lib/stores/manga-store';
import { useAdjacentBooks, useReadListAdjacentBooks } from '@/lib/hooks/useManga';
import { useReaderSession } from '@/lib/hooks/manga/reader/useReaderSession';
import { useScrollTracking } from '@/lib/hooks/manga/reader/useScrollTracking';
import { useReaderZoom } from '@/lib/hooks/manga/reader/useReaderZoom';
import { useProgressSaving } from '@/lib/hooks/manga/reader/useProgressSaving';
import { useAutoHideUI } from '@/lib/hooks/manga/reader/useAutoHideUI';
import { useReaderKeyboard } from '@/lib/hooks/manga/reader/useReaderKeyboard';
import { useReaderGestures } from '@/lib/hooks/manga/reader/useReaderGestures';
import { getPageUrl } from '@/lib/api/manga';
import { ReaderSettings } from './ReaderSettings';
import { Button } from '@/components/ui/button';
import { KomgaBook, KomgaPage } from '@/types/komga';
import {
  Settings,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type ReaderContext =
  | { type: 'series' }
  | { type: 'readlist'; readlistId: string };

interface MangaReaderProps {
  book: KomgaBook;
  pages: KomgaPage[];
  context?: ReaderContext;
}

export function MangaReader({ book, pages, context = { type: 'series' } }: MangaReaderProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());

  const {
    readingMode,
    currentPage,
    isSettingsOpen,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    openSettings,
    closeSettings,
  } = useMangaStore();

  const totalPages = pages.length;
  const isPageMode = readingMode === 'page-ltr' || readingMode === 'page-rtl';
  const isRTL = readingMode === 'page-rtl' || readingMode === 'horizontal-scroll-rtl';

  // --- Behavioral hooks ---

  const { zoom, zoomPercentage, handleZoomIn, handleZoomOut, centerScrollPosition } = useReaderZoom({
    seriesId: book.seriesId,
    isPageMode,
    currentPage,
    scrollContainerRef,
    pageRefs,
  });

  const { isInitializing } = useReaderSession({
    book,
    pages,
    isPageMode,
    zoom,
    currentPage,
    pageRefs,
    scrollContainerRef,
    centerScrollPosition,
  });

  useScrollTracking({
    isPageMode,
    setCurrentPage,
    pageCount: pages.length,
    bookId: book.id,
    scrollContainerRef,
    pageRefs,
  });

  useProgressSaving({
    bookId: book.id,
    currentPage,
    totalPages,
  });

  const { isUIVisible, resetHideTimer } = useAutoHideUI();

  useReaderKeyboard({
    isRTL,
    isPageMode,
    isSettingsOpen,
    goToNextPage,
    goToPreviousPage,
    closeSettings,
    resetHideTimer,
  });

  const { swipeHandlers, handleTap } = useReaderGestures({
    isRTL,
    isPageMode,
    goToNextPage,
    goToPreviousPage,
    resetHideTimer,
  });

  // --- Navigation ---

  const isReadlistContext = context.type === 'readlist';
  const readlistId = isReadlistContext ? context.readlistId : null;

  const seriesAdjacent = useAdjacentBooks(isReadlistContext ? null : book.id);
  const readlistAdjacent = useReadListAdjacentBooks(readlistId, book.id);

  const nextBook = isReadlistContext ? readlistAdjacent.nextBook : seriesAdjacent.nextBook;
  const previousBook = isReadlistContext ? readlistAdjacent.previousBook : seriesAdjacent.previousBook;

  const backLink = isReadlistContext
    ? `/manga/readlist/${readlistId}`
    : `/manga/series/${book.seriesId}`;

  const getBookUrl = (targetBookId: string) => {
    if (isReadlistContext) {
      return `/manga/read/${targetBookId}?from=readlist&readlistId=${readlistId}`;
    }
    return `/manga/read/${targetBookId}`;
  };

  const handleNextBook = () => {
    if (nextBook) router.push(getBookUrl(nextBook.id));
  };

  const handlePreviousBook = () => {
    if (previousBook) router.push(getBookUrl(previousBook.id));
  };

  // --- Page rendering ---

  const handlePageLoad = useCallback((pageNum: number) => {
    setLoadedPages((prev) => new Set(prev).add(pageNum));
  }, []);

  const renderPage = (pageNum: number, index: number) => {
    const pageUrl = getPageUrl(book.id, pageNum);
    const page = pages[index];
    const isLoaded = loadedPages.has(pageNum);

    const zoomedWidth = page ? Math.round(page.width * zoom) : undefined;
    const zoomedHeight = page ? Math.round(page.height * zoom) : undefined;

    return (
      <div
        key={pageNum}
        data-page={pageNum}
        ref={(el) => {
          if (el) {
            pageRefs.current.set(pageNum, el);
          } else {
            pageRefs.current.delete(pageNum);
          }
        }}
        className={cn(
          'relative flex-shrink-0',
          isPageMode ? '' : '',
          readingMode === 'vertical-scroll' && '',
          readingMode.includes('horizontal') && ''
        )}
        style={{
          width: isPageMode ? `${zoom * 100}%` : zoomedWidth,
          maxWidth: readingMode === 'vertical-scroll' ? '100%' : undefined,
          height: isPageMode ? `${zoom * 100}%` : zoomedHeight,
          minWidth: isPageMode && zoom > 1 ? `${zoom * 100}%` : undefined,
          minHeight: isPageMode && zoom > 1 ? `${zoom * 100}%` : undefined,
        }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <Image
          src={pageUrl}
          alt={`Page ${pageNum}`}
          fill={isPageMode}
          unoptimized
          width={!isPageMode ? zoomedWidth : undefined}
          height={!isPageMode ? zoomedHeight : undefined}
          className={cn(
            'object-contain object-center',
            isPageMode ? '' : 'w-full h-auto'
          )}
          onLoad={() => handlePageLoad(pageNum)}
          priority={pageNum <= currentPage + 2}
          sizes="100vw"
        />
      </div>
    );
  };

  // --- Render ---

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col"
      onMouseMove={resetHideTimer}
      {...swipeHandlers}
    >
      {/* Top bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-50 transition-transform duration-300',
          isUIVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="bg-gradient-to-b from-black/80 to-transparent px-3 sm:px-4 py-3">
          <div className="relative flex items-center gap-2 sm:gap-3">
            {/* Left: Back + Book Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9 flex-shrink-0"
                asChild
                title={isReadlistContext ? "Back to reading list" : "Back to series"}
              >
                <Link href={backLink}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>

              <div className="text-white min-w-0 flex-1">
                <p className="font-medium truncate text-sm sm:text-base" title={book.metadata.title || book.name}>
                  {book.metadata.title || book.name}
                </p>
                <p className="text-xs text-white/70 truncate hidden sm:block" title={book.seriesTitle}>
                  {book.seriesTitle}
                </p>
              </div>
            </div>

            {/* Center: Page Navigation + Zoom */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 bg-black/30 rounded-lg px-2 sm:px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => {
                  if (isRTL) goToNextPage();
                  else goToPreviousPage();
                }}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <span className="text-white text-xs sm:text-sm font-medium min-w-[50px] sm:min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => {
                  if (isRTL) goToPreviousPage();
                  else goToNextPage();
                }}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* Zoom Controls */}
              <div className="h-4 w-px bg-white/30 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-xs font-medium min-w-[36px] text-center">
                {zoomPercentage}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomIn}
                disabled={zoom >= 2}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Book Navigation + Settings */}
            <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-9 px-2 sm:px-3"
                onClick={handlePreviousBook}
                disabled={!previousBook}
                title={previousBook ? `Previous: ${previousBook.metadata.title || previousBook.name}` : undefined}
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden lg:inline">Prev</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-9 px-2 sm:px-3"
                onClick={handleNextBook}
                disabled={!nextBook}
                title={nextBook ? `Next: ${nextBook.metadata.title || nextBook.name}` : undefined}
              >
                <span className="hidden lg:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9"
                onClick={openSettings}
                title="Reader Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-40">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
            <p className="text-white/70">Loading reader...</p>
          </div>
        </div>
      )}

      {/* Reader content */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex-1 overflow-auto',
          isPageMode && zoom <= 1 && 'flex items-center justify-center',
          readingMode === 'vertical-scroll' && 'overflow-y-auto overflow-x-hidden',
          readingMode === 'horizontal-scroll-ltr' && 'overflow-x-auto overflow-y-auto flex flex-row',
          readingMode === 'horizontal-scroll-rtl' && 'overflow-x-auto overflow-y-auto flex flex-row-reverse',
          isInitializing && 'invisible'
        )}
        onClick={handleTap}
      >
        {isPageMode ? (
          <div className={cn(
            zoom <= 1 ? 'w-full h-full flex items-center justify-center' : 'min-w-full min-h-full'
          )}>
            {renderPage(currentPage, currentPage - 1)}
          </div>
        ) : (
          <div
            className={cn(
              readingMode === 'vertical-scroll' && 'flex flex-col items-center w-full',
              readingMode.includes('horizontal') && 'flex'
            )}
          >
            {pages.map((_, index) => renderPage(index + 1, index))}
          </div>
        )}
      </div>

      {/* Settings modal */}
      <ReaderSettings open={isSettingsOpen} onClose={closeSettings} seriesId={book.seriesId} />
    </div>
  );
}
