import { useState, useCallback, useMemo } from 'react';
import { useAttachmentsMutations, useTaskNoteMutations } from './useNotesMutations';
import type { NoteWithRelations } from '@/types/notes';

interface UseNoteAttachmentsAndTasksParams {
  selectedNoteId: string | null;
  selectedNote: NoteWithRelations | null;
  refetchNote: () => void;
}

export function useNoteAttachmentsAndTasks({
  selectedNoteId,
  selectedNote,
  refetchNote,
}: UseNoteAttachmentsAndTasksParams) {
  const { uploadAttachment, deleteAttachment } = useAttachmentsMutations();
  const { linkTask, unlinkTask } = useTaskNoteMutations();

  const [showTaskLinkModal, setShowTaskLinkModal] = useState(false);

  const handleUploadAttachment = useCallback((file: File) => {
    if (selectedNoteId) {
      uploadAttachment.mutate({ noteId: selectedNoteId, file }, {
        onSuccess: () => refetchNote(),
      });
    }
  }, [selectedNoteId, uploadAttachment, refetchNote]);

  const handleDeleteAttachment = useCallback((attachmentId: string) => {
    if (selectedNoteId) {
      deleteAttachment.mutate({ noteId: selectedNoteId, attachmentId }, {
        onSuccess: () => refetchNote(),
      });
    }
  }, [selectedNoteId, deleteAttachment, refetchNote]);

  const handleLinkTask = useCallback((taskId: string) => {
    if (selectedNoteId) {
      linkTask.mutate({ noteId: selectedNoteId, taskId }, {
        onSuccess: () => refetchNote(),
      });
    }
  }, [selectedNoteId, linkTask, refetchNote]);

  const handleUnlinkTask = useCallback((taskId: string) => {
    if (selectedNoteId) {
      unlinkTask.mutate({ noteId: selectedNoteId, taskId }, {
        onSuccess: () => refetchNote(),
      });
    }
  }, [selectedNoteId, unlinkTask, refetchNote]);

  const linkedTaskIds = useMemo(
    () => selectedNote?.taskNotes.map((tn) => tn.task.id) || [],
    [selectedNote?.taskNotes]
  );

  return {
    showTaskLinkModal,
    setShowTaskLinkModal,
    handleUploadAttachment,
    handleDeleteAttachment,
    handleLinkTask,
    handleUnlinkTask,
    linkedTaskIds,
    isUploading: uploadAttachment.isPending,
  };
}
