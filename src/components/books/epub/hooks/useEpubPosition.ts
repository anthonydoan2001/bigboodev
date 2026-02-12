import { useEffect } from 'react';
import {
  useReadingProgress,
  useSaveReadingProgress,
} from '@/lib/hooks/useBooks';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';

interface UseEpubPositionOptions {
  bookId: number;
}

export function useEpubPosition({ bookId }: UseEpubPositionOptions) {
  const bookIdStr = String(bookId);
  const { progress: savedProgress } = useReadingProgress(bookIdStr, 'epub');
  const { saveProgress } = useSaveReadingProgress();

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

  return {
    savedPosition: savedProgress?.position ?? null,
    debouncedSave,
  };
}
