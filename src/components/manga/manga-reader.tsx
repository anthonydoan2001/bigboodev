'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Image from 'next/image';
import { useSwipeable } from 'react-swipeable';
import { useMangaStore } from '@/lib/stores/manga-store';
import { useUpdateReadProgress, useAdjacentBooks } from '@/lib/hooks/useManga';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { getPageUrl } from '@/lib/api/manga';
import { ReaderSettings } from './reader-settings';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KomgaBook, KomgaPage } from '@/types/komga';
import {
  Settings,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MangaReaderProps {
  book: KomgaBook;
  pages: KomgaPage[];
}

export function MangaReader({ book, pages }: MangaReaderProps) {
  const router = useRouter();
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());

  const {
    readingMode,
    currentPage,
    isUIVisible,
    isSettingsOpen,
    setSession,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    showUI,
    hideUI,
    openSettings,
    closeSettings,
  } = useMangaStore();

  const { updateProgress } = useUpdateReadProgress();
  const { nextBook, previousBook } = useAdjacentBooks(book.id);

  const totalPages = pages.length;
  const isPageMode = readingMode === 'page-ltr' || readingMode === 'page-rtl';
  const isRTL = readingMode === 'page-rtl' || readingMode === 'horizontal-scroll-rtl';

  // Initialize session
  useEffect(() => {
    setSession(book, pages);
  }, [book, pages, setSession]);

  // Debounced progress save
  const saveProgress = useDebouncedCallback(
    (page: number, completed: boolean) => {
      updateProgress({
        bookId: book.id,
        progress: { page, completed },
      });
    },
    2000
  );

  // Save progress when page changes
  useEffect(() => {
    if (currentPage > 0 && totalPages > 0) {
      const isCompleted = currentPage >= totalPages;
      saveProgress(currentPage, isCompleted);
    }
  }, [currentPage, totalPages, saveProgress]);

  // Auto-hide UI after inactivity
  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    showUI();
    hideTimeoutRef.current = setTimeout(() => {
      if (!isSettingsOpen) {
        hideUI();
      }
    }, 3000);
  }, [showUI, hideUI, isSettingsOpen]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (isRTL) {
            goToNextPage();
          } else {
            goToPreviousPage();
          }
          resetHideTimer();
          break;
        case 'ArrowRight':
          if (isRTL) {
            goToPreviousPage();
          } else {
            goToNextPage();
          }
          resetHideTimer();
          break;
        case 'ArrowUp':
          if (!isPageMode) {
            goToPreviousPage();
            resetHideTimer();
          }
          break;
        case 'ArrowDown':
          if (!isPageMode) {
            goToNextPage();
            resetHideTimer();
          }
          break;
        case 'Escape':
          if (isSettingsOpen) {
            closeSettings();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRTL, isPageMode, isSettingsOpen, goToNextPage, goToPreviousPage, resetHideTimer, closeSettings]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isRTL) {
        goToPreviousPage();
      } else {
        goToNextPage();
      }
      resetHideTimer();
    },
    onSwipedRight: () => {
      if (isRTL) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
      resetHideTimer();
    },
    onSwipedUp: () => {
      if (!isPageMode) {
        goToNextPage();
        resetHideTimer();
      }
    },
    onSwipedDown: () => {
      if (!isPageMode) {
        goToPreviousPage();
        resetHideTimer();
      }
    },
    preventScrollOnSwipe: isPageMode,
    trackMouse: false,
  });

  // Handle tap zones for page mode
  const handleTap = (e: React.MouseEvent) => {
    if (!isPageMode) {
      resetHideTimer();
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Tap zones: left 1/3 = previous, right 1/3 = next, center = toggle UI
    if (x < width / 3) {
      if (isRTL) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    } else if (x > (width * 2) / 3) {
      if (isRTL) {
        goToPreviousPage();
      } else {
        goToNextPage();
      }
    }
    resetHideTimer();
  };

  // Page loaded callback
  const handlePageLoad = (pageNum: number) => {
    setLoadedPages((prev) => new Set(prev).add(pageNum));
  };

  // Navigate to next/previous book
  const handleNextBook = () => {
    if (nextBook) {
      router.push(`/manga/read/${nextBook.id}`);
    }
  };

  const handlePreviousBook = () => {
    if (previousBook) {
      router.push(`/manga/read/${previousBook.id}`);
    }
  };

  // Render page image
  const renderPage = (pageNum: number, index: number) => {
    const pageUrl = getPageUrl(book.id, pageNum);
    const page = pages[index];
    const isLoaded = loadedPages.has(pageNum);

    return (
      <div
        key={pageNum}
        className={cn(
          'relative flex-shrink-0',
          isPageMode ? 'w-full h-full' : '',
          readingMode === 'vertical-scroll' && 'w-full',
          readingMode.includes('horizontal') && 'h-full'
        )}
        style={
          !isPageMode
            ? {
                aspectRatio: page ? `${page.width}/${page.height}` : undefined,
              }
            : undefined
        }
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
          width={!isPageMode ? page?.width : undefined}
          height={!isPageMode ? page?.height : undefined}
          className={cn(
            'object-contain',
            isPageMode ? '' : 'w-full h-auto'
          )}
          onLoad={() => handlePageLoad(pageNum)}
          priority={pageNum <= currentPage + 2}
          sizes="100vw"
        />
      </div>
    );
  };

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
        <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              asChild
            >
              <Link href={`/manga/series/${book.seriesId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>

            <div className="text-white text-center flex-1 mx-4">
              <p className="font-medium truncate">{book.metadata.title || book.name}</p>
              <p className="text-sm text-white/70 truncate">{book.seriesTitle}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={openSettings}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reader content */}
      <div
        className={cn(
          'flex-1 overflow-auto',
          isPageMode && 'flex items-center justify-center',
          readingMode === 'vertical-scroll' && 'overflow-y-auto overflow-x-hidden',
          readingMode === 'horizontal-scroll-ltr' && 'overflow-x-auto overflow-y-hidden flex flex-row',
          readingMode === 'horizontal-scroll-rtl' && 'overflow-x-auto overflow-y-hidden flex flex-row-reverse'
        )}
        onClick={handleTap}
      >
        {isPageMode ? (
          // Page-by-page mode: show only current page
          <div className="w-full h-full flex items-center justify-center">
            {renderPage(currentPage, currentPage - 1)}
          </div>
        ) : (
          // Scroll mode: show all pages
          <div
            className={cn(
              readingMode === 'vertical-scroll' && 'flex flex-col items-center w-full max-w-4xl mx-auto',
              readingMode.includes('horizontal') && 'flex h-full'
            )}
          >
            {pages.map((_, index) => renderPage(index + 1, index))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-50 transition-transform duration-300',
          isUIVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <div className="flex items-center gap-4 mb-3">
            <span className="text-white text-sm w-12 text-right">{currentPage}</span>
            <Progress
              value={currentPage}
              max={totalPages}
              className="flex-1 h-2 bg-white/30"
            />
            <span className="text-white text-sm w-12">{totalPages}</span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handlePreviousBook}
              disabled={!previousBook}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Book
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  if (isRTL) goToNextPage();
                  else goToPreviousPage();
                }}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  if (isRTL) goToPreviousPage();
                  else goToNextPage();
                }}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleNextBook}
              disabled={!nextBook}
            >
              Next Book
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      <ReaderSettings open={isSettingsOpen} onClose={closeSettings} />
    </div>
  );
}
