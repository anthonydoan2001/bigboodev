import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PdfZoomMode = 'fit-width' | 'fit-page' | 'custom';
export type PdfViewMode = 'scroll' | 'single' | 'double';

interface PdfReaderState {
  // Persisted preferences
  zoomMode: PdfZoomMode;
  customZoom: number;
  viewMode: PdfViewMode;

  // Session UI state (not persisted)
  isSettingsOpen: boolean;
  isTocOpen: boolean;
  isBookmarksOpen: boolean;

  // Actions
  setZoomMode: (mode: PdfZoomMode) => void;
  setCustomZoom: (zoom: number) => void;
  setViewMode: (mode: PdfViewMode) => void;

  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleToc: () => void;
  openToc: () => void;
  closeToc: () => void;
  toggleBookmarks: () => void;
  openBookmarks: () => void;
  closeBookmarks: () => void;
  closeAllPanels: () => void;
}

export const usePdfReaderStore = create<PdfReaderState>()(
  persist(
    (set) => ({
      // Persisted preferences
      zoomMode: 'fit-width',
      customZoom: 100,
      viewMode: 'scroll',

      // Session UI state
      isSettingsOpen: false,
      isTocOpen: false,
      isBookmarksOpen: false,

      // Actions
      setZoomMode: (zoomMode) => set({ zoomMode }),
      setCustomZoom: (customZoom) => set({ customZoom: Math.max(50, Math.min(300, customZoom)) }),
      setViewMode: (viewMode) => set({ viewMode }),

      toggleSettings: () => set((s) => ({
        isSettingsOpen: !s.isSettingsOpen,
        isTocOpen: false,
        isBookmarksOpen: false,
      })),
      openSettings: () => set({ isSettingsOpen: true, isTocOpen: false, isBookmarksOpen: false }),
      closeSettings: () => set({ isSettingsOpen: false }),

      toggleToc: () => set((s) => ({
        isTocOpen: !s.isTocOpen,
        isSettingsOpen: false,
        isBookmarksOpen: false,
      })),
      openToc: () => set({ isTocOpen: true, isSettingsOpen: false, isBookmarksOpen: false }),
      closeToc: () => set({ isTocOpen: false }),

      toggleBookmarks: () => set((s) => ({
        isBookmarksOpen: !s.isBookmarksOpen,
        isSettingsOpen: false,
        isTocOpen: false,
      })),
      openBookmarks: () => set({ isBookmarksOpen: true, isSettingsOpen: false, isTocOpen: false }),
      closeBookmarks: () => set({ isBookmarksOpen: false }),

      closeAllPanels: () => set({ isSettingsOpen: false, isTocOpen: false, isBookmarksOpen: false }),
    }),
    {
      name: 'pdf-reader-settings-v2',
      partialize: (state) => ({
        zoomMode: state.zoomMode,
        customZoom: state.customZoom,
        viewMode: state.viewMode,
      }),
    }
  )
);

// Selector hooks for performance
export const usePdfZoomMode = () => usePdfReaderStore((s) => s.zoomMode);
export const usePdfCustomZoom = () => usePdfReaderStore((s) => s.customZoom);
export const usePdfViewMode = () => usePdfReaderStore((s) => s.viewMode);
