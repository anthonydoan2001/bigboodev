import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReadingMode, KomgaBook, KomgaPage } from '@/types/komga';

interface ReaderState {
  // Reading mode (persisted)
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;

  // Current session (not persisted)
  currentBookId: string | null;
  currentPage: number;
  totalPages: number;
  book: KomgaBook | null;
  pages: KomgaPage[];

  // UI state
  isUIVisible: boolean;
  isSettingsOpen: boolean;

  // Actions
  setSession: (book: KomgaBook, pages: KomgaPage[]) => void;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  toggleUI: () => void;
  showUI: () => void;
  hideUI: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  clearSession: () => void;
}

export const useMangaStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Persisted settings
      readingMode: 'vertical-scroll',

      // Session state
      currentBookId: null,
      currentPage: 1,
      totalPages: 0,
      book: null,
      pages: [],

      // UI state
      isUIVisible: true,
      isSettingsOpen: false,

      // Actions
      setReadingMode: (mode) => set({ readingMode: mode }),

      setSession: (book, pages) =>
        set({
          currentBookId: book.id,
          book,
          pages,
          totalPages: pages.length,
          currentPage: book.readProgress?.page || 1,
          isUIVisible: true,
        }),

      setCurrentPage: (page) => {
        const { totalPages } = get();
        const clampedPage = Math.max(1, Math.min(page, totalPages));
        set({ currentPage: clampedPage });
      },

      goToNextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages) {
          set({ currentPage: currentPage + 1 });
        }
      },

      goToPreviousPage: () => {
        const { currentPage } = get();
        if (currentPage > 1) {
          set({ currentPage: currentPage - 1 });
        }
      },

      toggleUI: () => set((state) => ({ isUIVisible: !state.isUIVisible })),

      showUI: () => set({ isUIVisible: true }),

      hideUI: () => set({ isUIVisible: false }),

      openSettings: () => set({ isSettingsOpen: true, isUIVisible: true }),

      closeSettings: () => set({ isSettingsOpen: false }),

      clearSession: () =>
        set({
          currentBookId: null,
          currentPage: 1,
          totalPages: 0,
          book: null,
          pages: [],
          isSettingsOpen: false,
        }),
    }),
    {
      name: 'manga-reader-settings',
      // Only persist the reading mode preference
      partialize: (state) => ({
        readingMode: state.readingMode,
      }),
    }
  )
);

// Selector hooks for performance
export const useReadingMode = () => useMangaStore((state) => state.readingMode);
export const useCurrentPage = () => useMangaStore((state) => state.currentPage);
export const useTotalPages = () => useMangaStore((state) => state.totalPages);
export const useIsUIVisible = () => useMangaStore((state) => state.isUIVisible);
export const useIsSettingsOpen = () => useMangaStore((state) => state.isSettingsOpen);
