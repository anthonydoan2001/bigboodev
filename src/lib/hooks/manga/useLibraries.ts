import { CACHE_STATIC } from '@/lib/cache-config';
import { useQuery } from '@tanstack/react-query';
import { fetchLibraries } from '@/lib/api/manga';

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
