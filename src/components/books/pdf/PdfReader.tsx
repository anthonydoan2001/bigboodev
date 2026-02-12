'use client';

import { useCallback, useRef } from 'react';
import { useBookmarks, useBookmarkMutations } from '@/lib/hooks/useBooks';
import { usePdfReaderStore } from '@/lib/stores/pdf-reader-store';
import { usePdfDocument } from './hooks/usePdfDocument';
import { usePdfScale, PAGE_GAP, PADDING_Y } from './hooks/usePdfScale';
import { usePdfNavigation } from './hooks/usePdfNavigation';
import { usePdfRenderer } from './hooks/usePdfRenderer';
import { usePdfPosition } from './hooks/usePdfPosition';
import { ReaderControls } from '../shared/ReaderControls';
import { PdfSettingsPanel } from './PdfSettingsPanel';
import { PdfTocSidebar } from './PdfTocSidebar';
import { PdfBookmarksSidebar } from './PdfBookmarksSidebar';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Settings,
  List,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

interface PdfReaderProps {
  bookId: number;
  title: string;
}

export function PdfReader({ bookId, title }: PdfReaderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Store
  const {
    zoomMode, customZoom, viewMode,
    isSettingsOpen, isTocOpen, isBookmarksOpen,
    closeSettings, closeToc, closeBookmarks,
    toggleSettings, toggleToc, toggleBookmarks,
  } = usePdfReaderStore();

  // Document loading
  const {
    pdfDocRef, pageCacheRef, MAX_PAGE_CACHE,
    isLoading, error, totalPages, defaultPageSize, outline,
  } = usePdfDocument(bookId);

  // Scale & layout
  const {
    containerWidth, effectiveViewMode, effectiveIsPageMode,
    scale, scaledWidth, scaledHeight, dpr, scaleKey,
    prevScaleRef, prevViewModeRef,
  } = usePdfScale({ defaultPageSize, viewMode, zoomMode, customZoom, scrollContainerRef });

  const totalContentHeight = PADDING_Y * 2 + totalPages * scaledHeight + Math.max(0, totalPages - 1) * PAGE_GAP;

  // Navigation
  const {
    currentPage, setCurrentPage, spreadStart, spreadEnd,
    scrollToPage, goToPage,
    handlePrevious, handleNext, handleProgressChange,
    resolveDestination, updateCurrentPageFromScroll,
    currentLocation, hasPrevious, hasNext,
  } = usePdfNavigation({
    pdfDocRef, totalPages, effectiveViewMode, effectiveIsPageMode,
    scaledHeight, scrollContainerRef,
  });

  // Rendering engine
  const { mountedRange, canvasRef } = usePdfRenderer({
    pdfDocRef, pageCacheRef, maxPageCache: MAX_PAGE_CACHE,
    totalPages, scale, scaleKey, dpr, scaledWidth, scaledHeight,
    effectiveIsPageMode, effectiveViewMode,
    currentPage, spreadStart, spreadEnd,
    containerWidth, isLoading, scrollContainerRef,
    scrollToPage, prevScaleRef, prevViewModeRef,
  });

  // Position persistence
  const { progressPct } = usePdfPosition({
    bookId, currentPage, totalPages,
    isLoading, containerWidth, scaledHeight,
    effectiveIsPageMode, goToPage, scrollToPage, setCurrentPage,
  });

  // Bookmarks
  const bookIdStr = String(bookId);
  const { bookmarks } = useBookmarks(bookIdStr);
  const bookmarkMutations = useBookmarkMutations(bookIdStr);

  const isCurrentlyBookmarked = bookmarks.some(
    (bm) => bm.cfi === `page:${currentPage}`
  );

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
        <PdfBookmarksSidebar
          bookmarks={bookmarks}
          onNavigate={goToPage}
          onRemove={(id) => bookmarkMutations.remove(id)}
          onClose={closeBookmarks}
        />
      )}
    </div>
  );
}
