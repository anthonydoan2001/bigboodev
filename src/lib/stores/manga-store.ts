import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReadingMode, KomgaBook, KomgaPage } from '@/types/komga';

interface ReaderState {
  // Reading mode (persisted)
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;

  // Book progress (persisted) - maps bookId to page number
  bookProgress: Record<string, number>;
  saveLocalProgress: (bookId: string, page: number) => void;

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
      bookProgress: {},

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

      saveLocalProgress: (bookId, page) => {
        set((state) => ({
          bookProgress: { ...state.bookProgress, [bookId]: page },
        }));
      },

      setSession: (book, pages) => {
        const { bookProgress } = get();
        // Priority: local progress > API progress > default to 1
        const localPage = bookProgress[book.id];
        const apiPage = book.readProgress?.page;
        const startPage = localPage || (apiPage && apiPage > 0 ? apiPage : 1);

        set({
          currentBookId: book.id,
          book,
          pages,
          totalPages: pages.length,
          currentPage: Math.min(startPage, pages.length), // Ensure we don't exceed total pages
          isUIVisible: true,
        });
      },

      setCurrentPage: (page) => {
        const { totalPages, currentBookId, saveLocalProgress } = get();
        const clampedPage = Math.max(1, Math.min(page, totalPages));
        set({ currentPage: clampedPage });
        // Save to local storage immediately
        if (currentBookId) {
          saveLocalProgress(currentBookId, clampedPage);
        }
      },

      goToNextPage: () => {
        const { currentPage, totalPages, currentBookId, saveLocalProgress } = get();
        if (currentPage < totalPages) {
          const newPage = currentPage + 1;
          set({ currentPage: newPage });
          // Save to local storage immediately
          if (currentBookId) {
            saveLocalProgress(currentBookId, newPage);
          }
        }
      },

      goToPreviousPage: () => {
        const { currentPage, currentBookId, saveLocalProgress } = get();
        if (currentPage > 1) {
          const newPage = currentPage - 1;
          set({ currentPage: newPage });
          // Save to local storage immediately
          if (currentBookId) {
            saveLocalProgress(currentBookId, newPage);
          }
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
      // Persist reading mode and per-book progress
      partialize: (state) => ({
        readingMode: state.readingMode,
        bookProgress: state.bookProgress,
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
