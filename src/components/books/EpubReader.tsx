'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getBookDownloadUrl } from '@/lib/api/calibre';
import {
  useReadingProgress,
  useSaveReadingProgress,
  useAnnotations,
  useAnnotationMutations,
  useBookmarks,
  useBookmarkMutations,
} from '@/lib/hooks/useBooks';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { useEpubReaderStore } from '@/lib/stores/epub-reader-store';
import { ReaderControls } from './ReaderControls';
import { ReaderSettingsPanel } from './ReaderSettingsPanel';
import { TocSidebar } from './TocSidebar';
import { AnnotationsSidebar } from './AnnotationsSidebar';
import { SelectionPopup } from './SelectionPopup';
import { NoteDialog } from './NoteDialog';
import { HIGHLIGHT_COLORS } from './constants';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, List, Bookmark, BookmarkCheck, Highlighter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Rendition, Book as EpubBook, NavItem } from 'epubjs';
import type { BookAnnotation, AnnotationColor } from '@/types/calibre-web';

interface EpubReaderProps {
  bookId: number;
  title: string;
}

export function EpubReader({ bookId, title }: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [progress, setProgress] = useState(0);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentChapter, setCurrentChapter] = useState<string | undefined>();
  const [canGoNext, setCanGoNext] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [currentCfi, setCurrentCfi] = useState<string>('');
  const [totalLocations, setTotalLocations] = useState(0);
  const [readingTimeLeft, setReadingTimeLeft] = useState<string>('');
  const [pageTransition, setPageTransition] = useState(false);

  // Selection popup state
  const [selectionPopup, setSelectionPopup] = useState<{
    position: { x: number; y: number };
    cfiRange: string;
    text: string;
  } | null>(null);

  // Note dialog state
  const [noteDialogAnnotation, setNoteDialogAnnotation] = useState<BookAnnotation | null>(null);

  // Store values
  const {
    flowMode, theme, fontSize, fontFamily, lineHeight, margins,
    isSettingsOpen, isTocOpen, isAnnotationsOpen,
    closeSettings, closeToc, closeAnnotations,
    toggleSettings, toggleToc, toggleAnnotations,
  } = useEpubReaderStore();

  const bookIdStr = String(bookId);
  const { progress: savedProgress } = useReadingProgress(bookIdStr, 'epub');
  const { saveProgress } = useSaveReadingProgress();

  // Annotations & bookmarks
  const { annotations } = useAnnotations(bookIdStr);
  const annotationMutations = useAnnotationMutations(bookIdStr);
  const { bookmarks } = useBookmarks(bookIdStr);
  const bookmarkMutations = useBookmarkMutations(bookIdStr);

  const isCurrentlyBookmarked = bookmarks.some((bm) => {
    if (!currentCfi) return false;
    // Check if bookmark CFI is close to current CFI (same chapter)
    return bm.cfi === currentCfi;
  });

  const debouncedSave = useDebouncedCallback(
    (position: string, progressVal: number) => {
      saveProgress({
        bookId: bookIdStr,
        format: 'epub',
        position,
        progress: progressVal,
      });
    },
    2000,
    { flushOnUnmount: true }
  );

  const handlePrevious = useCallback(() => {
    if (flowMode === 'paginated') {
      setPageTransition(true);
      setTimeout(() => setPageTransition(false), 150);
    }
    renditionRef.current?.prev();
  }, [flowMode]);

  const handleNext = useCallback(() => {
    if (flowMode === 'paginated') {
      setPageTransition(true);
      setTimeout(() => setPageTransition(false), 150);
    }
    renditionRef.current?.next();
  }, [flowMode]);

  // Build theme object for rendition
  const buildThemeStyles = useCallback(() => {
    const themeColors = {
      light: { color: '#1a1a1a', background: '#ffffff' },
      sepia: { color: '#5b4636', background: '#f4ecd8' },
      dark: { color: '#e0e0e0', background: '#1a1a1a' },
    };

    const colors = themeColors[theme];
    const fontFamilyValue = fontFamily === 'default' ? '' : fontFamily;

    return {
      body: {
        color: `${colors.color} !important`,
        background: `${colors.background} !important`,
        'line-height': `${lineHeight} !important`,
        ...(fontFamilyValue ? { 'font-family': `${fontFamilyValue} !important` } : {}),
      },
      'body *': {
        color: `inherit !important`,
      },
    } as Record<string, Record<string, string>>;
  }, [theme, fontFamily, lineHeight]);

  const applyTheme = useCallback((rendition: Rendition) => {
    const styles = buildThemeStyles();
    rendition.themes.register('custom', styles);
    rendition.themes.select('custom');
    rendition.themes.fontSize(`${fontSize}%`);
  }, [buildThemeStyles, fontSize]);

  // Inject highlight CSS into iframe content
  const injectHighlightCSS = useCallback((rendition: Rendition) => {
    const css = Object.entries(HIGHLIGHT_COLORS)
      .map(([color, { bg, border }]) =>
        `.epubjs-hl.highlight-${color} { fill: ${bg}; stroke: ${border}; stroke-width: 1; mix-blend-mode: multiply; cursor: pointer; }`
      )
      .join('\n');

    rendition.on('rendered', () => {
      try {
        const iframeDoc = (rendition as unknown as { manager?: { container?: HTMLElement } })
          .manager?.container?.querySelector('iframe')?.contentDocument;
        if (iframeDoc && !iframeDoc.querySelector('#epub-highlight-styles')) {
          const style = iframeDoc.createElement('style');
          style.id = 'epub-highlight-styles';
          style.textContent = css;
          iframeDoc.head.appendChild(style);
        }
      } catch {
        // Cross-origin or other iframe access issues
      }
    });
  }, []);

  // Apply existing annotations as highlights
  const rehydrateAnnotations = useCallback((rendition: Rendition, anns: BookAnnotation[]) => {
    for (const ann of anns) {
      try {
        rendition.annotations.highlight(
          ann.cfiRange,
          { id: ann.id },
          () => {
            setNoteDialogAnnotation(ann);
          },
          `highlight-${ann.color}`
        );
      } catch {
        // Skip invalid CFI ranges
      }
    }
  }, []);

  // Inject touch swipe listeners into the epub iframe
  const injectTouchListeners = useCallback((rendition: Rendition) => {
    rendition.on('rendered', () => {
      try {
        const iframe = (rendition as unknown as { manager?: { container?: HTMLElement } })
          .manager?.container?.querySelector('iframe');
        const doc = iframe?.contentDocument;
        if (!doc) return;

        let startX = 0;
        let startY = 0;

        doc.addEventListener('touchstart', (e: TouchEvent) => {
          startX = e.changedTouches[0].screenX;
          startY = e.changedTouches[0].screenY;
        }, { passive: true });

        doc.addEventListener('touchend', (e: TouchEvent) => {
          const deltaX = e.changedTouches[0].screenX - startX;
          const deltaY = e.changedTouches[0].screenY - startY;
          // Only handle horizontal swipes (> 50px) that aren't mostly vertical
          if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX > 0) {
              rendition.prev();
            } else {
              rendition.next();
            }
          }
        }, { passive: true });
      } catch {
        // Cross-origin iframe
      }
    });
  }, []);

  // Calculate reading time estimate
  const updateReadingTime = useCallback((pct: number, totalLocs: number) => {
    if (totalLocs <= 0) return;
    const remaining = totalLocs * (1 - pct);
    // ~250 words per location unit, ~200 words per minute
    const minutesLeft = Math.round((remaining * 250) / 200);
    if (minutesLeft < 60) {
      setReadingTimeLeft(`~${minutesLeft}m left`);
    } else {
      const hours = Math.floor(minutesLeft / 60);
      const mins = minutesLeft % 60;
      setReadingTimeLeft(`~${hours}h ${mins > 0 ? `${mins}m ` : ''}left`);
    }
  }, []);

  // Initialize epub.js
  useEffect(() => {
    let mounted = true;

    async function loadBook() {
      try {
        const ePubModule = await import('epubjs');
        const ePubFn = ePubModule.default;

        const downloadUrl = getBookDownloadUrl(bookId, 'epub');
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to download book');

        const arrayBuffer = await response.arrayBuffer();
        const book = ePubFn(arrayBuffer);
        bookRef.current = book;

        await book.ready;

        if (!mounted || !containerRef.current) return;

        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: flowMode === 'paginated' ? 'paginated' : 'scrolled',
        });

        renditionRef.current = rendition;

        // Apply theme + styles
        applyTheme(rendition);

        // Apply margins
        rendition.themes.override('padding', `0 ${margins}px`);

        // Inject highlight CSS
        injectHighlightCSS(rendition);

        // Touch gestures (only paginated)
        if (flowMode === 'paginated') {
          injectTouchListeners(rendition);
        }

        // Load TOC
        const navigation = await book.loaded.navigation;
        if (mounted) {
          setToc(navigation.toc);
        }

        // Handle text selection for highlights
        rendition.on('selected', (cfiRange: string, contents: { window: Window }) => {
          if (!mounted) return;
          const selection = contents.window.getSelection();
          if (!selection || selection.toString().trim().length === 0) return;

          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Get iframe position for coordinate mapping
          const iframe = containerRef.current?.querySelector('iframe');
          const iframeRect = iframe?.getBoundingClientRect() || { left: 0, top: 0 };

          setSelectionPopup({
            position: {
              x: iframeRect.left + rect.left + rect.width / 2,
              y: iframeRect.top + rect.top,
            },
            cfiRange,
            text: selection.toString().trim(),
          });
        });

        // Clear selection popup when clicking elsewhere
        rendition.on('markClicked', () => {
          setSelectionPopup(null);
        });

        // Restore saved position or display from start
        if (savedProgress?.position) {
          await rendition.display(savedProgress.position);
        } else {
          await rendition.display();
        }

        // Track location changes
        rendition.on('relocated', (location: {
          start: { cfi: string; displayed: { page: number; total: number }; percentage: number; href: string };
          atEnd: boolean;
          atStart: boolean;
        }) => {
          if (!mounted) return;

          const pct = location.start.percentage || 0;
          const displayPage = location.start.displayed?.page || 1;
          const displayTotal = location.start.displayed?.total || 1;

          if (flowMode === 'paginated') {
            setCurrentLocation(`${displayPage} / ${displayTotal}`);
          } else {
            // In scrolled mode, find current chapter
            const chapter = navigation.toc.find((t) => location.start.href?.includes(t.href));
            setCurrentLocation(chapter?.label?.trim() || `${Math.round(pct * 100)}%`);
          }

          setProgress(pct * 100);
          setCanGoNext(!location.atEnd);
          setCanGoPrev(!location.atStart);
          setCurrentCfi(location.start.cfi);
          setCurrentChapter(location.start.href);

          updateReadingTime(pct, totalLocations);
          debouncedSave(location.start.cfi, pct);
        });

        // Generate locations for reading time estimate
        book.locations.generate(1024).then((locs: string[]) => {
          if (mounted) {
            setTotalLocations(locs.length);
          }
        });

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load book');
          setIsLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      mounted = false;
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
      }
      renditionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, flowMode]);

  // Rehydrate annotations whenever they change
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || annotations.length === 0) return;

    // Clear existing annotations first
    try {
      for (const ann of annotations) {
        try {
          rendition.annotations.remove(ann.cfiRange, 'highlight');
        } catch {
          // Ignore
        }
      }
    } catch {
      // Ignore
    }

    rehydrateAnnotations(rendition, annotations);
  }, [annotations, rehydrateAnnotations]);

  // Update theme/font when store values change
  useEffect(() => {
    if (renditionRef.current) {
      applyTheme(renditionRef.current);
    }
  }, [applyTheme]);

  // Update margins when store value changes
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.override('padding', `0 ${margins}px`);
    }
  }, [margins]);

  // Update reading time when totalLocations are computed
  useEffect(() => {
    if (totalLocations > 0) {
      updateReadingTime(progress / 100, totalLocations);
    }
  }, [totalLocations, progress, updateReadingTime]);

  const navigateToChapter = useCallback((href: string) => {
    renditionRef.current?.display(href);
  }, []);

  const handleCreateHighlight = useCallback(async (color: AnnotationColor) => {
    if (!selectionPopup) return;
    const rendition = renditionRef.current;
    if (!rendition) return;

    try {
      const annotation = await annotationMutations.create({
        bookId: bookIdStr,
        cfiRange: selectionPopup.cfiRange,
        text: selectionPopup.text,
        color,
        chapter: currentChapter,
      });

      rendition.annotations.highlight(
        selectionPopup.cfiRange,
        { id: annotation.id },
        () => setNoteDialogAnnotation(annotation),
        `highlight-${color}`
      );
    } catch (err) {
      console.error('Failed to create highlight:', err);
    }

    setSelectionPopup(null);
    // Clear selection in iframe
    try {
      const iframe = containerRef.current?.querySelector('iframe');
      iframe?.contentWindow?.getSelection()?.removeAllRanges();
    } catch {
      // Ignore
    }
  }, [selectionPopup, annotationMutations, bookIdStr, currentChapter]);

  const handleAddNote = useCallback((color: AnnotationColor) => {
    handleCreateHighlight(color).then(() => {
      // After creating, find the latest annotation and open note dialog
      // The annotation will be the last created one
    });
  }, [handleCreateHighlight]);

  const handleSaveNote = useCallback(async (id: string, note: string | null, color: AnnotationColor) => {
    try {
      await annotationMutations.update({ id, note, color });
    } catch (err) {
      console.error('Failed to update annotation:', err);
    }
  }, [annotationMutations]);

  const handleDeleteAnnotation = useCallback(async (id: string) => {
    const ann = annotations.find((a) => a.id === id);
    if (ann) {
      try {
        renditionRef.current?.annotations.remove(ann.cfiRange, 'highlight');
      } catch {
        // Ignore
      }
    }
    try {
      await annotationMutations.remove(id);
    } catch (err) {
      console.error('Failed to delete annotation:', err);
    }
  }, [annotations, annotationMutations]);

  const handleToggleBookmark = useCallback(async () => {
    if (!currentCfi) return;

    const existing = bookmarks.find((bm) => bm.cfi === currentCfi);
    if (existing) {
      await bookmarkMutations.remove(existing.id);
    } else {
      await bookmarkMutations.create({
        bookId: bookIdStr,
        cfi: currentCfi,
        chapter: currentChapter,
        progress: progress / 100,
      });
    }
  }, [currentCfi, bookmarks, bookmarkMutations, bookIdStr, currentChapter, progress]);

  const bgColor =
    theme === 'light'
      ? 'bg-white'
      : theme === 'sepia'
        ? 'bg-[#f4ecd8]'
        : 'bg-[#1a1a1a]';

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Failed to load book</p>
          <p className="text-white/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
            <p className="text-white/70">Loading book...</p>
          </div>
        </div>
      )}

      <ReaderControls
        title={title}
        currentLocation={currentLocation}
        progress={progress}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={canGoPrev}
        hasNext={canGoNext}
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
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={toggleAnnotations}
              title="Annotations"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div
          className={cn(
            'w-full h-full transition-opacity duration-150',
            bgColor,
            pageTransition && 'opacity-80'
          )}
          ref={containerRef}
          onClick={() => setSelectionPopup(null)}
        />
      </ReaderControls>

      {/* Bottom bar reading time */}
      {readingTimeLeft && !isLoading && (
        <div className="fixed bottom-12 right-6 z-40 text-white/50 text-xs pointer-events-none">
          {Math.round(progress)}% · {readingTimeLeft}
        </div>
      )}

      {/* Selection popup */}
      {selectionPopup && (
        <SelectionPopup
          position={selectionPopup.position}
          onHighlight={handleCreateHighlight}
          onAddNote={handleAddNote}
        />
      )}

      {/* Note dialog */}
      <NoteDialog
        open={!!noteDialogAnnotation}
        onClose={() => setNoteDialogAnnotation(null)}
        annotation={noteDialogAnnotation}
        onSave={handleSaveNote}
        onDelete={handleDeleteAnnotation}
      />

      {/* Sidebars */}
      {isSettingsOpen && <ReaderSettingsPanel onClose={closeSettings} />}

      {isTocOpen && (
        <TocSidebar
          toc={toc}
          currentChapter={currentChapter}
          onNavigate={navigateToChapter}
          onClose={closeToc}
        />
      )}

      {isAnnotationsOpen && (
        <AnnotationsSidebar
          annotations={annotations}
          bookmarks={bookmarks}
          onNavigateAnnotation={(cfiRange) => renditionRef.current?.display(cfiRange)}
          onNavigateBookmark={(cfi) => renditionRef.current?.display(cfi)}
          onEditAnnotation={setNoteDialogAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onDeleteBookmark={(id) => bookmarkMutations.remove(id)}
          onClose={closeAnnotations}
        />
      )}
    </>
  );
}
