'use client';

import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderTree } from '@/components/notes/FolderTree';
import { NotesList } from '@/components/notes/NotesList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { TrashView } from '@/components/notes/TrashView';
import { TaskLinkModal } from '@/components/notes/TaskLinkModal';
import { useNotes, useFolders, useNote, useNoteSections } from '@/lib/hooks/useNotes';
import { useTasks } from '@/lib/hooks/useTasks';
import {
  useNotesMutations,
  useFoldersMutations,
  useAttachmentsMutations,
  useTaskNoteMutations,
  useNoteSectionsMutations,
} from '@/lib/hooks/useNotesMutations';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search, PanelLeftClose, PanelLeft, Menu, Loader2 } from 'lucide-react';

function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // URL state
  const noteIdParam = searchParams.get('note');
  const folderIdParam = searchParams.get('folder');
  const trashParam = searchParams.get('trash') === 'true';

  // Local state
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(noteIdParam);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderIdParam);
  const [showTrash, setShowTrash] = useState(trashParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dialogs
  const [showTaskLinkModal, setShowTaskLinkModal] = useState(false);
  const [folderDialog, setFolderDialog] = useState<{
    open: boolean;
    parentId?: string;
    editId?: string;
    name: string;
  }>({ open: false, name: '' });
  const [sectionDialog, setSectionDialog] = useState<{
    open: boolean;
    editId?: string;
    name: string;
  }>({ open: false, name: '' });

  // Editing state for note
  const [editTitle, setEditTitle] = useState('');
  const [, setEditContent] = useState('');
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editIsPinned, setEditIsPinned] = useState(false);

  // Debounce refs for auto-save
  const titleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const contentDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Data hooks - use includeCounts to get total/trashed counts in one request
  const { notes, counts, isLoading: notesLoading } = useNotes({
    folderId: selectedFolderId,
    isDeleted: showTrash,
    search: searchQuery || undefined,
  }, { includeCounts: true });

  // Get trashed notes list only when viewing trash (don't fetch unless needed)
  const { notes: trashedNotes } = useNotes(
    { isDeleted: true },
    { includeCounts: false, enabled: showTrash }
  );

  const { note: selectedNote, isLoading: noteLoading, refetch: refetchNote } = useNote(selectedNoteId);
  const { folders, tree: folderTree } = useFolders();
  const { sections } = useNoteSections();
  const { tasks } = useTasks();

  // Mutations
  const { createNote, updateNote, deleteNote, restoreNote, permanentDeleteNote } = useNotesMutations();
  const { createFolder, updateFolder, deleteFolder, reorderFolders } = useFoldersMutations();
  const { createSection, updateSection, deleteSection } = useNoteSectionsMutations();
  const { uploadAttachment, deleteAttachment } = useAttachmentsMutations();
  const { linkTask, unlinkTask } = useTaskNoteMutations();

  // Sync note data to edit state when note changes
  const prevNoteIdRef = useRef<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Only update when the note itself changes, not on every render
    if (selectedNote && selectedNote.id !== prevNoteIdRef.current) {
      prevNoteIdRef.current = selectedNote.id;
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditFolderId(selectedNote.folderId);
      setEditIsPinned(selectedNote.isPinned);
    }
  }, [selectedNote]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Update URL when selection changes
  const updateUrl = useCallback(
    (noteId: string | null, folderId: string | null, trash: boolean) => {
      const params = new URLSearchParams();
      if (noteId) params.set('note', noteId);
      if (folderId) params.set('folder', folderId);
      if (trash) params.set('trash', 'true');
      router.push(`/notes${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [router]
  );

  // Handlers
  const handleSelectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    updateUrl(noteId, selectedFolderId, showTrash);
    setMobileMenuOpen(false);
  }, [updateUrl, selectedFolderId, showTrash]);

  const handleSelectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    setShowTrash(false);
    updateUrl(selectedNoteId, folderId, false);
  }, [updateUrl, selectedNoteId]);

  const handleToggleTrash = useCallback(() => {
    const newTrash = !showTrash;
    setShowTrash(newTrash);
    setSelectedFolderId(null);
    setSelectedNoteId(null);
    updateUrl(null, null, newTrash);
  }, [showTrash, updateUrl]);

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
  }, [createNote, selectedFolderId, showTrash, updateUrl]);

  const handleTitleChange = useCallback((title: string) => {
    setEditTitle(title);

    // Optimistically update the cache immediately so switching notes preserves changes
    if (selectedNoteId) {
      queryClient.setQueryData(['note', selectedNoteId], (oldData: { item?: { title?: string } } | undefined) => {
        if (!oldData?.item) return oldData;
        return { ...oldData, item: { ...oldData.item, title } };
      });
      // Also update in notes list
      queryClient.setQueriesData({ queryKey: ['notes'] }, (oldData: { items?: Array<{ id: string; title?: string }> } | undefined) => {
        if (!oldData?.items) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((note) =>
            note.id === selectedNoteId ? { ...note, title } : note
          ),
        };
      });
    }

    // Debounce title saves to avoid hammering the API
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
    }
    if (selectedNoteId) {
      titleDebounceRef.current = setTimeout(() => {
        updateNote.mutate({ id: selectedNoteId, input: { title } });
      }, 1000); // 1 second debounce
    }
  }, [selectedNoteId, updateNote, queryClient]);

  const handleContentChange = useCallback((content: string) => {
    setEditContent(content);

    // Optimistically update the cache immediately so switching notes preserves changes
    if (selectedNoteId) {
      queryClient.setQueryData(['note', selectedNoteId], (oldData: { item?: { content?: string } } | undefined) => {
        if (!oldData?.item) return oldData;
        return { ...oldData, item: { ...oldData.item, content } };
      });
    }

    // Debounce content saves (NoteEditor already debounces, but this is a backup)
    if (contentDebounceRef.current) {
      clearTimeout(contentDebounceRef.current);
    }
    if (selectedNoteId) {
      contentDebounceRef.current = setTimeout(() => {
        updateNote.mutate({ id: selectedNoteId, input: { content } });
      }, 1500); // 1.5 second debounce
    }
  }, [selectedNoteId, updateNote, queryClient]);

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

  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote.mutate(noteId, {
      onSuccess: () => {
        if (selectedNoteId === noteId) {
          setSelectedNoteId(null);
        }
      },
    });
  }, [deleteNote, selectedNoteId]);

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
  }, [permanentDeleteNote, selectedNoteId]);

  const handleEmptyTrash = useCallback(() => {
    trashedNotes.forEach((note) => {
      permanentDeleteNote.mutate(note.id);
    });
  }, [trashedNotes, permanentDeleteNote]);

  // Context menu handlers for notes list
  const handlePinNoteFromList = useCallback((noteId: string, isPinned: boolean) => {
    updateNote.mutate({ id: noteId, input: { isPinned } });
  }, [updateNote]);

  const handleMoveNoteToFolder = useCallback((noteId: string, folderId: string | null) => {
    updateNote.mutate({ id: noteId, input: { folderId } });
  }, [updateNote]);

  const handleDuplicateNote = useCallback(async (noteId: string) => {
    // Find the note to duplicate
    const noteToDuplicate = notes.find(n => n.id === noteId);
    if (!noteToDuplicate) return;

    // Create a new note with the same content
    const result = await createNote.mutateAsync({
      title: `${noteToDuplicate.title || 'Untitled'} (copy)`,
      content: '', // Content will be empty initially - we'll need to fetch full note for content
      folderId: noteToDuplicate.folderId,
      isPinned: false,
    });

    if (result.item) {
      setSelectedNoteId(result.item.id);
      updateUrl(result.item.id, selectedFolderId, showTrash);
    }
  }, [notes, createNote, selectedFolderId, showTrash, updateUrl]);

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
  }, [deleteFolder, selectedFolderId]);

  const handlePinFolder = useCallback((folderId: string, isPinned: boolean) => {
    updateFolder.mutate({ id: folderId, input: { isPinned } });
  }, [updateFolder]);

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

  const handleReorderFolders = useCallback((folderIds: string[], sectionId: string | null) => {
    reorderFolders.mutate({ folderIds, sectionId });
  }, [reorderFolders]);

  // Attachment handlers
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

  // Task link handlers
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

  const linkedTaskIds = selectedNote?.taskNotes.map((tn) => tn.task.id) || [];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center gap-2 p-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold">Notes</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            ${mobileMenuOpen ? 'fixed inset-0 z-50 bg-background' : 'hidden'}
            lg:relative lg:block lg:z-auto
            ${sidebarOpen ? 'w-full lg:w-56 xl:w-72' : 'lg:w-0'}
            flex-shrink-0 border-r border-border transition-all duration-300
          `}
        >
          {sidebarOpen && (
            <FolderTree
              folders={folderTree}
              sections={sections}
              selectedFolderId={selectedFolderId}
              showTrash={showTrash}
              onSelectFolder={handleSelectFolder}
              onToggleTrash={handleToggleTrash}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onPinFolder={handlePinFolder}
              onCreateSection={handleCreateSection}
              onRenameSection={handleRenameSection}
              onDeleteSection={handleDeleteSection}
              onReorderFolders={handleReorderFolders}
              totalNotes={counts?.total || 0}
              trashedNotes={counts?.trashed || 0}
            />
          )}
        </div>

        {/* Notes List */}
        {!showTrash && (
          <div className="hidden lg:flex lg:w-72 flex-shrink-0 flex-col border-r border-border">
            {/* List Header */}
            <div className="flex items-center gap-1.5 p-2 border-b border-border">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex"
              >
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-7 h-7 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleCreateNote} title="New Note" className="h-7 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Notes List */}
            <NotesList
              notes={notes}
              selectedNoteId={selectedNoteId}
              onSelectNote={handleSelectNote}
              onDeleteNote={handleDeleteNote}
              onPinNote={handlePinNoteFromList}
              onMoveNote={handleMoveNoteToFolder}
              onDuplicateNote={handleDuplicateNote}
              folders={folderTree}
              isLoading={notesLoading}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {showTrash ? (
            <TrashView
              notes={trashedNotes}
              onRestore={handleRestoreNote}
              onPermanentDelete={handlePermanentDelete}
              onEmptyTrash={handleEmptyTrash}
              isRestoring={restoreNote.isPending}
              isDeleting={permanentDeleteNote.isPending}
            />
          ) : selectedNoteId && noteLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedNote ? (
            <NoteEditor
              note={selectedNote}
              title={editTitle}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              isPinned={editIsPinned}
              onPinToggle={handlePinToggle}
              folders={folders.map((f) => ({ id: f.id, name: f.name }))}
              currentFolderId={editFolderId}
              onFolderChange={handleFolderChange}
              attachments={selectedNote.attachments}
              onUploadAttachment={handleUploadAttachment}
              onDeleteAttachment={handleDeleteAttachment}
              linkedTasks={selectedNote.taskNotes.map((tn) => tn.task)}
              onLinkTask={() => setShowTaskLinkModal(true)}
              onUnlinkTask={handleUnlinkTask}
              isUploading={uploadAttachment.isPending}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">
                  {notes.length === 0 ? 'No notes yet' : 'Select a note'}
                </h2>
                <p className="text-muted-foreground">
                  {notes.length === 0
                    ? 'Create your first note to get started'
                    : 'Choose a note from the list to view or edit'}
                </p>
                <Button onClick={handleCreateNote} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Folder Dialog */}
      <Dialog
        open={folderDialog.open}
        onOpenChange={(open) => !open && setFolderDialog({ open: false, name: '' })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {folderDialog.editId ? 'Rename Folder' : 'New Folder'}
            </DialogTitle>
            <DialogDescription>
              {folderDialog.editId
                ? 'Enter a new name for the folder'
                : 'Enter a name for the new folder'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={folderDialog.name}
            onChange={(e) => setFolderDialog({ ...folderDialog, name: e.target.value })}
            placeholder="Folder name..."
            onKeyDown={(e) => e.key === 'Enter' && handleFolderDialogSubmit()}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFolderDialog({ open: false, name: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFolderDialogSubmit}
              disabled={!folderDialog.name.trim() || createFolder.isPending || updateFolder.isPending}
            >
              {folderDialog.editId ? 'Rename' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog
        open={sectionDialog.open}
        onOpenChange={(open) => !open && setSectionDialog({ open: false, name: '' })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {sectionDialog.editId ? 'Rename Section' : 'New Section'}
            </DialogTitle>
            <DialogDescription>
              {sectionDialog.editId
                ? 'Enter a new name for the section'
                : 'Sections group your folders (e.g. "IT", "Personal")'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={sectionDialog.name}
            onChange={(e) => setSectionDialog({ ...sectionDialog, name: e.target.value })}
            placeholder="Section name..."
            onKeyDown={(e) => e.key === 'Enter' && handleSectionDialogSubmit()}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSectionDialog({ open: false, name: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSectionDialogSubmit}
              disabled={!sectionDialog.name.trim() || createSection.isPending || updateSection.isPending}
            >
              {sectionDialog.editId ? 'Rename' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Link Modal */}
      <TaskLinkModal
        open={showTaskLinkModal}
        onOpenChange={setShowTaskLinkModal}
        tasks={tasks}
        linkedTaskIds={linkedTaskIds}
        onLinkTask={handleLinkTask}
        onUnlinkTask={handleUnlinkTask}
        isLoading={false}
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex">
          <div className="w-56 xl:w-72 border-r border-border p-2">
            <Skeleton className="h-7 w-full mb-2" />
            <Skeleton className="h-3 w-3/4 mb-1.5" />
            <Skeleton className="h-3 w-2/3 mb-1.5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="w-72 border-r border-border p-1.5">
            <Skeleton className="h-7 w-full mb-2" />
            <Skeleton className="h-16 w-full mb-1.5" />
            <Skeleton className="h-16 w-full mb-1.5" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="flex-1 p-3">
            <Skeleton className="h-10 w-1/2 mb-3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      }
    >
      <NotesContent />
    </Suspense>
  );
}
