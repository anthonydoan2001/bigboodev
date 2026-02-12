import { CACHE_MODERATE, CACHE_STATIC } from '@/lib/cache-config';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBookmarks, fetchBookmark, fetchBookmarkFolders, fetchPinnedBookmarks, fetchBookmarkSections } from '@/lib/api/bookmarks';
import { BookmarksFilters, BookmarkWithRelations, BookmarkFolderTreeNode, BookmarkSection } from '@/types/bookmarks';

export function useBookmarks(filters?: BookmarksFilters, options?: { includeCounts?: boolean; enabled?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookmarks', filters, options?.includeCounts],
    queryFn: () => fetchBookmarks(filters, options?.includeCounts),
    ...CACHE_MODERATE,
    enabled: options?.enabled !== false,
  });

  return {
    bookmarks: data?.items || [],
    counts: data?.counts,
    grouped: data?.grouped,
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
    ...CACHE_MODERATE,
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
    ...CACHE_STATIC,
  });

  return {
    folders: data?.items || [],
    tree: data?.tree as BookmarkFolderTreeNode[] || [],
    isLoading,
    error,
    refetch,
  };
}

export function useBookmarkSections() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookmarkSections'],
    queryFn: fetchBookmarkSections,
    ...CACHE_STATIC,
  });

  return {
    sections: data?.items as BookmarkSection[] || [],
    isLoading,
    error,
    refetch,
  };
}

export function usePrefetchBookmarks() {
  const queryClient = useQueryClient();

  return (folderId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['bookmarks', { folderId }, false],
      queryFn: () => fetchBookmarks({ folderId }),
      ...CACHE_MODERATE,
    });
  };
}

export function usePinnedBookmarks(limit: number = 3) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pinnedBookmarks', limit],
    queryFn: () => fetchPinnedBookmarks(limit),
    ...CACHE_MODERATE,
  });

  return {
    bookmarks: data?.items || [],
    isLoading,
    error,
  };
}
