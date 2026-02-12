import { useEffect, useRef, useState, useCallback } from 'react';
import { useMangaStore } from '@/lib/stores/manga-store';
import { KomgaBook, KomgaPage } from '@/types/komga';

interface UseReaderSessionOptions {
  book: KomgaBook;
  pages: KomgaPage[];
  isPageMode: boolean;
  zoom: number;
  currentPage: number;
  pageRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  centerScrollPosition: () => void;
}

export function useReaderSession({
  book,
  pages,
  isPageMode,
  zoom,
  currentPage,
  pageRefs,
  scrollContainerRef,
  centerScrollPosition,
}: UseReaderSessionOptions) {
  const { setSession } = useMangaStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const hasScrolledToSavedPage = useRef(false);

  // Wait for zustand to hydrate from localStorage
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const unsubFinishHydration = useMangaStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useMangaStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Initialize session only after hydration
  useEffect(() => {
    if (isHydrated) {
      setSession(book, pages);
    }
  }, [isHydrated, book, pages, setSession]);

  // Reset state when book changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    hasScrolledToSavedPage.current = false;
    setIsInitializing(true);
  }, [book.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll to saved page position in scroll modes (after hydration and session init)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isHydrated) return;

    if (isPageMode || currentPage <= 1) {
      setIsInitializing(false);
      if (isPageMode && zoom > 1) {
        requestAnimationFrame(() => centerScrollPosition());
      }
      return;
    }

    if (hasScrolledToSavedPage.current) return;

    const timeoutIds: NodeJS.Timeout[] = [];
    let cancelled = false;

    const attemptScroll = (attempt = 0) => {
      if (cancelled) return;

      const pageElement = pageRefs.current.get(currentPage);
      if (pageElement && scrollContainerRef.current) {
        requestAnimationFrame(() => {
          if (!cancelled && pageElement) {
            pageElement.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'start' });
            hasScrolledToSavedPage.current = true;
            setTimeout(() => setIsInitializing(false), 100);
          }
        });
      } else if (attempt < 20) {
        const timeoutId = setTimeout(() => attemptScroll(attempt + 1), 100);
        timeoutIds.push(timeoutId);
      } else {
        setIsInitializing(false);
      }
    };

    const initialTimeout = setTimeout(() => attemptScroll(0), 150);
    timeoutIds.push(initialTimeout);

    return () => {
      cancelled = true;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [isHydrated, isPageMode, currentPage, book.id, zoom, centerScrollPosition, pageRefs, scrollContainerRef]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { isInitializing };
}
