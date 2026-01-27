import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  createFolder,
  updateFolder,
  deleteFolder,
  createTag,
  updateTag,
  deleteTag,
  addTagToNote,
  removeTagFromNote,
  uploadAttachment,
  deleteAttachment,
  linkTaskToNote,
  unlinkTaskFromNote,
} from '@/lib/api/notes';
import {
  CreateNoteInput,
  UpdateNoteInput,
  CreateFolderInput,
  UpdateFolderInput,
  CreateTagInput,
  UpdateTagInput,
} from '@/types/notes';

export function useNotesMutations() {
  const queryClient = useQueryClient();

  // Lightweight invalidation - only invalidate what's necessary
  const invalidateNotes = (includeList = true) => {
    if (includeList) {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
    queryClient.invalidateQueries({ queryKey: ['pinnedNotes'] });
  };

  const createNoteMutation = useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: () => {
      invalidateNotes();
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: Error) => {
      console.error('Create note error:', error);
      alert(`Failed to create note: ${error.message}`);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) => updateNote(id, input),
    onSuccess: (data, variables) => {
      // Update the specific note in cache
      queryClient.setQueryData(['note', variables.id], data);

      // Update the note in any notes list caches (for title updates in sidebar)
      if (variables.input.title !== undefined || variables.input.content !== undefined) {
        queryClient.setQueriesData(
          { queryKey: ['notes'] },
          (oldData: { items?: Array<{ id: string; title?: string }> } | undefined) => {
            if (!oldData?.items) return oldData;
            return {
              ...oldData,
              items: oldData.items.map((note) =>
                note.id === variables.id
                  ? { ...note, ...data.item, title: data.item?.title ?? note.title }
                  : note
              ),
            };
          }
        );
        // Also update pinned notes widget
        queryClient.setQueriesData(
          { queryKey: ['pinnedNotes'] },
          (oldData: { items?: Array<{ id: string; title?: string }> } | undefined) => {
            if (!oldData?.items) return oldData;
            return {
              ...oldData,
              items: oldData.items.map((note) =>
                note.id === variables.id
                  ? { ...note, ...data.item, title: data.item?.title ?? note.title }
                  : note
              ),
            };
          }
        );
      }

      // Invalidate list if folder/pinned status changed (affects sorting/filtering)
      if (variables.input.folderId !== undefined || variables.input.isPinned !== undefined) {
        invalidateNotes();
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      }
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
      alert(`Failed to update note: ${error.message}`);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      invalidateNotes();
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: Error) => {
      console.error('Delete note error:', error);
      alert(`Failed to delete note: ${error.message}`);
    },
  });

  const restoreNoteMutation = useMutation({
    mutationFn: (id: string) => restoreNote(id),
    onSuccess: () => {
      invalidateNotes();
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: Error) => {
      console.error('Restore note error:', error);
      alert(`Failed to restore note: ${error.message}`);
    },
  });

  const permanentDeleteNoteMutation = useMutation({
    mutationFn: (id: string) => permanentDeleteNote(id),
    onSuccess: () => {
      invalidateNotes();
    },
    onError: (error: Error) => {
      console.error('Permanent delete note error:', error);
      alert(`Failed to permanently delete note: ${error.message}`);
    },
  });

  return {
    createNote: createNoteMutation,
    updateNote: updateNoteMutation,
    deleteNote: deleteNoteMutation,
    restoreNote: restoreNoteMutation,
    permanentDeleteNote: permanentDeleteNoteMutation,
  };
}

export function useFoldersMutations() {
  const queryClient = useQueryClient();

  const createFolderMutation = useMutation({
    mutationFn: (input: CreateFolderInput) => createFolder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: Error) => {
      console.error('Create folder error:', error);
      alert(`Failed to create folder: ${error.message}`);
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFolderInput }) => updateFolder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: Error) => {
      console.error('Update folder error:', error);
      alert(`Failed to update folder: ${error.message}`);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: Error) => {
      console.error('Delete folder error:', error);
      alert(`Failed to delete folder: ${error.message}`);
    },
  });

  return {
    createFolder: createFolderMutation,
    updateFolder: updateFolderMutation,
    deleteFolder: deleteFolderMutation,
  };
}

export function useTagsMutations() {
  const queryClient = useQueryClient();

  const createTagMutation = useMutation({
    mutationFn: (input: CreateTagInput) => createTag(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: Error) => {
      console.error('Create tag error:', error);
      alert(`Failed to create tag: ${error.message}`);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) => updateTag(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: Error) => {
      console.error('Update tag error:', error);
      alert(`Failed to update tag: ${error.message}`);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: Error) => {
      console.error('Delete tag error:', error);
      alert(`Failed to delete tag: ${error.message}`);
    },
  });

  const addTagToNoteMutation = useMutation({
    mutationFn: ({ noteId, tagId }: { noteId: string; tagId: string }) => addTagToNote(noteId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: Error) => {
      console.error('Add tag to note error:', error);
      alert(`Failed to add tag: ${error.message}`);
    },
  });

  const removeTagFromNoteMutation = useMutation({
    mutationFn: ({ noteId, tagId }: { noteId: string; tagId: string }) => removeTagFromNote(noteId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: Error) => {
      console.error('Remove tag from note error:', error);
      alert(`Failed to remove tag: ${error.message}`);
    },
  });

  return {
    createTag: createTagMutation,
    updateTag: updateTagMutation,
    deleteTag: deleteTagMutation,
    addTagToNote: addTagToNoteMutation,
    removeTagFromNote: removeTagFromNoteMutation,
  };
}

export function useAttachmentsMutations() {
  const queryClient = useQueryClient();

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ noteId, file }: { noteId: string; file: File }) => uploadAttachment(noteId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: Error) => {
      console.error('Upload attachment error:', error);
      alert(`Failed to upload attachment: ${error.message}`);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ noteId, attachmentId }: { noteId: string; attachmentId: string }) =>
      deleteAttachment(noteId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: Error) => {
      console.error('Delete attachment error:', error);
      alert(`Failed to delete attachment: ${error.message}`);
    },
  });

  return {
    uploadAttachment: uploadAttachmentMutation,
    deleteAttachment: deleteAttachmentMutation,
  };
}

export function useTaskNoteMutations() {
  const queryClient = useQueryClient();

  const linkTaskMutation = useMutation({
    mutationFn: ({ noteId, taskId }: { noteId: string; taskId: string }) => linkTaskToNote(noteId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Link task error:', error);
      alert(`Failed to link task: ${error.message}`);
    },
  });

  const unlinkTaskMutation = useMutation({
    mutationFn: ({ noteId, taskId }: { noteId: string; taskId: string }) => unlinkTaskFromNote(noteId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Unlink task error:', error);
      alert(`Failed to unlink task: ${error.message}`);
    },
  });

  return {
    linkTask: linkTaskMutation,
    unlinkTask: unlinkTaskMutation,
  };
}
