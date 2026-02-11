import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotesMutations } from './useNotesMutations';
import { useDebouncedCallback } from './useDebouncedCallback';
import type { NoteWithRelations } from '@/types/notes';

interface UseNoteAutoSaveParams {
  selectedNoteId: string | null;
  selectedNote: NoteWithRelations | null;
}

interface UseNoteAutoSaveReturn {
  editTitle: string;
  editFolderId: string | null;
  editIsPinned: boolean;
  handleTitleChange: (title: string) => void;
  handleContentChange: (content: string) => void;
  handlePinToggle: () => void;
  handleFolderChange: (folderId: string | null) => void;
}

export function useNoteAutoSave({
  selectedNoteId,
  selectedNote,
}: UseNoteAutoSaveParams): UseNoteAutoSaveReturn {
  const queryClient = useQueryClient();
  const { updateNote } = useNotesMutations();

  // Editing state
  const [editTitle, setEditTitle] = useState('');
  const [, setEditContent] = useState('');
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editIsPinned, setEditIsPinned] = useState(false);

  // Debounced save callbacks
  const debouncedSaveTitle = useDebouncedCallback(
    (noteId: string, title: string) => {
      updateNote.mutate({ id: noteId, input: { title } });
    },
    1000,
    { flushOnUnmount: true }
  );

  const debouncedSaveContent = useDebouncedCallback(
    (noteId: string, content: string) => {
      updateNote.mutate({ id: noteId, input: { content } });
    },
    1500,
    { flushOnUnmount: true }
  );

  // Sync note data to edit state when note changes, flushing pending saves first
  const prevNoteIdRef = useRef<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedNote && selectedNote.id !== prevNoteIdRef.current) {
      debouncedSaveTitle.flush();
      debouncedSaveContent.flush();
      prevNoteIdRef.current = selectedNote.id;
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditFolderId(selectedNote.folderId);
      setEditIsPinned(selectedNote.isPinned);
    }
  }, [selectedNote, debouncedSaveTitle, debouncedSaveContent]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleTitleChange = useCallback((title: string) => {
    setEditTitle(title);

    if (selectedNoteId) {
      // Optimistically update caches
      queryClient.setQueryData(['note', selectedNoteId], (oldData: { item?: { title?: string } } | undefined) => {
        if (!oldData?.item) return oldData;
        return { ...oldData, item: { ...oldData.item, title } };
      });
      queryClient.setQueriesData({ queryKey: ['notes'] }, (oldData: { items?: Array<{ id: string; title?: string }> } | undefined) => {
        if (!oldData?.items) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((note) =>
            note.id === selectedNoteId ? { ...note, title } : note
          ),
        };
      });

      debouncedSaveTitle(selectedNoteId, title);
    }
  }, [selectedNoteId, queryClient, debouncedSaveTitle]);

  const handleContentChange = useCallback((content: string) => {
    setEditContent(content);

    if (selectedNoteId) {
      // Optimistically update cache
      queryClient.setQueryData(['note', selectedNoteId], (oldData: { item?: { content?: string } } | undefined) => {
        if (!oldData?.item) return oldData;
        return { ...oldData, item: { ...oldData.item, content } };
      });

      debouncedSaveContent(selectedNoteId, content);
    }
  }, [selectedNoteId, queryClient, debouncedSaveContent]);

  const handlePinToggle = useCallback(() => {
    const newPinned = !editIsPinned;
    setEditIsPinned(newPinned);
    if (selectedNoteId) {
      updateNote.mutate({ id: selectedNoteId, input: { isPinned: newPinned } });
    }
  }, [selectedNoteId, editIsPinned, updateNote]);

  const handleFolderChange = useCallback((folderId: string | null) => {
    setEditFolderId(folderId);
    if (selectedNoteId) {
      updateNote.mutate({ id: selectedNoteId, input: { folderId } });
    }
  }, [selectedNoteId, updateNote]);

  return {
    editTitle,
    editFolderId,
    editIsPinned,
    handleTitleChange,
    handleContentChange,
    handlePinToggle,
    handleFolderChange,
  };
}
