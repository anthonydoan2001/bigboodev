import { CACHE_FAST, CACHE_MODERATE, CACHE_STATIC } from '@/lib/cache-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KomgaBook, KomgaSeries } from '@/types/komga';
import {
  fetchKomgaSettings,
  saveKomgaSettings,
  testKomgaConnection,
  deleteKomgaSettings,
  fetchLibraries,
  fetchSeries,
  fetchSeriesById,
  fetchBooks,
  fetchBookById,
  fetchBookPages,
  fetchBooksInProgress,
  fetchOnDeck,
  fetchNextBook,
  fetchPreviousBook,
  updateReadProgress,
  deleteReadProgress,
  fetchReadLists,
  fetchReadListById,
  fetchReadListBooks,
  fetchReadListAdjacentBook,
  fetchDashboard,
  DashboardData,
} from '@/lib/api/manga';
import { KomgaSettingsInput, UpdateReadProgressRequest } from '@/types/komga';

// ============ Settings Hooks ============

export function useKomgaSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['komga-settings'],
    queryFn: fetchKomgaSettings,
    ...CACHE_STATIC,
  });

  return {
    configured: data?.configured ?? false,
    settings: data?.settings,
    isLoading,
    error,
    refetch,
  };
}

export function useKomgaSettingsMutation() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (input: KomgaSettingsInput) => saveKomgaSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['komga-settings'] });
      // Also invalidate all manga-related queries
      queryClient.invalidateQueries({ queryKey: ['manga'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (input: KomgaSettingsInput) => testKomgaConnection(input),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKomgaSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['komga-settings'] });
      queryClient.invalidateQueries({ queryKey: ['manga'] });
    },
  });

  return {
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,

    test: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testError: testMutation.error,

    remove: deleteMutation.mutateAsync,
    isRemoving: deleteMutation.isPending,
    removeError: deleteMutation.error,
  };
}

// ============ Dashboard Hook (Combined Data) ============

export function useDashboard(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'dashboard'],
    queryFn: fetchDashboard,
    ...CACHE_MODERATE,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  });

  // Pre-populate individual query caches from dashboard data
  // This prevents re-fetching when navigating to individual pages
  if (data) {
    // Cache libraries
    queryClient.setQueryData(['manga', 'libraries'], data.libraries);

    // Cache in-progress books
    queryClient.setQueryData(['manga', 'in-progress', undefined, 50], data.inProgressBooks);

    // Cache read lists
    queryClient.setQueryData(['manga', 'readlists', undefined, 50, undefined], data.readLists);

    // Cache individual series
    Object.entries(data.seriesMap).forEach(([seriesId, series]) => {
      queryClient.setQueryData(['manga', 'series', seriesId], series);
    });
  }

  return {
    libraries: data?.libraries ?? [],
    inProgressBooks: data?.inProgressBooks?.content ?? [],
    readLists: data?.readLists?.content ?? [],
    seriesMap: data?.seriesMap ?? {} as Record<string, KomgaSeries>,
    isLoading,
    error,
    refetch,
  };
}

// ============ Libraries Hook ============

export function useLibraries(options?: { enabled?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'libraries'],
    queryFn: fetchLibraries,
    ...CACHE_STATIC,
    enabled: options?.enabled !== false,
  });

  return {
    libraries: data ?? [],
    isLoading,
    error,
    refetch,
  };
}

// ============ Series Hooks ============

export function useSeries(options?: {
  page?: number;
  size?: number;
  search?: string;
  libraryId?: string;
  enabled?: boolean;
}) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['manga', 'series', options?.libraryId, options?.page, options?.size, options?.search],
    queryFn: () => fetchSeries(options),
    ...CACHE_MODERATE,
    enabled: options?.enabled !== false,
  });

  return {
    series: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.number ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useSeriesById(seriesId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'series', seriesId],
    queryFn: () => (seriesId ? fetchSeriesById(seriesId) : Promise.resolve(null)),
    enabled: !!seriesId,
    ...CACHE_MODERATE,
  });

  return {
    series: data,
    isLoading,
    error,
    refetch,
  };
}

// ============ Books Hooks ============

export function useBooks(seriesId: string | null, options?: {
  page?: number;
  size?: number;
  unpaged?: boolean;
}) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['manga', 'books', seriesId, options?.page, options?.size, options?.unpaged],
    queryFn: () => (seriesId ? fetchBooks(seriesId, options) : Promise.resolve(null)),
    enabled: !!seriesId,
    ...CACHE_MODERATE,
  });

  return {
    books: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.number ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useBookById(bookId: string | null, options?: { fresh?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'book', bookId],
    queryFn: () => (bookId ? fetchBookById(bookId) : Promise.resolve(null)),
    enabled: !!bookId,
    ...CACHE_FAST,
    ...(options?.fresh && { staleTime: 0, refetchOnMount: 'always' as const }),
  });

  return {
    book: data,
    isLoading,
    error,
    refetch,
  };
}

// ============ Pages Hooks ============

export function useBookPages(bookId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'pages', bookId],
    queryFn: () => (bookId ? fetchBookPages(bookId) : Promise.resolve([])),
    enabled: !!bookId,
    ...CACHE_STATIC,
  });

  return {
    pages: data ?? [],
    isLoading,
    error,
    refetch,
  };
}

// ============ Continue Reading Hooks ============

export function useBooksInProgress(options?: {
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'in-progress', options?.page, options?.size],
    queryFn: () => fetchBooksInProgress(options),
    ...CACHE_MODERATE,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  });

  return {
    books: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    isLoading,
    error,
    refetch,
  };
}

export function useOnDeck(options?: {
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'on-deck', options?.page, options?.size],
    queryFn: () => fetchOnDeck(options),
    ...CACHE_MODERATE,
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
  });

  return {
    books: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    isLoading,
    error,
    refetch,
  };
}

// ============ Navigation Hooks ============

export function useAdjacentBooks(bookId: string | null) {
  const nextQuery = useQuery({
    queryKey: ['manga', 'next-book', bookId],
    queryFn: () => (bookId ? fetchNextBook(bookId) : Promise.resolve(null)),
    enabled: !!bookId,
    ...CACHE_STATIC,
  });

  const previousQuery = useQuery({
    queryKey: ['manga', 'previous-book', bookId],
    queryFn: () => (bookId ? fetchPreviousBook(bookId) : Promise.resolve(null)),
    enabled: !!bookId,
    ...CACHE_STATIC,
  });

  return {
    nextBook: nextQuery.data,
    previousBook: previousQuery.data,
    isLoading: nextQuery.isLoading || previousQuery.isLoading,
  };
}

// ============ Progress Mutation ============

export function useUpdateReadProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      bookId,
      progress,
    }: {
      bookId: string;
      progress: UpdateReadProgressRequest;
    }) => updateReadProgress(bookId, progress),

    // Optimistically update the cache before the API call
    onMutate: async ({ bookId, progress }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['manga', 'book', bookId] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'readlist-books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'in-progress'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'on-deck'] });

      // Snapshot the previous values for rollback
      const previousBook = queryClient.getQueryData(['manga', 'book', bookId]);
      const previousBooksQueries: Array<{ key: readonly unknown[]; data: unknown }> = [];

      // Get all books queries to update (series books + readlist books)
      queryClient.getQueriesData({ queryKey: ['manga', 'books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });
      queryClient.getQueriesData({ queryKey: ['manga', 'readlist-books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });

      // Helper function to update a book's progress
      const updateBookProgress = (book: KomgaBook) => {
        if (book?.id === bookId) {
          return {
            ...book,
            readProgress: {
              ...book.readProgress,
              page: progress.page,
              completed: progress.completed ?? book.readProgress?.completed ?? false,
              lastModified: new Date().toISOString(),
            },
          };
        }
        return book;
      };

      // Optimistically update individual book query
      queryClient.setQueryData(['manga', 'book', bookId], (old: KomgaBook | undefined) => {
        if (!old) return old;
        return updateBookProgress(old);
      });

      // Optimistically update all books list queries
      queryClient.setQueriesData({ queryKey: ['manga', 'books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map(updateBookProgress),
        };
      });

      // Optimistically update in-progress queries
      queryClient.setQueriesData({ queryKey: ['manga', 'in-progress'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map(updateBookProgress),
        };
      });

      // Optimistically update on-deck queries
      queryClient.setQueriesData({ queryKey: ['manga', 'on-deck'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map(updateBookProgress),
        };
      });

      // Optimistically update readlist-books queries
      queryClient.setQueriesData({ queryKey: ['manga', 'readlist-books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map(updateBookProgress),
        };
      });

      // Return context for rollback
      return { previousBook, previousBooksQueries };
    },

    // If the mutation fails, rollback to the previous state
    onError: (err, variables, context) => {
      if (context?.previousBook) {
        queryClient.setQueryData(['manga', 'book', variables.bookId], context.previousBook);
      }
      if (context?.previousBooksQueries) {
        context.previousBooksQueries.forEach(({ key, data }) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    // Always refetch after success or error to ensure we have the latest data
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manga', 'book', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'readlist-books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'series'] }); // For read counts
      queryClient.invalidateQueries({ queryKey: ['manga', 'in-progress'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'on-deck'] });
    },
  });

  return {
    updateProgress: mutation.mutate,
    updateProgressAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

// ============ Delete Progress Mutation ============

export function useDeleteReadProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (bookId: string) => deleteReadProgress(bookId),

    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: ['manga', 'book', bookId] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'readlist-books'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'in-progress'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'on-deck'] });

      const previousBook = queryClient.getQueryData(['manga', 'book', bookId]);
      const previousBooksQueries: Array<{ key: readonly unknown[]; data: unknown }> = [];

      queryClient.getQueriesData({ queryKey: ['manga', 'books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });
      queryClient.getQueriesData({ queryKey: ['manga', 'readlist-books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });

      const clearProgress = (book: KomgaBook) => {
        if (book?.id === bookId) {
          return { ...book, readProgress: null };
        }
        return book;
      };

      queryClient.setQueryData(['manga', 'book', bookId], (old: KomgaBook | undefined) => {
        if (!old) return old;
        return clearProgress(old);
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(clearProgress) };
      });

      queryClient.setQueriesData({ queryKey: ['manga', 'readlist-books'] }, (old: { content?: KomgaBook[] } | undefined) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(clearProgress) };
      });

      return { previousBook, previousBooksQueries };
    },

    onError: (err, bookId, context) => {
      if (context?.previousBook) {
        queryClient.setQueryData(['manga', 'book', bookId], context.previousBook);
      }
      if (context?.previousBooksQueries) {
        context.previousBooksQueries.forEach(({ key, data }) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    onSettled: (_, __, bookId) => {
      queryClient.invalidateQueries({ queryKey: ['manga', 'book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'readlist-books'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'series'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'in-progress'] });
      queryClient.invalidateQueries({ queryKey: ['manga', 'on-deck'] });
    },
  });

  return {
    deleteProgress: mutation.mutate,
    deleteProgressAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

// ============ Reading List Hooks ============

export function useReadLists(options?: {
  page?: number;
  size?: number;
  search?: string;
  enabled?: boolean;
}) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['manga', 'readlists', options?.page, options?.size, options?.search],
    queryFn: () => fetchReadLists(options),
    ...CACHE_MODERATE,
    enabled: options?.enabled !== false,
  });

  return {
    readLists: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.number ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useReadListById(readListId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga', 'readlist', readListId],
    queryFn: () => (readListId ? fetchReadListById(readListId) : Promise.resolve(null)),
    enabled: !!readListId,
    ...CACHE_MODERATE,
  });

  return {
    readList: data,
    isLoading,
    error,
    refetch,
  };
}

export function useReadListBooks(readListId: string | null, options?: {
  page?: number;
  size?: number;
  unpaged?: boolean;
}) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['manga', 'readlist-books', readListId, options?.page, options?.size, options?.unpaged],
    queryFn: () => (readListId ? fetchReadListBooks(readListId, options) : Promise.resolve(null)),
    enabled: !!readListId,
    ...CACHE_MODERATE,
  });

  return {
    books: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    currentPage: data?.number ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useReadListAdjacentBooks(readListId: string | null, bookId: string | null) {
  const nextQuery = useQuery({
    queryKey: ['manga', 'readlist-next-book', readListId, bookId],
    queryFn: () => (readListId && bookId ? fetchReadListAdjacentBook(readListId, bookId, 'next') : Promise.resolve(null)),
    enabled: !!readListId && !!bookId,
    ...CACHE_STATIC,
  });

  const previousQuery = useQuery({
    queryKey: ['manga', 'readlist-previous-book', readListId, bookId],
    queryFn: () => (readListId && bookId ? fetchReadListAdjacentBook(readListId, bookId, 'previous') : Promise.resolve(null)),
    enabled: !!readListId && !!bookId,
    ...CACHE_STATIC,
  });

  return {
    nextBook: nextQuery.data,
    previousBook: previousQuery.data,
    isLoading: nextQuery.isLoading || previousQuery.isLoading,
  };
}
