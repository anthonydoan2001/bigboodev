import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBookmark,
  updateBookmark,
  deleteBookmark,
  createBookmarkFolder,
  updateBookmarkFolder,
  deleteBookmarkFolder,
  reorderBookmarkFolders,
  createBookmarkSection,
  updateBookmarkSection,
  deleteBookmarkSection,
} from '@/lib/api/bookmarks';
import {
  CreateBookmarkInput,
  UpdateBookmarkInput,
  CreateBookmarkFolderInput,
  UpdateBookmarkFolderInput,
  CreateBookmarkSectionInput,
  UpdateBookmarkSectionInput,
  BookmarkFoldersResponse,
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
      if (variables.input.sectionId !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['bookmarkSections'] });
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      }
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

  const reorderFoldersMutation = useMutation({
    mutationFn: ({ folderIds, sectionId }: { folderIds: string[]; sectionId: string | null }) =>
      reorderBookmarkFolders(folderIds, sectionId),
    onMutate: async ({ folderIds, sectionId }) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarkFolders'] });

      const previousData = queryClient.getQueryData<BookmarkFoldersResponse>(['bookmarkFolders']);

      queryClient.setQueryData<BookmarkFoldersResponse>(['bookmarkFolders'], (old) => {
        if (!old) return old;

        const folderIdSet = new Set(folderIds);

        const updatedTree = old.tree.map((node) => {
          if (!folderIdSet.has(node.id)) return node;
          return { ...node, sectionId, position: folderIds.indexOf(node.id) };
        });
        updatedTree.sort((a, b) => a.position - b.position);

        const updatedItems = old.items.map((item) => {
          if (!folderIdSet.has(item.id)) return item;
          return { ...item, sectionId, position: folderIds.indexOf(item.id) };
        });
        updatedItems.sort((a, b) => a.position - b.position);

        return { items: updatedItems, tree: updatedTree };
      });

      return { previousData };
    },
    onError: (error: Error, _variables, context) => {
      console.error('Reorder bookmark folders error:', error);
      if (context?.previousData) {
        queryClient.setQueryData(['bookmarkFolders'], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
    },
  });

  return {
    createFolder: createFolderMutation,
    updateFolder: updateFolderMutation,
    deleteFolder: deleteFolderMutation,
    reorderFolders: reorderFoldersMutation,
  };
}

export function useBookmarkSectionsMutations() {
  const queryClient = useQueryClient();

  const invalidateSections = () => {
    queryClient.invalidateQueries({ queryKey: ['bookmarkSections'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarkFolders'] });
  };

  const createSectionMutation = useMutation({
    mutationFn: (input: CreateBookmarkSectionInput) => createBookmarkSection(input),
    onSuccess: () => invalidateSections(),
    onError: (error: Error) => {
      console.error('Create bookmark section error:', error);
      alert(`Failed to create section: ${error.message}`);
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookmarkSectionInput }) => updateBookmarkSection(id, input),
    onSuccess: () => invalidateSections(),
    onError: (error: Error) => {
      console.error('Update bookmark section error:', error);
      alert(`Failed to update section: ${error.message}`);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => deleteBookmarkSection(id),
    onSuccess: () => invalidateSections(),
    onError: (error: Error) => {
      console.error('Delete bookmark section error:', error);
      alert(`Failed to delete section: ${error.message}`);
    },
  });

  return {
    createSection: createSectionMutation,
    updateSection: updateSectionMutation,
    deleteSection: deleteSectionMutation,
  };
}
