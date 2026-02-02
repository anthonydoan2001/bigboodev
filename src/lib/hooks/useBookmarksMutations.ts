import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBookmark,
  updateBookmark,
  deleteBookmark,
  createBookmarkFolder,
  updateBookmarkFolder,
  deleteBookmarkFolder,
} from '@/lib/api/bookmarks';
import {
  CreateBookmarkInput,
  UpdateBookmarkInput,
  CreateBookmarkFolderInput,
  UpdateBookmarkFolderInput,
} from '@/types/bookmarks';

export function useBookmarksMutations() {
  const queryClient = useQueryClient();

  const invalidateBookmarks = () => {
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['pinnedBookmarks'] });
  };

  const createBookmarkMutation = useMutation({
    mutationFn: (input: CreateBookmarkInput) => createBookmark(input),
    onSuccess: () => {
      invalidateBookmarks();
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
    },
    onError: (error: Error) => {
      console.error('Create bookmark error:', error);
      alert(`Failed to create bookmark: ${error.message}`);
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookmarkInput }) => updateBookmark(id, input),
    onSuccess: (data, variables) => {
      // Update the specific bookmark in cache
      queryClient.setQueryData(['bookmark', variables.id], data);

      // Update the bookmark in any bookmarks list caches
      if (variables.input.title !== undefined || variables.input.url !== undefined) {
        queryClient.setQueriesData(
          { queryKey: ['bookmarks'] },
          (oldData: { items?: Array<{ id: string }> } | undefined) => {
            if (!oldData?.items) return oldData;
            return {
              ...oldData,
              items: oldData.items.map((bookmark) =>
                bookmark.id === variables.id
                  ? { ...bookmark, ...data.item }
                  : bookmark
              ),
            };
          }
        );
        // Also update pinned bookmarks widget
        queryClient.setQueriesData(
          { queryKey: ['pinnedBookmarks'] },
          (oldData: { items?: Array<{ id: string }> } | undefined) => {
            if (!oldData?.items) return oldData;
            return {
              ...oldData,
              items: oldData.items.map((bookmark) =>
                bookmark.id === variables.id
                  ? { ...bookmark, ...data.item }
                  : bookmark
              ),
            };
          }
        );
      }

      // Invalidate list if folder/pinned status changed
      if (variables.input.folderId !== undefined || variables.input.isPinned !== undefined) {
        invalidateBookmarks();
        queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      }
    },
    onError: (error: Error) => {
      console.error('Update bookmark error:', error);
      alert(`Failed to update bookmark: ${error.message}`);
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) => deleteBookmark(id),
    onSuccess: () => {
      invalidateBookmarks();
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
    },
    onError: (error: Error) => {
      console.error('Delete bookmark error:', error);
      alert(`Failed to delete bookmark: ${error.message}`);
    },
  });

  return {
    createBookmark: createBookmarkMutation,
    updateBookmark: updateBookmarkMutation,
    deleteBookmark: deleteBookmarkMutation,
  };
}

export function useBookmarkFoldersMutations() {
  const queryClient = useQueryClient();

  const createFolderMutation = useMutation({
    mutationFn: (input: CreateBookmarkFolderInput) => createBookmarkFolder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
    },
    onError: (error: Error) => {
      console.error('Create bookmark folder error:', error);
      alert(`Failed to create folder: ${error.message}`);
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookmarkFolderInput }) => updateBookmarkFolder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
    },
    onError: (error: Error) => {
      console.error('Update bookmark folder error:', error);
      alert(`Failed to update folder: ${error.message}`);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteBookmarkFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (error: Error) => {
      console.error('Delete bookmark folder error:', error);
      alert(`Failed to delete folder: ${error.message}`);
    },
  });

  return {
    createFolder: createFolderMutation,
    updateFolder: updateFolderMutation,
    deleteFolder: deleteFolderMutation,
  };
}
