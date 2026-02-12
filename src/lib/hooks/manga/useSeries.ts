import { CACHE_MODERATE } from '@/lib/cache-config';
import { useQuery } from '@tanstack/react-query';
import { fetchSeries, fetchSeriesById } from '@/lib/api/manga';

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
