import { CACHE_STATIC } from '@/lib/cache-config';
import { useQuery } from '@tanstack/react-query';
import {
  fetchNextBook,
  fetchPreviousBook,
  fetchReadListAdjacentBook,
} from '@/lib/api/manga';

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
