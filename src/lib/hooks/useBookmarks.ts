import { useQuery } from '@tanstack/react-query';
import { fetchBookmarks, fetchBookmark, fetchBookmarkFolders, fetchPinnedBookmarks } from '@/lib/api/bookmarks';
import { BookmarksFilters, BookmarkWithRelations, BookmarkFolderTreeNode } from '@/types/bookmarks';

export function useBookmarks(filters?: BookmarksFilters, options?: { includeCounts?: boolean; enabled?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookmarks', filters, options?.includeCounts],
    queryFn: () => fetchBookmarks(filters, options?.includeCounts),
    staleTime: 60000, // 60s to reduce refetches
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: false,
  });

  return {
    bookmarks: data?.items || [],
    counts: data?.counts,
    isLoading,
    error,
    refetch,
  };
}

export function useBookmark(id: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookmark', id],
    queryFn: () => (id ? fetchBookmark(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    bookmark: data?.item as BookmarkWithRelations | null,
    isLoading,
    error,
    refetch,
  };
}

export function useBookmarkFolders() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookmarkFolders'],
    queryFn: fetchBookmarkFolders,
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    folders: data?.items || [],
    tree: data?.tree as BookmarkFolderTreeNode[] || [],
    isLoading,
    error,
    refetch,
  };
}

export function usePinnedBookmarks(limit: number = 3) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pinnedBookmarks', limit],
    queryFn: () => fetchPinnedBookmarks(limit),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    bookmarks: data?.items || [],
    isLoading,
    error,
  };
}
