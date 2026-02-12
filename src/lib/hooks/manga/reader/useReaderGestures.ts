import { useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';

interface UseReaderGesturesOptions {
  isRTL: boolean;
  isPageMode: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  resetHideTimer: () => void;
}

export function useReaderGestures({
  isRTL,
  isPageMode,
  goToNextPage,
  goToPreviousPage,
  resetHideTimer,
}: UseReaderGesturesOptions) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isRTL) {
        goToPreviousPage();
      } else {
        goToNextPage();
      }
      resetHideTimer();
    },
    onSwipedRight: () => {
      if (isRTL) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
      resetHideTimer();
    },
    onSwipedUp: () => {
      if (!isPageMode) {
        goToNextPage();
        resetHideTimer();
      }
    },
    onSwipedDown: () => {
      if (!isPageMode) {
        goToPreviousPage();
        resetHideTimer();
      }
    },
    preventScrollOnSwipe: isPageMode,
    trackMouse: false,
  });

  const handleTap = useCallback((e: React.MouseEvent) => {
    if (!isPageMode) {
      resetHideTimer();
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      if (isRTL) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    } else if (x > (width * 2) / 3) {
      if (isRTL) {
        goToPreviousPage();
      } else {
        goToNextPage();
      }
    }
    resetHideTimer();
  }, [isPageMode, isRTL, goToNextPage, goToPreviousPage, resetHideTimer]);

  return { swipeHandlers, handleTap };
}
