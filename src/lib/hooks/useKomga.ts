import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api-client';
import { KomgaBook, KomgaLibraryStats } from '@/types/komga';

/**
 * React Query hooks for Komga API
 */

export function useRecentBooks(limit: number = 10) {
  return useQuery<KomgaBook[]>({
    queryKey: ['komga', 'recent', limit],
    queryFn: async () => {
      const res = await fetch(`/api/komga/recent?limit=${limit}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch recent books');
      const data = await res.json();
      return data.books || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInProgressBooks() {
  return useQuery<KomgaBook[]>({
    queryKey: ['komga', 'in-progress'],
    queryFn: async () => {
      const res = await fetch('/api/komga/in-progress', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch in-progress books');
      const data = await res.json();
      return data.books || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequently updated)
  });
}

export function useLibraryStats() {
  return useQuery<KomgaLibraryStats>({
    queryKey: ['komga', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/komga/stats', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch library stats');
      const data = await res.json();
      return {
        totalBooks: data.totalBooks || 0,
        totalSeries: data.totalSeries || 0,
        unreadBooks: data.unreadBooks || 0,
        inProgressBooks: data.inProgressBooks || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSearchBooks(query: string, page: number = 0, size: number = 20) {
  return useQuery<{
    books: KomgaBook[];
    totalElements: number;
    totalPages: number;
    page: number;
  }>({
    queryKey: ['komga', 'search', query, page, size],
    queryFn: async () => {
      if (!query.trim()) {
        return { books: [], totalElements: 0, totalPages: 0, page: 0 };
      }
      const res = await fetch(`/api/komga/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to search books');
      return await res.json();
    },
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
