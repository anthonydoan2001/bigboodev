import { CACHE_MODERATE } from '@/lib/cache-config';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KomgaSeries } from '@/types/komga';
import { fetchDashboard } from '@/lib/api/manga';

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
  if (data) {
    queryClient.setQueryData(['manga', 'libraries'], data.libraries);
    queryClient.setQueryData(['manga', 'in-progress', undefined, 50], data.inProgressBooks);
    queryClient.setQueryData(['manga', 'readlists', undefined, 50, undefined], data.readLists);

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
