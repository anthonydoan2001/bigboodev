import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchKomgaSettings,
  saveKomgaSettings,
  testKomgaConnection,
  deleteKomgaSettings,
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
} from '@/lib/api/manga';
import { KomgaSettingsInput, UpdateReadProgressRequest } from '@/types/komga';

// ============ Settings Hooks ============

export function useKomgaSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['komga-settings'],
    queryFn: fetchKomgaSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
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

// ============ Series Hooks ============

export function useSeries(options?: {
  page?: number;
  size?: number;
  search?: string;
  enabled?: boolean;
}) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['manga', 'series', options?.page, options?.size, options?.search],
    queryFn: () => fetchSeries(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    // Use shorter stale time to ensure we get fresh progress data
    staleTime: options?.fresh ? 0 : 30 * 1000, // 30 seconds for regular, 0 for fresh
    refetchOnWindowFocus: false,
    refetchOnMount: options?.fresh ? 'always' : true, // Always refetch when mounting reader
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    staleTime: 60 * 1000, // 1 minute - progress changes frequently
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
    staleTime: 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const previousQuery = useQuery({
    queryKey: ['manga', 'previous-book', bookId],
    queryFn: () => (bookId ? fetchPreviousBook(bookId) : Promise.resolve(null)),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
      await queryClient.cancelQueries({ queryKey: ['manga', 'in-progress'] });
      await queryClient.cancelQueries({ queryKey: ['manga', 'on-deck'] });

      // Snapshot the previous values for rollback
      const previousBook = queryClient.getQueryData(['manga', 'book', bookId]);
      const previousBooksQueries: Array<{ key: readonly unknown[]; data: unknown }> = [];

      // Get all books queries to update
      queryClient.getQueriesData({ queryKey: ['manga', 'books'] }).forEach(([key, data]) => {
        previousBooksQueries.push({ key, data });
      });

      // Helper function to update a book's progress
      const updateBookProgress = (book: any) => {
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
      queryClient.setQueryData(['manga', 'book', bookId], (old: any) => {
        if (!old) return old;
        return updateBookProgress(old);
      });

      // Optimistically update all books list queries
      queryClient.setQueriesData({ queryKey: ['manga', 'books'] }, (old: any) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map(updateBookProgress),
        };
      });

      // Optimistically update in-progress queries
      queryClient.setQueriesData({ queryKey: ['manga', 'in-progress'] }, (old: any) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map(updateBookProgress),
        };
      });

      // Optimistically update on-deck queries
      queryClient.setQueriesData({ queryKey: ['manga', 'on-deck'] }, (old: any) => {
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
