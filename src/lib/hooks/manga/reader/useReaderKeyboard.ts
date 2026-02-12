import { useEffect } from 'react';

interface UseReaderKeyboardOptions {
  isRTL: boolean;
  isPageMode: boolean;
  isSettingsOpen: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  closeSettings: () => void;
  resetHideTimer: () => void;
}

export function useReaderKeyboard({
  isRTL,
  isPageMode,
  isSettingsOpen,
  goToNextPage,
  goToPreviousPage,
  closeSettings,
  resetHideTimer,
}: UseReaderKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (isRTL) {
            goToNextPage();
          } else {
            goToPreviousPage();
          }
          resetHideTimer();
          break;
        case 'ArrowRight':
          if (isRTL) {
            goToPreviousPage();
          } else {
            goToNextPage();
          }
          resetHideTimer();
          break;
        case 'ArrowUp':
          if (!isPageMode) {
            goToPreviousPage();
            resetHideTimer();
          }
          break;
        case 'ArrowDown':
          if (!isPageMode) {
            goToNextPage();
            resetHideTimer();
          }
          break;
        case 'Escape':
          if (isSettingsOpen) {
            closeSettings();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRTL, isPageMode, isSettingsOpen, goToNextPage, goToPreviousPage, resetHideTimer, closeSettings]);
}
