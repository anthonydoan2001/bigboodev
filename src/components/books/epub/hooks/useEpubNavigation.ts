import { useCallback, useState } from 'react';
import type { Rendition, NavItem } from 'epubjs';

interface UseEpubNavigationOptions {
  renditionRef: React.RefObject<Rendition | null>;
  flowMode: 'paginated' | 'scrolled';
  toc: NavItem[];
}

export function useEpubNavigation({ renditionRef, flowMode, toc }: UseEpubNavigationOptions) {
  const [currentLocation, setCurrentLocation] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<string | undefined>();
  const [canGoNext, setCanGoNext] = useState(true);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [currentCfi, setCurrentCfi] = useState<string>('');
  const [pageTransition, setPageTransition] = useState(false);

  const handlePrevious = useCallback(() => {
    if (flowMode === 'paginated') {
      setPageTransition(true);
      setTimeout(() => setPageTransition(false), 150);
    }
    renditionRef.current?.prev();
  }, [flowMode, renditionRef]);

  const handleNext = useCallback(() => {
    if (flowMode === 'paginated') {
      setPageTransition(true);
      setTimeout(() => setPageTransition(false), 150);
    }
    renditionRef.current?.next();
  }, [flowMode, renditionRef]);

  const navigateToChapter = useCallback((href: string) => {
    renditionRef.current?.display(href);
  }, [renditionRef]);

  // Called by the parent when a `relocated` event fires
  const handleRelocated = useCallback((location: {
    start: { cfi: string; displayed: { page: number; total: number }; percentage: number; href: string };
    atEnd: boolean;
    atStart: boolean;
  }) => {
    const pct = location.start.percentage || 0;
    const displayPage = location.start.displayed?.page || 1;
    const displayTotal = location.start.displayed?.total || 1;

    if (flowMode === 'paginated') {
      setCurrentLocation(`${displayPage} / ${displayTotal}`);
    } else {
      const chapter = toc.find((t) => location.start.href?.includes(t.href));
      setCurrentLocation(chapter?.label?.trim() || `${Math.round(pct * 100)}%`);
    }

    setProgress(pct * 100);
    setCanGoNext(!location.atEnd);
    setCanGoPrev(!location.atStart);
    setCurrentCfi(location.start.cfi);
    setCurrentChapter(location.start.href);
  }, [flowMode, toc]);

  return {
    currentLocation,
    progress,
    currentChapter,
    canGoNext,
    canGoPrev,
    currentCfi,
    pageTransition,
    handlePrevious,
    handleNext,
    navigateToChapter,
    handleRelocated,
  };
}
