import { CACHE_MODERATE, CACHE_STATIC } from '@/lib/cache-config';
import { useQuery } from '@tanstack/react-query';
import { fetchNotes, fetchNote, fetchFolders, fetchPinnedNotes, fetchNoteSections } from '@/lib/api/notes';
import { NotesFilters, NoteWithRelations, FolderTreeNode, NoteSection } from '@/types/notes';

export function useNotes(filters?: NotesFilters, options?: { includeCounts?: boolean; enabled?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notes', filters, options?.includeCounts],
    queryFn: () => fetchNotes(filters, options?.includeCounts),
    ...CACHE_MODERATE,
    enabled: options?.enabled !== false,
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
    ...CACHE_MODERATE,
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
    ...CACHE_STATIC,
  });

  return {
    folders: data?.items || [],
    tree: data?.tree as FolderTreeNode[] || [],
    isLoading,
    error,
    refetch,
  };
}

export function useNoteSections() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['noteSections'],
    queryFn: fetchNoteSections,
    ...CACHE_STATIC,
  });

  return {
    sections: data?.items as NoteSection[] || [],
    isLoading,
    error,
    refetch,
  };
}

export function usePinnedNotes(limit: number = 3) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pinnedNotes', limit],
    queryFn: () => fetchPinnedNotes(limit),
    ...CACHE_MODERATE,
  });

  return {
    notes: data?.items || [],
    isLoading,
    error,
  };
}
