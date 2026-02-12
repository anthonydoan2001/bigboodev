import { useEffect, useRef, useCallback } from 'react';
import { useMangaStore } from '@/lib/stores/manga-store';

export function useAutoHideUI() {
  const { isUIVisible, isSettingsOpen, showUI, hideUI } = useMangaStore();
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    showUI();
    hideTimeoutRef.current = setTimeout(() => {
      if (!isSettingsOpen) {
        hideUI();
      }
    }, 3000);
  }, [showUI, hideUI, isSettingsOpen]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimer]);

  return { isUIVisible, resetHideTimer };
}
