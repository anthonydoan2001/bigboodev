import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EpubTheme = 'light' | 'sepia' | 'dark';
export type FlowMode = 'paginated' | 'scrolled';

interface EpubReaderState {
  // Persisted preferences
  flowMode: FlowMode;
  theme: EpubTheme;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  margins: number;

  // Session UI state (not persisted)
  isSettingsOpen: boolean;
  isTocOpen: boolean;
  isAnnotationsOpen: boolean;

  // Actions
  setFlowMode: (mode: FlowMode) => void;
  setTheme: (theme: EpubTheme) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setLineHeight: (height: number) => void;
  setMargins: (margins: number) => void;

  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleToc: () => void;
  openToc: () => void;
  closeToc: () => void;
  toggleAnnotations: () => void;
  openAnnotations: () => void;
  closeAnnotations: () => void;
  closeAllPanels: () => void;
}

export const useEpubReaderStore = create<EpubReaderState>()(
  persist(
    (set) => ({
      // Persisted preferences
      flowMode: 'paginated',
      theme: 'dark',
      fontSize: 100,
      fontFamily: 'default',
      lineHeight: 1.6,
      margins: 40,

      // Session UI state
      isSettingsOpen: false,
      isTocOpen: false,
      isAnnotationsOpen: false,

      // Actions
      setFlowMode: (flowMode) => set({ flowMode }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize: Math.max(60, Math.min(200, fontSize)) }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setLineHeight: (lineHeight) => set({ lineHeight: Math.max(1, Math.min(3, lineHeight)) }),
      setMargins: (margins) => set({ margins: Math.max(0, Math.min(100, margins)) }),

      toggleSettings: () => set((s) => ({
        isSettingsOpen: !s.isSettingsOpen,
        isTocOpen: false,
        isAnnotationsOpen: false,
      })),
      openSettings: () => set({ isSettingsOpen: true, isTocOpen: false, isAnnotationsOpen: false }),
      closeSettings: () => set({ isSettingsOpen: false }),

      toggleToc: () => set((s) => ({
        isTocOpen: !s.isTocOpen,
        isSettingsOpen: false,
        isAnnotationsOpen: false,
      })),
      openToc: () => set({ isTocOpen: true, isSettingsOpen: false, isAnnotationsOpen: false }),
      closeToc: () => set({ isTocOpen: false }),

      toggleAnnotations: () => set((s) => ({
        isAnnotationsOpen: !s.isAnnotationsOpen,
        isSettingsOpen: false,
        isTocOpen: false,
      })),
      openAnnotations: () => set({ isAnnotationsOpen: true, isSettingsOpen: false, isTocOpen: false }),
      closeAnnotations: () => set({ isAnnotationsOpen: false }),

      closeAllPanels: () => set({ isSettingsOpen: false, isTocOpen: false, isAnnotationsOpen: false }),
    }),
    {
      name: 'epub-reader-settings',
      partialize: (state) => ({
        flowMode: state.flowMode,
        theme: state.theme,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        lineHeight: state.lineHeight,
        margins: state.margins,
      }),
    }
  )
);

// Selector hooks for performance
export const useFlowMode = () => useEpubReaderStore((s) => s.flowMode);
export const useEpubTheme = () => useEpubReaderStore((s) => s.theme);
export const useEpubFontSize = () => useEpubReaderStore((s) => s.fontSize);
export const useEpubFontFamily = () => useEpubReaderStore((s) => s.fontFamily);
export const useEpubLineHeight = () => useEpubReaderStore((s) => s.lineHeight);
export const useEpubMargins = () => useEpubReaderStore((s) => s.margins);
