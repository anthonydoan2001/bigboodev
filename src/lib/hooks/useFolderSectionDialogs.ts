import { useState, useCallback } from 'react';
import { useFoldersMutations, useNoteSectionsMutations } from './useNotesMutations';

export interface FolderDialogState {
  open: boolean;
  parentId?: string;
  editId?: string;
  name: string;
}

export interface SectionDialogState {
  open: boolean;
  editId?: string;
  name: string;
}

interface UseFolderSectionDialogsParams {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

export function useFolderSectionDialogs({
  selectedFolderId,
  setSelectedFolderId,
}: UseFolderSectionDialogsParams) {
  const { createFolder, updateFolder, deleteFolder, reorderFolders } = useFoldersMutations();
  const { createSection, updateSection, deleteSection } = useNoteSectionsMutations();

  const [folderDialog, setFolderDialog] = useState<FolderDialogState>({ open: false, name: '' });
  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>({ open: false, name: '' });

  // Folder handlers
  const handleCreateFolder = useCallback((parentId?: string) => {
    setFolderDialog({ open: true, parentId, name: '' });
  }, []);

  const handleRenameFolder = useCallback((folderId: string, currentName: string) => {
    setFolderDialog({ open: true, editId: folderId, name: currentName });
  }, []);

  const handleFolderDialogSubmit = useCallback(() => {
    if (!folderDialog.name.trim()) return;

    if (folderDialog.editId) {
      updateFolder.mutate(
        { id: folderDialog.editId, input: { name: folderDialog.name } },
        { onSuccess: () => setFolderDialog({ open: false, name: '' }) }
      );
    } else {
      createFolder.mutate(
        { name: folderDialog.name, parentId: folderDialog.parentId },
        { onSuccess: () => setFolderDialog({ open: false, name: '' }) }
      );
    }
  }, [folderDialog, createFolder, updateFolder]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    if (confirm('Delete this folder? Notes will be moved to the parent folder.')) {
      deleteFolder.mutate(folderId, {
        onSuccess: () => {
          if (selectedFolderId === folderId) {
            setSelectedFolderId(null);
          }
        },
      });
    }
  }, [deleteFolder, selectedFolderId, setSelectedFolderId]);

  const handlePinFolder = useCallback((folderId: string, isPinned: boolean) => {
    updateFolder.mutate({ id: folderId, input: { isPinned } });
  }, [updateFolder]);

  const handleReorderFolders = useCallback((folderIds: string[], sectionId: string | null) => {
    reorderFolders.mutate({ folderIds, sectionId });
  }, [reorderFolders]);

  // Section handlers
  const handleCreateSection = useCallback(() => {
    setSectionDialog({ open: true, name: '' });
  }, []);

  const handleRenameSection = useCallback((sectionId: string, currentName: string) => {
    setSectionDialog({ open: true, editId: sectionId, name: currentName });
  }, []);

  const handleSectionDialogSubmit = useCallback(() => {
    if (!sectionDialog.name.trim()) return;

    if (sectionDialog.editId) {
      updateSection.mutate(
        { id: sectionDialog.editId, input: { name: sectionDialog.name } },
        { onSuccess: () => setSectionDialog({ open: false, name: '' }) }
      );
    } else {
      createSection.mutate(
        { name: sectionDialog.name },
        { onSuccess: () => setSectionDialog({ open: false, name: '' }) }
      );
    }
  }, [sectionDialog, createSection, updateSection]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    if (confirm('Delete this section? Folders will become unsectioned.')) {
      deleteSection.mutate(sectionId);
    }
  }, [deleteSection]);

  return {
    // Dialog state
    folderDialog,
    setFolderDialog,
    sectionDialog,
    setSectionDialog,

    // Folder handlers
    handleCreateFolder,
    handleRenameFolder,
    handleFolderDialogSubmit,
    handleDeleteFolder,
    handlePinFolder,
    handleReorderFolders,

    // Section handlers
    handleCreateSection,
    handleRenameSection,
    handleSectionDialogSubmit,
    handleDeleteSection,

    // Mutation pending flags
    isCreatingFolder: createFolder.isPending,
    isUpdatingFolder: updateFolder.isPending,
    isCreatingSection: createSection.isPending,
    isUpdatingSection: updateSection.isPending,
  };
}
