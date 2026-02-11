'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderTree } from '@/components/notes/FolderTree';
import { NotesList } from '@/components/notes/NotesList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { TrashView } from '@/components/notes/TrashView';
import { TaskLinkModal } from '@/components/notes/TaskLinkModal';
import { FolderSectionDialogs } from '@/components/notes/FolderSectionDialogs';
import { useNotes, useFolders, useNote, useNoteSections } from '@/lib/hooks/useNotes';
import { useTasks } from '@/lib/hooks/useTasks';
import { useNoteAutoSave } from '@/lib/hooks/useNoteAutoSave';
import { useFolderSectionDialogs } from '@/lib/hooks/useFolderSectionDialogs';
import { useNoteCrud } from '@/lib/hooks/useNoteCrud';
import { useNoteAttachmentsAndTasks } from '@/lib/hooks/useNoteAttachmentsAndTasks';
import { Plus, Search, PanelLeftClose, PanelLeft, Menu, Loader2 } from 'lucide-react';

function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Data hooks
  const { notes, counts, isLoading: notesLoading } = useNotes({
    folderId: selectedFolderId,
    isDeleted: showTrash,
    search: searchQuery || undefined,
  }, { includeCounts: true });

  const { notes: trashedNotes } = useNotes(
    { isDeleted: true },
    { includeCounts: false, enabled: showTrash }
  );

  const { note: selectedNote, isLoading: noteLoading, refetch: refetchNote } = useNote(selectedNoteId);
  const { folders, tree: folderTree } = useFolders();
  const { sections } = useNoteSections();
  const { tasks } = useTasks();

  // URL update
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

  // Custom hooks
  const {
    editTitle,
    editFolderId,
    editIsPinned,
    handleTitleChange,
    handleContentChange,
    handlePinToggle,
    handleFolderChange,
  } = useNoteAutoSave({ selectedNoteId, selectedNote });

  const {
    folderDialog,
    setFolderDialog,
    sectionDialog,
    setSectionDialog,
    handleCreateFolder,
    handleRenameFolder,
    handleFolderDialogSubmit,
    handleDeleteFolder,
    handlePinFolder,
    handleReorderFolders,
    handleCreateSection,
    handleRenameSection,
    handleSectionDialogSubmit,
    handleDeleteSection,
    isCreatingFolder,
    isUpdatingFolder,
    isCreatingSection,
    isUpdatingSection,
  } = useFolderSectionDialogs({ selectedFolderId, setSelectedFolderId });

  const {
    handleCreateNote,
    handleDeleteNote,
    handleRestoreNote,
    handlePermanentDelete,
    handleEmptyTrash,
    handlePinNoteFromList,
    handleMoveNoteToFolder,
    handleDuplicateNote,
    isRestoring,
    isDeleting,
  } = useNoteCrud({
    selectedNoteId,
    setSelectedNoteId,
    selectedFolderId,
    showTrash,
    updateUrl,
    notes,
    trashedNotes,
  });

  const {
    showTaskLinkModal,
    setShowTaskLinkModal,
    handleUploadAttachment,
    handleDeleteAttachment,
    handleLinkTask,
    handleUnlinkTask,
    linkedTaskIds,
    isUploading,
  } = useNoteAttachmentsAndTasks({ selectedNoteId, selectedNote, refetchNote });

  // Navigation handlers
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
              isRestoring={isRestoring}
              isDeleting={isDeleting}
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
              isUploading={isUploading}
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

      {/* Dialogs */}
      <FolderSectionDialogs
        folderDialog={folderDialog}
        setFolderDialog={setFolderDialog}
        onFolderDialogSubmit={handleFolderDialogSubmit}
        isCreatingFolder={isCreatingFolder}
        isUpdatingFolder={isUpdatingFolder}
        sectionDialog={sectionDialog}
        setSectionDialog={setSectionDialog}
        onSectionDialogSubmit={handleSectionDialogSubmit}
        isCreatingSection={isCreatingSection}
        isUpdatingSection={isUpdatingSection}
      />

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
