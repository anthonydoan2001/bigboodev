import { CACHE_MODERATE } from '@/lib/cache-config';
import { useQuery } from '@tanstack/react-query';
import { fetchBooksInProgress, fetchOnDeck } from '@/lib/api/manga';

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
