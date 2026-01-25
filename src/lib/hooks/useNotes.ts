import { useQuery } from '@tanstack/react-query';
import { fetchNotes, fetchNote, fetchFolders, fetchTags, fetchPinnedNotes } from '@/lib/api/notes';
import { NotesFilters, NoteWithRelations, FolderTreeNode, TagWithCount } from '@/types/notes';

export function useNotes(filters?: NotesFilters, options?: { includeCounts?: boolean; enabled?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notes', filters, options?.includeCounts],
    queryFn: () => fetchNotes(filters, options?.includeCounts),
    staleTime: 60000, // 60s to reduce refetches
    enabled: options?.enabled !== false, // Default to true unless explicitly disabled
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });

  return {
    notes: data?.items || [],
    counts: data?.counts,
    isLoading,
    error,
    refetch,
  };
}

export function useNote(id: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['note', id],
    queryFn: () => (id ? fetchNote(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 120000, // 2 minutes - individual note content rarely changes externally
    refetchOnWindowFocus: false,
  });

  return {
    note: data?.item as NoteWithRelations | null,
    isLoading,
    error,
    refetch,
  };
}

export function useFolders() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });

  return {
    folders: data?.items || [],
    tree: data?.tree as FolderTreeNode[] || [],
    isLoading,
    error,
    refetch,
  };
}

export function useTags() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    tags: data?.items as TagWithCount[] || [],
    isLoading,
    error,
    refetch,
  };
}

export function usePinnedNotes(limit: number = 3) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pinnedNotes', limit],
    queryFn: () => fetchPinnedNotes(limit),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    notes: data?.items || [],
    isLoading,
    error,
  };
}
