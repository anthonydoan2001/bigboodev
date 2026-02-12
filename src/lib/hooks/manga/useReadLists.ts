import { CACHE_MODERATE } from '@/lib/cache-config';
import { useQuery } from '@tanstack/react-query';
import {
  fetchReadLists,
  fetchReadListById,
  fetchReadListBooks,
} from '@/lib/api/manga';

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
