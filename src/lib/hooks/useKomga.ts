import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api-client';
import { KomgaBook, KomgaLibraryStats, KomgaSeries } from '@/types/komga';

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

export function useSeries(limit: number = 50) {
  return useQuery<KomgaSeries[]>({
    queryKey: ['komga', 'series', limit],
    queryFn: async () => {
      const res = await fetch(`/api/komga/series?limit=${limit}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch series');
      const data = await res.json();
      return data.series || [];
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

export function useBookMetadata(bookId: string | null) {
  return useQuery<KomgaBook>({
    queryKey: ['komga', 'book', bookId],
    queryFn: async () => {
      if (!bookId) throw new Error('Book ID is required');
      const res = await fetch(`/api/komga/book/${bookId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch book metadata');
      return await res.json();
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSaveProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookId, page, completed }: { bookId: string; page: number; completed: boolean }) => {
      const res = await fetch(`/api/komga/progress/${bookId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ page, completed }),
      });
      if (!res.ok) throw new Error('Failed to save progress');
      return await res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate book metadata to refresh read progress
      queryClient.invalidateQueries({ queryKey: ['komga', 'book', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['komga', 'in-progress'] });
      // Also invalidate series-books queries to update progress on series page
      queryClient.invalidateQueries({ queryKey: ['komga', 'series-books'] });
      // Invalidate collections to update progress on collection pages
      queryClient.invalidateQueries({ queryKey: ['komga', 'collections'] });
      queryClient.invalidateQueries({ queryKey: ['komga', 'collection'] });
    },
  });
}

export function useSeriesBooks(seriesId: string | null) {
  return useQuery<KomgaBook[]>({
    queryKey: ['komga', 'series-books', seriesId],
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID is required');
      const res = await fetch(`/api/komga/series/${seriesId}/books`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch series books');
      const data = await res.json();
      return data.books || [];
    },
    enabled: !!seriesId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Collection types
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: CollectionItem[];
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  seriesId: string | null;
  bookId: string | null;
  phase: string | null;
  order: number;
  createdAt: Date;
}

export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: ['komga', 'collections'],
    queryFn: async () => {
      const res = await fetch('/api/komga/collections', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch collections');
      const data = await res.json();
      return data.collections || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCollection(collectionId: string | null) {
  return useQuery<Collection>({
    queryKey: ['komga', 'collection', collectionId],
    queryFn: async () => {
      if (!collectionId) throw new Error('Collection ID is required');
      const res = await fetch(`/api/komga/collections/${collectionId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch collection');
      const data = await res.json();
      return data.collection;
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const res = await fetch('/api/komga/collections', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error('Failed to create collection');
      const data = await res.json();
      return data.collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['komga', 'collections'] });
    },
  });
}

export function useAddCollectionItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      items 
    }: { 
      collectionId: string; 
      items: Array<{ seriesId?: string; bookId?: string; phase?: string; order: number }> 
    }) => {
      const res = await fetch(`/api/komga/collections/${collectionId}/items`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to add collection items');
      const data = await res.json();
      return data.items;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['komga', 'collections'] });
      queryClient.invalidateQueries({ queryKey: ['komga', 'collection', variables.collectionId] });
    },
  });
}
