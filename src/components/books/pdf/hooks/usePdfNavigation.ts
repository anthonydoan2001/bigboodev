import { useCallback, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PAGE_GAP, PADDING_Y } from './usePdfScale';

interface UsePdfNavigationOptions {
  pdfDocRef: React.RefObject<PDFDocumentProxy | null>;
  totalPages: number;
  effectiveViewMode: 'scroll' | 'single' | 'double';
  effectiveIsPageMode: boolean;
  scaledHeight: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function usePdfNavigation({
  pdfDocRef,
  totalPages,
  effectiveViewMode,
  effectiveIsPageMode,
  scaledHeight,
  scrollContainerRef,
}: UsePdfNavigationOptions) {
  const [currentPage, setCurrentPage] = useState(1);

  // Double-page spread helpers
  const spreadStart = useMemo(() => {
    if (effectiveViewMode !== 'double') return currentPage;
    return Math.floor((currentPage - 1) / 2) * 2 + 1;
  }, [effectiveViewMode, currentPage]);

  const spreadEnd = useMemo(() => {
    if (effectiveViewMode !== 'double') return currentPage;
    return Math.min(spreadStart + 1, totalPages);
  }, [effectiveViewMode, spreadStart, totalPages]);

  const scrollToPage = useCallback((pageNum: number, behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container || scaledHeight === 0) return;
    const targetTop = PADDING_Y + (pageNum - 1) * (scaledHeight + PAGE_GAP);
    container.scrollTo({ top: targetTop, behavior });
  }, [scaledHeight, scrollContainerRef]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      if (effectiveIsPageMode) {
        setCurrentPage(page);
      } else {
        scrollToPage(page);
      }
    },
    [totalPages, scrollToPage, effectiveIsPageMode]
  );

  const handlePrevious = useCallback(() => {
    if (effectiveViewMode === 'double') {
      const newStart = Math.max(1, spreadStart - 2);
      setCurrentPage(newStart);
    } else if (effectiveViewMode === 'single') {
      setCurrentPage(p => Math.max(1, p - 1));
    } else {
      scrollToPage(Math.max(1, currentPage - 1));
    }
  }, [effectiveViewMode, currentPage, scrollToPage, spreadStart]);

  const handleNext = useCallback(() => {
    if (effectiveViewMode === 'double') {
      const newStart = Math.min(totalPages, spreadStart + 2);
      setCurrentPage(newStart);
    } else if (effectiveViewMode === 'single') {
      setCurrentPage(p => Math.min(totalPages, p + 1));
    } else {
      scrollToPage(Math.min(totalPages, currentPage + 1));
    }
  }, [effectiveViewMode, currentPage, totalPages, scrollToPage, spreadStart]);

  const handleProgressChange = useCallback(
    (value: number) => {
      if (totalPages > 0) {
        const targetPage = Math.max(1, Math.round((value / 100) * totalPages));
        goToPage(targetPage);
      }
    },
    [totalPages, goToPage]
  );

  // Resolve PDF outline destination to page number
  const resolveDestination = useCallback(
    async (dest: unknown): Promise<number | null> => {
      const pdfDoc = pdfDocRef.current;
      if (!pdfDoc) return null;

      try {
        let resolvedDest = dest;
        if (typeof dest === 'string') {
          resolvedDest = await pdfDoc.getDestination(dest);
        }
        if (!Array.isArray(resolvedDest) || resolvedDest.length === 0) return null;

        const ref = resolvedDest[0];
        const pageIndex = await pdfDoc.getPageIndex(ref);
        return pageIndex + 1;
      } catch {
        return null;
      }
    },
    [pdfDocRef]
  );

  // Scroll-mode: update currentPage from scroll position
  const updateCurrentPageFromScroll = useCallback(() => {
    if (effectiveIsPageMode) return;
    const container = scrollContainerRef.current;
    if (!container || totalPages === 0 || scaledHeight === 0) return;

    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const pageStep = scaledHeight + PAGE_GAP;
    const centerY = scrollTop + clientHeight / 2 - PADDING_Y;
    const current = Math.max(1, Math.min(totalPages, Math.floor(centerY / pageStep) + 1));
    setCurrentPage(current);
  }, [effectiveIsPageMode, totalPages, scaledHeight, scrollContainerRef]);

  // Location display
  const currentLocation = useMemo(() => {
    if (effectiveViewMode === 'double' && spreadEnd > spreadStart) {
      return `${spreadStart}-${spreadEnd} / ${totalPages}`;
    }
    return `${currentPage} / ${totalPages}`;
  }, [effectiveViewMode, currentPage, spreadStart, spreadEnd, totalPages]);

  const hasPrevious = effectiveViewMode === 'double' ? spreadStart > 1 : currentPage > 1;
  const hasNext = effectiveViewMode === 'double' ? spreadEnd < totalPages : currentPage < totalPages;

  return {
    currentPage,
    setCurrentPage,
    spreadStart,
    spreadEnd,
    scrollToPage,
    goToPage,
    handlePrevious,
    handleNext,
    handleProgressChange,
    resolveDestination,
    updateCurrentPageFromScroll,
    currentLocation,
    hasPrevious,
    hasNext,
  };
}
