'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBookMetadata, useSaveProgress } from '@/lib/hooks/useKomga';
import { useReaderKeyboard } from '@/lib/hooks/useReaderKeyboard';
import { useSwipeable } from 'react-swipeable';
import { PageViewer } from './PageViewer';
import { ReaderControls } from './ReaderControls';
import { NavigationButtons } from './NavigationButtons';
import { getBookPageUrl, preloadPageImages } from '@/lib/komga-reader';
import { getReaderSettings, ReadingMode } from '@/lib/reader-settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ComicReaderProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ComicReader({ bookId, isOpen, onClose }: ComicReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [readingMode, setReadingMode] = useState<ReadingMode>('paged-ltr');
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preloadAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch book metadata
  const { data: bookData, isLoading: isLoadingMetadata, error: metadataError } = useBookMetadata(
    isOpen ? bookId : null
  );

  // Save progress mutation
  const saveProgressMutation = useSaveProgress();

  const totalPages = bookData?.media?.pagesCount || 0;
  const bookTitle = bookData?.metadata?.title || bookData?.name || 'Untitled';
  const seriesTitle = bookData?.seriesId ? 'Series' : undefined; // Could fetch series name if needed
  const seriesId = bookData?.seriesId || '';

  // Reset initialization state when bookId changes
  useEffect(() => {
    setIsInitialized(false);
    setCurrentPage(1);
  }, [bookId]);

  // Load reader settings for this series
  useEffect(() => {
    if (seriesId) {
      const settings = getReaderSettings(seriesId);
      setReadingMode(settings.readingMode);
      setZoom(settings.zoom);
    }
  }, [seriesId]);

  // Initialize current page from read progress or default to page 1
  useEffect(() => {
    if (bookData && !isInitialized && totalPages > 0) {
      const readProgress = bookData.readProgress;
      let startPage = 1;
      
      if (readProgress && typeof readProgress.page === 'number') {
        const lastReadPage = readProgress.page;
        // Use the saved page if it's valid - this is where the user left off
        if (lastReadPage >= 1 && lastReadPage <= totalPages) {
          startPage = lastReadPage;
        } else if (lastReadPage > totalPages) {
          startPage = totalPages;
        }
      }
      
      setCurrentPage(startPage);
      setIsInitialized(true);
    }
  }, [bookData, totalPages, isInitialized, bookId]);

  // Reset state when reader closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
      setIsInitialized(false);
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
        saveProgressTimeoutRef.current = null;
      }
      if (preloadAbortControllerRef.current) {
        preloadAbortControllerRef.current.abort();
        preloadAbortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  // Debounced progress saving
  const saveProgress = useCallback(
    (page: number, completed: boolean) => {
      // Clear existing timeout
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }

      // Set new timeout to save after 1 second
      saveProgressTimeoutRef.current = setTimeout(() => {
        saveProgressMutation.mutate({
          bookId,
          page,
          completed,
        });
      }, 1000);
    },
    [bookId, saveProgressMutation]
  );

  // Save progress immediately on close
  useEffect(() => {
    if (!isOpen && isInitialized && currentPage > 0 && totalPages > 0) {
      const completed = currentPage >= totalPages;
      saveProgressMutation.mutate({
        bookId,
        page: currentPage,
        completed,
      });
    }
  }, [isOpen, isInitialized, currentPage, totalPages, bookId, saveProgressMutation]);

  // Navigate to previous page
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      saveProgress(newPage, false);
    }
  }, [currentPage, saveProgress]);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      const completed = newPage >= totalPages;
      saveProgress(newPage, completed);
    }
  }, [currentPage, totalPages, saveProgress]);

  // Preload next 2 pages
  useEffect(() => {
    if (!isOpen || !bookId || currentPage === 0 || totalPages === 0) return;

    // Cancel previous preload
    if (preloadAbortControllerRef.current) {
      preloadAbortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    preloadAbortControllerRef.current = abortController;

    // Preload next 2 pages
    const urlsToPreload: string[] = [];
    if (currentPage < totalPages) {
      urlsToPreload.push(getBookPageUrl(bookId, currentPage + 1));
    }
    if (currentPage + 1 < totalPages) {
      urlsToPreload.push(getBookPageUrl(bookId, currentPage + 2));
    }

    if (urlsToPreload.length > 0) {
      preloadPageImages(urlsToPreload).catch(() => {
        // Silently fail - preloading is best effort
      });
    }

    return () => {
      abortController.abort();
    };
  }, [isOpen, bookId, currentPage, totalPages]);

  // Keyboard shortcuts
  useReaderKeyboard({
    onPrevious: goToPreviousPage,
    onNext: goToNextPage,
    onClose,
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < totalPages,
    enabled: isOpen,
  });

  // Swipe gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNextPage(),
    onSwipedRight: () => goToPreviousPage(),
    trackMouse: false,
  });

  // Prevent body scroll when reader is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm animate-in fade-in-0 duration-300"
      onClick={(e) => {
        // Close on backdrop click (but not on content click)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Controls */}
      {bookData && totalPages > 0 && (
        <ReaderControls
          title={bookTitle}
          seriesTitle={seriesTitle}
          currentPage={currentPage}
          totalPages={totalPages}
          seriesId={seriesId}
          onClose={onClose}
        />
      )}

      {/* Main Content Area */}
      <div
        className="absolute inset-0 pt-16 pb-4"
        {...swipeHandlers}
      >
        {isLoadingMetadata ? (
          <div className="flex items-center justify-center h-full">
            <div className="space-y-4 text-center">
              <Skeleton className="w-64 h-96 mx-auto" />
              <p className="text-body-sm text-muted-foreground">Loading comic...</p>
            </div>
          </div>
        ) : metadataError ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-body text-destructive">
                  Failed to load comic. Please check your connection.
                </p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : bookData && totalPages > 0 ? (
          <>
            <PageViewer
              bookId={bookId}
              pageNumber={currentPage}
              readingMode={readingMode}
              zoom={zoom}
              totalPages={totalPages}
              key={`${bookId}-${currentPage}`}
            />
            <NavigationButtons
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
              canGoPrevious={currentPage > 1}
              canGoNext={currentPage < totalPages}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-body text-muted-foreground">
                  No pages found in this comic.
                </p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
