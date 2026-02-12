import { useEffect } from 'react';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { useUpdateReadProgress } from '@/lib/hooks/manga/useProgress';

interface UseProgressSavingOptions {
  bookId: string;
  currentPage: number;
  totalPages: number;
}

export function useProgressSaving({
  bookId,
  currentPage,
  totalPages,
}: UseProgressSavingOptions) {
  const { updateProgress } = useUpdateReadProgress();

  const saveProgress = useDebouncedCallback(
    (page: number, completed: boolean) => {
      updateProgress({
        bookId,
        progress: { page, completed },
      });
    },
    2000,
    { flushOnUnmount: true }
  );

  useEffect(() => {
    if (currentPage > 0 && totalPages > 0) {
      const isCompleted = currentPage >= totalPages;
      saveProgress(currentPage, isCompleted);
    }
  }, [currentPage, totalPages, saveProgress]);
}
