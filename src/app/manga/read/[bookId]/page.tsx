'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookMetadata, useSaveProgress, useSeriesBooks, useCollection } from '@/lib/hooks/useKomga';
import { getReaderSettings } from '@/lib/reader-settings';
import { ReadingMode } from '@/lib/reader-settings';
import { PageViewer } from '@/components/komga/reader/PageViewer';
import { ReaderControls } from '@/components/komga/reader/ReaderControls';
import { NavigationButtons } from '@/components/komga/reader/NavigationButtons';
import { useSwipeable } from 'react-swipeable';
import { getBookPageUrl, preloadPageImages } from '@/lib/komga-reader';

function ReaderContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = params?.bookId as string;
  
  // Check if we came from a collection
  const fromCollection = searchParams.get('from') === 'collection';
  const collectionId = searchParams.get('collectionId');

  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [readingMode, setReadingMode] = useState<ReadingMode>('paged-ltr');
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preloadAbortControllerRef = useRef<AbortController | null>(null);
  const prevReadingModeRef = useRef<ReadingMode | null>(null);

  // Fetch book metadata
  const { data: bookData, isLoading: isLoadingMetadata, error: metadataError } = useBookMetadata(
    bookId || null
  );

  // Fetch series books for navigation
  const seriesId = bookData?.seriesId || '';
  const { data: seriesBooksData } = useSeriesBooks(seriesId || null);
  
  // Fetch collection if we're in collection mode
  const { data: collectionData } = useCollection(fromCollection && collectionId ? collectionId : null);

  // Save progress mutation
  const saveProgressMutation = useSaveProgress();

  const totalPages = bookData?.media?.pagesCount || 0;
  const bookTitle = bookData?.metadata?.title || bookData?.name || 'Untitled';
  const seriesTitle = bookData?.seriesId ? 'Series' : undefined;

  // Sort books by numberSort and find current book position
  // If in collection mode, use collection order instead of series order
  const { sortedBooks, currentBookIndex, previousBookId, nextBookId } = useMemo(() => {
    // If we're in collection mode, use collection items order
    if (fromCollection && collectionData && bookId) {
      const items = collectionData.items || [];
      // Find current item by bookId
      const currentItemIndex = items.findIndex(item => item.bookId === bookId);
      
      if (currentItemIndex >= 0) {
        // Find previous book item (skip series items)
        let prevItem = null;
        for (let i = currentItemIndex - 1; i >= 0; i--) {
          if (items[i].bookId) {
            prevItem = items[i];
            break;
          }
        }
        
        // Find next book item (skip series items)
        let nextItem = null;
        for (let i = currentItemIndex + 1; i < items.length; i++) {
          if (items[i].bookId) {
            nextItem = items[i];
            break;
          }
        }
        
        return {
          sortedBooks: [],
          currentBookIndex: currentItemIndex,
          previousBookId: prevItem?.bookId || null,
          nextBookId: nextItem?.bookId || null,
        };
      }
    }
    
    // Fallback to series order
    if (!seriesBooksData || !bookId) {
      return { sortedBooks: [], currentBookIndex: -1, previousBookId: null, nextBookId: null };
    }

    const sorted = [...seriesBooksData].sort((a, b) => {
      const aNumber = a.metadata?.numberSort ?? 0;
      const bNumber = b.metadata?.numberSort ?? 0;
      return aNumber - bNumber;
    });

    const currentIndex = sorted.findIndex(book => book.id === bookId);
    const previousBook = currentIndex > 0 ? sorted[currentIndex - 1] : null;
    const nextBook = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

    return {
      sortedBooks: sorted,
      currentBookIndex: currentIndex,
      previousBookId: previousBook?.id || null,
      nextBookId: nextBook?.id || null,
    };
  }, [seriesBooksData, bookId, fromCollection, collectionData]);

  // Load reader settings for this series on mount
  useEffect(() => {
    if (!seriesId) {
      setReadingMode('paged-ltr');
      setZoom(1.0);
      prevReadingModeRef.current = 'paged-ltr';
      return;
    }
    
    const settings = getReaderSettings(seriesId);
    setReadingMode(settings.readingMode);
    setZoom(settings.zoom);
    prevReadingModeRef.current = settings.readingMode;
  }, [seriesId]);

  // Listen for settings changes to update reading mode and zoom in real-time
  useEffect(() => {
    if (!seriesId) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `komga_reader_settings_${seriesId}` && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          // Update reading mode
          if (settings.readingMode) {
            setReadingMode((currentMode) => {
              if (settings.readingMode !== currentMode) {
                prevReadingModeRef.current = currentMode;
                return settings.readingMode;
              }
              return currentMode;
            });
          }
          // Update zoom separately
          if (settings.zoom !== undefined) {
            setZoom((currentZoom) => {
              if (settings.zoom !== currentZoom) {
                return settings.zoom;
              }
              return currentZoom;
            });
          }
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };

    const handleCustomChange = () => {
      // Handle same-tab changes via custom event
      const settings = getReaderSettings(seriesId);
      const newReadingMode = settings.readingMode;
      const newZoom = settings.zoom;
      
      // Update reading mode
      setReadingMode((currentMode) => {
        if (currentMode !== newReadingMode) {
          prevReadingModeRef.current = currentMode;
          return newReadingMode;
        }
        return currentMode;
      });
      
      // Update zoom separately
      setZoom((currentZoom) => {
        if (currentZoom !== newZoom) {
          return newZoom;
        }
        return currentZoom;
      });
    };

    // Listen for storage events (works across tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom event (works in same tab)
    window.addEventListener('komga-settings-changed', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('komga-settings-changed', handleCustomChange);
    };
  }, [seriesId]);

  // Reset zoom when reading mode changes (separate effect to avoid nested updates)
  useEffect(() => {
    if (!seriesId || prevReadingModeRef.current === null) {
      return;
    }
    
    if (prevReadingModeRef.current !== readingMode) {
      // Reading mode changed, reset zoom
      setZoom(1.0);
      // Update localStorage
      const updatedSettings = getReaderSettings(seriesId);
      updatedSettings.zoom = 1.0;
      localStorage.setItem(`komga_reader_settings_${seriesId}`, JSON.stringify(updatedSettings));
      prevReadingModeRef.current = readingMode;
    }
  }, [readingMode, seriesId]);

  const isRTL = readingMode.includes('rtl');

  // Initialize current page from saved read progress, or default to page 1
  useEffect(() => {
    // Wait for bookData to be fully loaded (not loading, has data, and has totalPages)
    if (bookData && !isLoadingMetadata && !isInitialized && totalPages > 0) {
      // Use saved reading progress from Komga API
      const readProgress = bookData.readProgress;
      let startPage = 1;
      
      // Check if readProgress exists and has a valid page number
      if (readProgress && typeof readProgress.page === 'number') {
        const lastReadPage = readProgress.page;
        const isCompleted = readProgress.completed || false;
        
        // Always use the saved page if it's valid, regardless of completed status
        // This ensures users can resume where they left off
        if (lastReadPage >= 1 && lastReadPage <= totalPages) {
          // Use the saved page - this is where the user left off
          startPage = lastReadPage;
        } 
        // If page number is out of bounds, clamp to total pages
        else if (lastReadPage > totalPages) {
          startPage = totalPages;
        }
        // If lastReadPage is 0 or invalid, startPage remains 1
      }
      // If no readProgress or page is not a number, startPage remains 1

      // Set page immediately so the page number displays correctly
      setCurrentPage(startPage);
      setIsInitialized(true);
    }
  }, [bookId, bookData, isLoadingMetadata, totalPages, isInitialized]);

  // Debounced progress saving
  const saveProgress = useCallback(
    (page: number, completed: boolean) => {
      // Clear existing timeout
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }

      // Set new timeout to save after 500ms
      saveProgressTimeoutRef.current = setTimeout(() => {
        saveProgressMutation.mutate({
          bookId,
          page,
          completed,
        });
      }, 500);
    },
    [bookId, saveProgressMutation]
  );

  // Navigate to previous page (respects reading mode direction)
  const goToPreviousPage = useCallback(() => {
    if (isRTL) {
      // RTL: previous is next page number
      if (currentPage < totalPages) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        saveProgress(newPage, false);
      }
    } else {
      // LTR: previous is previous page number
      if (currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        saveProgress(newPage, false);
      }
    }
  }, [currentPage, totalPages, saveProgress, isRTL]);

  const goToNextPage = useCallback(() => {
    if (isRTL) {
      // RTL: next is previous page number
      if (currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        saveProgress(newPage, false);
      }
    } else {
      // LTR: next is next page number
      if (currentPage < totalPages) {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        const completed = newPage >= totalPages;
        saveProgress(newPage, completed);
      }
    }
  }, [currentPage, totalPages, saveProgress, isRTL]);

  // Preload next 2 pages
  useEffect(() => {
    if (!bookId || currentPage === 0 || totalPages === 0) return;

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
  }, [bookId, currentPage, totalPages]);

  const canGoPrevious = isRTL ? currentPage < totalPages : currentPage > 1;
  const canGoNext = isRTL ? currentPage > 1 : currentPage < totalPages;

  // Swipe handlers for paged mode navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isRTL) {
        goToPreviousPage();
      } else {
        goToNextPage();
      }
    },
    onSwipedRight: () => {
      if (isRTL) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    },
    preventScrollOnSwipe: true,
    delta: 50, // Minimum distance for swipe
    onTouchStartOrOnMouseDown: (e) => {
      // Don't allow swipe if starting in controls area (top 64px)
      const target = e.event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      if (rect.top < 64) {
        return false; // Prevent swipe handler from activating
      }
    },
  });

  // Prevent body scroll when reader is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Save progress immediately when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Clear any pending save timeout
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
        saveProgressTimeoutRef.current = null;
      }
      
      // Save progress immediately if we have valid data
      // Use refs to avoid dependency on state values that might change
      const pageToSave = currentPage;
      const pagesTotal = totalPages;
      if (isInitialized && pageToSave > 0 && pagesTotal > 0 && bookId) {
        const completed = pageToSave >= pagesTotal;
        // Use mutateAsync to ensure it completes before unmount
        saveProgressMutation.mutate({
          bookId,
          page: pageToSave,
          completed,
        });
      }
    };
  }, [bookId]); // Only depend on bookId - use refs/closure for other values

  if (isLoadingMetadata) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (metadataError || !bookData) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-body text-destructive">
              Failed to load comic. Please check your connection.
            </p>
            <Button 
              onClick={() => {
                router.back();
              }} 
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (totalPages === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-body text-muted-foreground">
              No pages found in this comic.
            </p>
            <Button 
              onClick={() => {
                router.back();
              }} 
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Controls - Fixed position, above swipe area */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <ReaderControls
          title={bookTitle}
          seriesTitle={seriesTitle}
          currentPage={currentPage}
          totalPages={totalPages}
          seriesId={seriesId}
          onClose={() => {
            // Use browser back to maintain scroll position and page state
            if (fromCollection && collectionId) {
              router.back();
            } else if (seriesId) {
              router.back();
            } else {
              router.back();
            }
          }}
          onZoomChange={(newZoom) => {
            setZoom(newZoom);
          }}
          onSettingsChange={() => {
            if (seriesId) {
              const settings = getReaderSettings(seriesId);
              setReadingMode(settings.readingMode);
              setZoom(settings.zoom);
            }
          }}
          onPreviousBook={async () => {
            if (previousBookId) {
              // Save current progress before navigating - wait for it to complete
              if (saveProgressTimeoutRef.current) {
                clearTimeout(saveProgressTimeoutRef.current);
                saveProgressTimeoutRef.current = null;
              }
              const completed = currentPage >= totalPages;
              try {
                await saveProgressMutation.mutateAsync({
                  bookId,
                  page: currentPage,
                  completed,
                });
              } catch (error) {
                console.error('Failed to save progress:', error);
              }
              // Navigate after save completes - preserve collection query parameters if present
              const prevUrl = fromCollection && collectionId
                ? `/manga/read/${previousBookId}?from=collection&collectionId=${collectionId}`
                : `/manga/read/${previousBookId}`;
              router.push(prevUrl);
            }
          }}
          onNextBook={async () => {
            if (nextBookId) {
              // Save current progress before navigating - wait for it to complete
              if (saveProgressTimeoutRef.current) {
                clearTimeout(saveProgressTimeoutRef.current);
                saveProgressTimeoutRef.current = null;
              }
              const completed = currentPage >= totalPages;
              try {
                await saveProgressMutation.mutateAsync({
                  bookId,
                  page: currentPage,
                  completed,
                });
              } catch (error) {
                console.error('Failed to save progress:', error);
              }
              // Navigate after save completes - preserve collection query parameters if present
              const nextUrl = fromCollection && collectionId
                ? `/manga/read/${nextBookId}?from=collection&collectionId=${collectionId}`
                : `/manga/read/${nextBookId}`;
              router.push(nextUrl);
            }
          }}
          canGoToPreviousBook={!!previousBookId}
          canGoToNextBook={!!nextBookId}
        />
      </div>

      {/* Main Content Area - Swipe handlers only for paged mode */}
      <div
        className="absolute inset-0 pt-16 pb-4"
        style={{
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
        {...(readingMode.startsWith('paged') ? swipeHandlers : {})}
        onPointerDown={(e) => {
          // Don't allow swipe if starting in controls area
          const target = e.target as HTMLElement;
          const rect = target.getBoundingClientRect();
          if (rect.top < 64) {
            e.stopPropagation();
            return;
          }
        }}
      >
        <PageViewer
          bookId={bookId}
          pageNumber={currentPage}
          readingMode={readingMode}
          zoom={zoom}
          totalPages={totalPages}
          onPageChange={(page) => {
            // In continuous mode, update page but don't trigger scroll
            const isContinuous = readingMode.startsWith('continuous');
            if (isContinuous) {
              // Only update if page actually changed
              if (page !== currentPage) {
                setCurrentPage(page);
                const completed = page >= totalPages;
                saveProgress(page, completed);
              }
            } else {
              // Paged mode: always update immediately
              setCurrentPage(page);
              const completed = page >= totalPages;
              saveProgress(page, completed);
            }
          }}
          key={`${bookId}-${readingMode}`}
        />
            {/* Only show navigation buttons in paged mode */}
            {readingMode.startsWith('paged') && (
              <NavigationButtons
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
              />
            )}
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ReaderContent />
    </Suspense>
  );
}
