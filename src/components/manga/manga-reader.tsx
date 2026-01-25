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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const hasScrolledToSavedPage = useRef(false);

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
  const isVerticalScroll = readingMode === 'vertical-scroll';
  const isHorizontalScroll = readingMode === 'horizontal-scroll-ltr' || readingMode === 'horizontal-scroll-rtl';

  // Wait for zustand to hydrate from localStorage
  useEffect(() => {
    const unsubFinishHydration = useMangaStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Check if already hydrated (e.g., navigating without refresh)
    if (useMangaStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  // Initialize session only after hydration
  useEffect(() => {
    if (isHydrated) {
      setSession(book, pages);
    }
  }, [isHydrated, book, pages, setSession]);

  // Reset state when book changes
  useEffect(() => {
    hasScrolledToSavedPage.current = false;
    setIsInitializing(true);
    // Don't clear pageRefs - they'll be updated naturally and the observer needs them
  }, [book.id]);

  // Scroll to saved page position in scroll modes (after hydration and session init)
  useEffect(() => {
    // If in page mode or starting from page 1, no need to scroll - ready immediately
    if (!isHydrated) return;

    if (isPageMode || currentPage <= 1) {
      setIsInitializing(false);
      return;
    }

    if (hasScrolledToSavedPage.current) return;

    // Wait for pages to render, then scroll to the saved position
    // Use requestAnimationFrame to ensure DOM is ready
    const timeoutIds: NodeJS.Timeout[] = [];
    let cancelled = false;

    const attemptScroll = (attempt = 0) => {
      if (cancelled) return;

      const pageElement = pageRefs.current.get(currentPage);
      if (pageElement && scrollContainerRef.current) {
        // Use requestAnimationFrame for smoother scroll timing
        requestAnimationFrame(() => {
          if (!cancelled && pageElement) {
            pageElement.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'start' });
            hasScrolledToSavedPage.current = true;
            // Wait a bit for scroll to complete, then show content
            setTimeout(() => setIsInitializing(false), 100);
          }
        });
      } else if (attempt < 20) {
        // Retry up to 20 times (2 seconds total)
        const timeoutId = setTimeout(() => attemptScroll(attempt + 1), 100);
        timeoutIds.push(timeoutId);
      } else {
        // Give up after max attempts and show content anyway
        setIsInitializing(false);
      }
    };

    // Start after a small delay to let initial render complete
    const initialTimeout = setTimeout(() => attemptScroll(0), 150);
    timeoutIds.push(initialTimeout);

    return () => {
      cancelled = true;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [isHydrated, isPageMode, currentPage, book.id]);

  // Track visible page in scroll modes using Intersection Observer
  useEffect(() => {
    if (isPageMode) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const observerOptions: IntersectionObserverInit = {
      root: container,
      rootMargin: '0px',
      threshold: 0.5, // Trigger when 50% of page is visible
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

      // Debounce the page update using requestAnimationFrame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        // Update current page to the lowest visible page number
        if (visiblePages.size > 0) {
          const lowestVisiblePage = Math.min(...visiblePages);
          setCurrentPage(lowestVisiblePage);
        }
      });
    }, observerOptions);

    // Wait a bit for pages to render, then observe
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
  }, [isPageMode, setCurrentPage, pages.length, book.id]);

  // Debounced progress save - flush on unmount to ensure progress is saved when navigating away
  const saveProgress = useDebouncedCallback(
    (page: number, completed: boolean) => {
      updateProgress({
        bookId: book.id,
        progress: { page, completed },
      });
    },
    2000,
    { flushOnUnmount: true }
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
          unoptimized
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
        <div className="bg-gradient-to-b from-black/80 to-transparent px-3 sm:px-4 py-3">
          {/* Single unified controls row */}
          <div className="relative flex items-center gap-2 sm:gap-3">
            {/* Left: Back + Book Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9 flex-shrink-0"
                asChild
                title="Back to series"
              >
                <Link href={`/manga/series/${book.seriesId}`}>
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

            {/* Center: Page Navigation - Absolutely centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 bg-black/30 rounded-lg px-2 sm:px-3 py-1.5">
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

      {/* Loading overlay - shown while initializing and scrolling to saved position */}
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
          isPageMode && 'flex items-center justify-center',
          readingMode === 'vertical-scroll' && 'overflow-y-auto overflow-x-hidden',
          readingMode === 'horizontal-scroll-ltr' && 'overflow-x-auto overflow-y-hidden flex flex-row',
          readingMode === 'horizontal-scroll-rtl' && 'overflow-x-auto overflow-y-hidden flex flex-row-reverse',
          isInitializing && 'invisible' // Hide content while initializing to prevent flash
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

      {/* Settings modal */}
      <ReaderSettings open={isSettingsOpen} onClose={closeSettings} />
    </div>
  );
}
