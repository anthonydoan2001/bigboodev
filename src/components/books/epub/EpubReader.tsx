'use client';

import { useCallback, useRef } from 'react';
import { useBookmarks, useBookmarkMutations } from '@/lib/hooks/useBooks';
import { useEpubReaderStore } from '@/lib/stores/epub-reader-store';
import { useEpubBook } from './hooks/useEpubBook';
import { useEpubNavigation } from './hooks/useEpubNavigation';
import { useEpubAnnotations } from './hooks/useEpubAnnotations';
import { useEpubPosition } from './hooks/useEpubPosition';
import { useReadingTime } from './hooks/useReadingTime';
import { ReaderControls } from '../shared/ReaderControls';
import { ReaderSettingsPanel } from './ReaderSettingsPanel';
import { TocSidebar } from './TocSidebar';
import { AnnotationsSidebar } from './AnnotationsSidebar';
import { SelectionPopup } from './SelectionPopup';
import { NoteDialog } from './NoteDialog';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, List, Bookmark, BookmarkCheck, Highlighter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpubReaderProps {
  bookId: number;
  title: string;
}

export function EpubReader({ bookId, title }: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Store values
  const {
    flowMode, theme, fontSize, fontFamily, lineHeight, margins,
    isSettingsOpen, isTocOpen, isAnnotationsOpen,
    closeSettings, closeToc, closeAnnotations,
    toggleSettings, toggleToc, toggleAnnotations,
  } = useEpubReaderStore();

  // Position persistence (needs to run before book init for savedPosition)
  const { savedPosition, debouncedSave } = useEpubPosition({ bookId });

  // Book initialization
  const {
    renditionRef,
    isLoading, error, toc, totalLocations,
  } = useEpubBook({
    bookId,
    containerRef,
    flowMode, theme, fontSize, fontFamily, lineHeight, margins,
    onSelected: (cfiRange, text, position) => {
      annotationActions.handleSelection(cfiRange, text, position);
    },
    onRelocated: (location) => {
      nav.handleRelocated(location);
      debouncedSave(location.start.cfi, location.start.percentage || 0);
    },
    savedPosition,
  });

  // Navigation
  const nav = useEpubNavigation({ renditionRef, flowMode, toc });

  // Annotations
  const annotationActions = useEpubAnnotations({
    bookId,
    renditionRef,
    currentChapter: nav.currentChapter,
  });

  // Reading time
  const { readingTimeLeft } = useReadingTime({
    totalLocations,
    progress: nav.progress,
  });

  // Bookmarks
  const bookIdStr = String(bookId);
  const { bookmarks } = useBookmarks(bookIdStr);
  const bookmarkMutations = useBookmarkMutations(bookIdStr);

  const isCurrentlyBookmarked = bookmarks.some((bm) => {
    if (!nav.currentCfi) return false;
    return bm.cfi === nav.currentCfi;
  });

  const handleToggleBookmark = useCallback(async () => {
    if (!nav.currentCfi) return;

    const existing = bookmarks.find((bm) => bm.cfi === nav.currentCfi);
    if (existing) {
      await bookmarkMutations.remove(existing.id);
    } else {
      await bookmarkMutations.create({
        bookId: bookIdStr,
        cfi: nav.currentCfi,
        chapter: nav.currentChapter,
        progress: nav.progress / 100,
      });
    }
  }, [nav.currentCfi, nav.currentChapter, nav.progress, bookmarks, bookmarkMutations, bookIdStr]);

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
        currentLocation={nav.currentLocation}
        progress={nav.progress}
        onPrevious={nav.handlePrevious}
        onNext={nav.handleNext}
        hasPrevious={nav.canGoPrev}
        hasNext={nav.canGoNext}
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
            nav.pageTransition && 'opacity-80'
          )}
          ref={containerRef}
          onClick={() => annotationActions.clearSelectionPopup()}
        />
      </ReaderControls>

      {/* Bottom bar reading time */}
      {readingTimeLeft && !isLoading && (
        <div className="fixed bottom-12 right-6 z-40 text-white/50 text-xs pointer-events-none">
          {Math.round(nav.progress)}% · {readingTimeLeft}
        </div>
      )}

      {/* Selection popup */}
      {annotationActions.selectionPopup && (
        <SelectionPopup
          position={annotationActions.selectionPopup.position}
          onHighlight={annotationActions.handleCreateHighlight}
          onAddNote={annotationActions.handleAddNote}
        />
      )}

      {/* Note dialog */}
      <NoteDialog
        open={!!annotationActions.noteDialogAnnotation}
        onClose={() => annotationActions.setNoteDialogAnnotation(null)}
        annotation={annotationActions.noteDialogAnnotation}
        onSave={annotationActions.handleSaveNote}
        onDelete={annotationActions.handleDeleteAnnotation}
      />

      {/* Sidebars */}
      {isSettingsOpen && <ReaderSettingsPanel onClose={closeSettings} />}

      {isTocOpen && (
        <TocSidebar
          toc={toc}
          currentChapter={nav.currentChapter}
          onNavigate={nav.navigateToChapter}
          onClose={closeToc}
        />
      )}

      {isAnnotationsOpen && (
        <AnnotationsSidebar
          annotations={annotationActions.annotations}
          bookmarks={bookmarks}
          onNavigateAnnotation={(cfiRange) => renditionRef.current?.display(cfiRange)}
          onNavigateBookmark={(cfi) => renditionRef.current?.display(cfi)}
          onEditAnnotation={annotationActions.setNoteDialogAnnotation}
          onDeleteAnnotation={annotationActions.handleDeleteAnnotation}
          onDeleteBookmark={(id) => bookmarkMutations.remove(id)}
          onClose={closeAnnotations}
        />
      )}
    </>
  );
}
