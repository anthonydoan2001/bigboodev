import { CACHE_FAST, CACHE_MODERATE, CACHE_STATIC } from '@/lib/cache-config';
import { useQuery } from '@tanstack/react-query';
import { fetchBooks, fetchBookById, fetchBookPages } from '@/lib/api/manga';

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
