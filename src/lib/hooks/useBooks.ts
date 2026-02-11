import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCalibreSettings,
  saveCalibreSettings,
  testCalibreConnection,
  deleteCalibreSettings,
  fetchBooks,
  fetchBookById,
  searchBooks,
  fetchAuthors,
  fetchSeries,
  fetchShelves,
  fetchReadingProgress,
  fetchRecentlyRead,
  saveReadingProgress,
  fetchAnnotations,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  fetchBookmarks,
  createBookmark,
  deleteBookmark,
} from '@/lib/api/calibre';
import {
  CalibreWebSettingsInput,
  CreateAnnotationInput,
  UpdateAnnotationInput,
  CreateBookmarkInput,
} from '@/types/calibre-web';

// ============ Settings Hooks ============

export function useCalibreSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calibre-settings'],
    queryFn: fetchCalibreSettings,
    staleTime: 5 * 60 * 1000,
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

export function useCalibreSettingsMutation() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (input: CalibreWebSettingsInput) => saveCalibreSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibre-settings'] });
      queryClient.invalidateQueries({ queryKey: ['calibre'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (input: CalibreWebSettingsInput) => testCalibreConnection(input),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalibreSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibre-settings'] });
      queryClient.invalidateQueries({ queryKey: ['calibre'] });
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

// ============ Books Hooks ============

export function useCalibreBooks(feed: string = 'new', options?: { enabled?: boolean }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['calibre', 'books', feed],
    queryFn: () => fetchBooks(feed),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });

  return {
    configured: data?.configured ?? false,
    books: data?.books ?? [],
    total: data?.total ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useCalibreBook(bookId: number | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calibre', 'book', bookId],
    queryFn: () => (bookId ? fetchBookById(bookId) : Promise.resolve(null)),
    enabled: !!bookId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    book: data,
    isLoading,
    error,
    refetch,
  };
}

export function useBookSearch(query: string, options?: { enabled?: boolean }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['calibre', 'search', query],
    queryFn: () => searchBooks(query),
    enabled: (options?.enabled !== false) && query.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    books: data?.books ?? [],
    total: data?.total ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

// ============ Navigation Hooks ============

export function useCalibreAuthors(options?: { enabled?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calibre', 'authors'],
    queryFn: fetchAuthors,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });

  return { authors: data ?? [], isLoading, error };
}

export function useCalibreSeries(options?: { enabled?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calibre', 'series'],
    queryFn: fetchSeries,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });

  return { series: data ?? [], isLoading, error };
}

export function useCalibreShelves(options?: { enabled?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calibre', 'shelves'],
    queryFn: fetchShelves,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });

  return { shelves: data ?? [], isLoading, error };
}

// ============ Reading Progress Hooks ============

export function useReadingProgress(bookId: string | null, format: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calibre', 'progress', bookId, format],
    queryFn: () =>
      bookId && format ? fetchReadingProgress(bookId, format) : Promise.resolve(null),
    enabled: !!bookId && !!format,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    progress: data,
    isLoading,
    error,
    refetch,
  };
}

export function useRecentlyRead(options?: { enabled?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calibre', 'progress', 'recent'],
    queryFn: fetchRecentlyRead,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });

  return { recentProgress: data ?? [], isLoading, error };
}

export function useSaveReadingProgress() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      bookId,
      format,
      position,
      progress,
    }: {
      bookId: string;
      format: string;
      position: string;
      progress: number;
    }) => saveReadingProgress(bookId, format, position, progress),
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['calibre', 'progress', variables.bookId, variables.format],
      });
    },
  });

  return {
    saveProgress: mutation.mutate,
    saveProgressAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}

// ============ Annotation Hooks ============

export function useAnnotations(bookId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calibre', 'annotations', bookId],
    queryFn: () => (bookId ? fetchAnnotations(bookId) : Promise.resolve([])),
    enabled: !!bookId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return { annotations: data ?? [], isLoading, error, refetch };
}

export function useAnnotationMutations(bookId: string) {
  const queryClient = useQueryClient();
  const key = ['calibre', 'annotations', bookId];

  const createMutation = useMutation({
    mutationFn: (input: CreateAnnotationInput) => createAnnotation(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateAnnotationInput) => updateAnnotation(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnotation(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============ Bookmark Hooks ============

export function useBookmarks(bookId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calibre', 'bookmarks', bookId],
    queryFn: () => (bookId ? fetchBookmarks(bookId) : Promise.resolve([])),
    enabled: !!bookId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return { bookmarks: data ?? [], isLoading, error, refetch };
}

export function useBookmarkMutations(bookId: string) {
  const queryClient = useQueryClient();
  const key = ['calibre', 'bookmarks', bookId];

  const createMutation = useMutation({
    mutationFn: (input: CreateBookmarkInput) => createBookmark(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBookmark(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    create: createMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
