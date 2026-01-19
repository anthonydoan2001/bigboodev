import { useEffect } from 'react';

interface UseReaderKeyboardOptions {
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  enabled: boolean;
}

/**
 * Custom hook for keyboard navigation in comic reader
 * Handles ArrowLeft, ArrowRight, and Escape keys
 */
export function useReaderKeyboard({
  onPrevious,
  onNext,
  onClose,
  canGoPrevious,
  canGoNext,
  enabled,
}: UseReaderKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for arrow keys to avoid scrolling
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (canGoPrevious) {
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (canGoNext) {
            onNext();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPrevious, onNext, onClose, canGoPrevious, canGoNext, enabled]);
}
