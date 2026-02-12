import { useEffect, useRef } from 'react';
import {
  useReadingProgress,
  useSaveReadingProgress,
} from '@/lib/hooks/useBooks';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';

interface UsePdfPositionOptions {
  bookId: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  containerWidth: number;
  scaledHeight: number;
  effectiveIsPageMode: boolean;
  goToPage: (page: number) => void;
  scrollToPage: (pageNum: number, behavior?: ScrollBehavior) => void;
  setCurrentPage: (page: number) => void;
}

export function usePdfPosition({
  bookId,
  currentPage,
  totalPages,
  isLoading,
  containerWidth,
  scaledHeight,
  effectiveIsPageMode,
  goToPage,
  scrollToPage,
  setCurrentPage,
}: UsePdfPositionOptions) {
  const bookIdStr = String(bookId);
  const hasRestoredPositionRef = useRef(false);
  const { progress: savedProgress } = useReadingProgress(bookIdStr, 'pdf');
  const { saveProgress } = useSaveReadingProgress();

  const debouncedSave = useDebouncedCallback(
    (page: number, total: number) => {
      saveProgress({
        bookId: bookIdStr,
        format: 'pdf',
        position: String(page),
        progress: page / total,
      });
    },
    2000,
    { flushOnUnmount: true }
  );

  const progressPct = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  // Restore saved position
  useEffect(() => {
    if (
      !isLoading &&
      !hasRestoredPositionRef.current &&
      containerWidth > 0 &&
      totalPages > 0 &&
      scaledHeight > 0
    ) {
      hasRestoredPositionRef.current = true;
      if (savedProgress?.position) {
        const savedPage = parseInt(savedProgress.position, 10);
        if (!isNaN(savedPage) && savedPage > 1 && savedPage <= totalPages) {
          if (effectiveIsPageMode) {
            setCurrentPage(savedPage);
          } else {
            requestAnimationFrame(() => {
              scrollToPage(savedPage, 'instant');
            });
          }
        }
      }
    }
  }, [isLoading, containerWidth, totalPages, scaledHeight, savedProgress, scrollToPage, effectiveIsPageMode, setCurrentPage]);

  // Save progress on page change
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      debouncedSave(currentPage, totalPages);
    }
  }, [currentPage, totalPages, debouncedSave]);

  return { progressPct };
}
