import { useCallback } from 'react';
import { useNotesMutations } from './useNotesMutations';
import type { NoteListItem } from '@/types/notes';

interface UseNoteCrudParams {
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  selectedFolderId: string | null;
  showTrash: boolean;
  updateUrl: (noteId: string | null, folderId: string | null, trash: boolean) => void;
  notes: NoteListItem[];
  trashedNotes: NoteListItem[];
}

export function useNoteCrud({
  selectedNoteId,
  setSelectedNoteId,
  selectedFolderId,
  showTrash,
  updateUrl,
  notes,
  trashedNotes,
}: UseNoteCrudParams) {
  const { createNote, updateNote, deleteNote, restoreNote, permanentDeleteNote } = useNotesMutations();

  const handleCreateNote = useCallback(async () => {
    const result = await createNote.mutateAsync({
      title: 'Untitled Note',
      content: '',
      folderId: selectedFolderId,
    });
    if (result.item) {
      setSelectedNoteId(result.item.id);
      updateUrl(result.item.id, selectedFolderId, showTrash);
    }
  }, [createNote, selectedFolderId, showTrash, updateUrl, setSelectedNoteId]);

  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote.mutate(noteId, {
      onSuccess: () => {
        if (selectedNoteId === noteId) {
          setSelectedNoteId(null);
        }
      },
    });
  }, [deleteNote, selectedNoteId, setSelectedNoteId]);

  const handleRestoreNote = useCallback((noteId: string) => {
    restoreNote.mutate(noteId);
  }, [restoreNote]);

  const handlePermanentDelete = useCallback((noteId: string) => {
    permanentDeleteNote.mutate(noteId, {
      onSuccess: () => {
        if (selectedNoteId === noteId) {
          setSelectedNoteId(null);
        }
      },
    });
  }, [permanentDeleteNote, selectedNoteId, setSelectedNoteId]);

  const handleEmptyTrash = useCallback(() => {
    trashedNotes.forEach((note) => {
      permanentDeleteNote.mutate(note.id);
    });
  }, [trashedNotes, permanentDeleteNote]);

  const handlePinNoteFromList = useCallback((noteId: string, isPinned: boolean) => {
    updateNote.mutate({ id: noteId, input: { isPinned } });
  }, [updateNote]);

  const handleMoveNoteToFolder = useCallback((noteId: string, folderId: string | null) => {
    updateNote.mutate({ id: noteId, input: { folderId } });
  }, [updateNote]);

  const handleDuplicateNote = useCallback(async (noteId: string) => {
    const noteToDuplicate = notes.find(n => n.id === noteId);
    if (!noteToDuplicate) return;

    const result = await createNote.mutateAsync({
      title: `${noteToDuplicate.title || 'Untitled'} (copy)`,
      content: '',
      folderId: noteToDuplicate.folderId,
      isPinned: false,
    });

    if (result.item) {
      setSelectedNoteId(result.item.id);
      updateUrl(result.item.id, selectedFolderId, showTrash);
    }
  }, [notes, createNote, selectedFolderId, showTrash, updateUrl, setSelectedNoteId]);

  return {
    handleCreateNote,
    handleDeleteNote,
    handleRestoreNote,
    handlePermanentDelete,
    handleEmptyTrash,
    handlePinNoteFromList,
    handleMoveNoteToFolder,
    handleDuplicateNote,
    isRestoring: restoreNote.isPending,
    isDeleting: permanentDeleteNote.isPending,
  };
}
