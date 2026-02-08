'use client';

import { useState, useCallback, Suspense } from 'react';
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
import { BookmarkFolderTree } from '@/components/bookmarks/BookmarkFolderTree';
import { BookmarkList } from '@/components/bookmarks/BookmarkList';
import { BookmarkForm } from '@/components/bookmarks/BookmarkForm';
import { BookmarkSearchBar } from '@/components/bookmarks/BookmarkSearchBar';
import { MoveToFolderDialog } from '@/components/bookmarks/MoveToFolderDialog';
import { useBookmarks, useBookmarkFolders, useBookmarkSections, usePrefetchBookmarks } from '@/lib/hooks/useBookmarks';
import { useBookmarksMutations, useBookmarkFoldersMutations, useBookmarkSectionsMutations } from '@/lib/hooks/useBookmarksMutations';
import { BookmarkListItem, CreateBookmarkInput, UpdateBookmarkInput } from '@/types/bookmarks';
import { PanelLeftClose, PanelLeft, Menu } from 'lucide-react';

function BookmarksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const folderIdParam = searchParams.get('folder');

  // Local state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderIdParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dialogs
  const [bookmarkFormOpen, setBookmarkFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkListItem | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [bookmarkToMove, setBookmarkToMove] = useState<BookmarkListItem | null>(null);
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

  // Data hooks
  const isAllBookmarks = !selectedFolderId && !searchQuery;
  const { bookmarks, counts, grouped, isLoading: bookmarksLoading } = useBookmarks({
    folderId: selectedFolderId,
    search: searchQuery || undefined,
    grouped: isAllBookmarks ? true : undefined,
  }, { includeCounts: true });

  const { tree: folderTree } = useBookmarkFolders();
  const { sections } = useBookmarkSections();
  const prefetchBookmarks = usePrefetchBookmarks();

  // Mutations
  const { createBookmark, updateBookmark, deleteBookmark } = useBookmarksMutations();
  const { createFolder, updateFolder, deleteFolder, reorderFolders } = useBookmarkFoldersMutations();
  const { createSection, updateSection, deleteSection } = useBookmarkSectionsMutations();

  // Update URL when selection changes
  const updateUrl = useCallback(
    (folderId: string | null) => {
      const params = new URLSearchParams();
      if (folderId) params.set('folder', folderId);
      router.push(`/bookmarks${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [router]
  );

  // Handlers
  const handleSelectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    updateUrl(folderId);
    setMobileMenuOpen(false);
  }, [updateUrl]);

  const handleAddBookmark = useCallback(() => {
    setEditingBookmark(null);
    setBookmarkFormOpen(true);
  }, []);

  const handleEditBookmark = useCallback((bookmark: BookmarkListItem) => {
    setEditingBookmark(bookmark);
    setBookmarkFormOpen(true);
  }, []);

  const handleBookmarkFormSubmit = useCallback((data: CreateBookmarkInput | UpdateBookmarkInput) => {
    if (editingBookmark) {
      updateBookmark.mutate(
        { id: editingBookmark.id, input: data },
        { onSuccess: () => setBookmarkFormOpen(false) }
      );
    } else {
      createBookmark.mutate(data as CreateBookmarkInput, {
        onSuccess: () => setBookmarkFormOpen(false),
      });
    }
  }, [editingBookmark, createBookmark, updateBookmark]);

  const handleDeleteBookmark = useCallback((id: string) => {
    if (confirm('Delete this bookmark?')) {
      deleteBookmark.mutate(id);
    }
  }, [deleteBookmark]);

  const handleTogglePin = useCallback((id: string, isPinned: boolean) => {
    updateBookmark.mutate({ id, input: { isPinned } });
  }, [updateBookmark]);

  const handleMoveToFolder = useCallback((bookmark: BookmarkListItem) => {
    setBookmarkToMove(bookmark);
    setMoveDialogOpen(true);
  }, []);

  const handleMoveConfirm = useCallback((folderId: string | null) => {
    if (bookmarkToMove) {
      updateBookmark.mutate({ id: bookmarkToMove.id, input: { folderId } });
      setBookmarkToMove(null);
    }
  }, [bookmarkToMove, updateBookmark]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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
    if (confirm('Delete this folder? Bookmarks will be moved to the root level.')) {
      deleteFolder.mutate(folderId, {
        onSuccess: () => {
          if (selectedFolderId === folderId) {
            setSelectedFolderId(null);
            updateUrl(null);
          }
        },
      });
    }
  }, [deleteFolder, selectedFolderId, updateUrl]);

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

  const handlePrefetch = useCallback((folderId: string) => {
    prefetchBookmarks(folderId);
  }, [prefetchBookmarks]);

  return (
    <div className="h-screen flex flex-col overflow-hidden overscroll-none">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold">Bookmarks</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            ${mobileMenuOpen ? 'fixed inset-0 z-50 bg-background' : 'hidden'}
            md:relative md:block md:z-auto
            ${sidebarOpen ? 'w-full md:w-56 lg:w-72' : 'md:w-0'}
            flex-shrink-0 border-r border-border transition-all duration-300 overflow-x-clip
          `}
        >
          {sidebarOpen && (
            <BookmarkFolderTree
              folders={folderTree}
              sections={sections}
              selectedFolderId={selectedFolderId}
              onSelectFolder={handleSelectFolder}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onPinFolder={handlePinFolder}
              onCreateSection={handleCreateSection}
              onRenameSection={handleRenameSection}
              onDeleteSection={handleDeleteSection}
              onReorderFolders={handleReorderFolders}
              totalBookmarks={counts?.total || 0}
              onPrefetch={handlePrefetch}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Header */}
          <div className="flex items-center gap-2 p-2 border-b border-border">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <BookmarkSearchBar
                onSearch={handleSearch}
                onAddBookmark={handleAddBookmark}
              />
            </div>
          </div>

          {/* Bookmarks List */}
          <div className="flex-1 overflow-auto">
            <BookmarkList
              bookmarks={bookmarks}
              grouped={isAllBookmarks ? grouped : undefined}
              isLoading={bookmarksLoading}
              currentFolderId={selectedFolderId}
              onEdit={handleEditBookmark}
              onDelete={handleDeleteBookmark}
              onTogglePin={handleTogglePin}
              onMoveToFolder={handleMoveToFolder}
            />
          </div>
        </div>
      </div>

      {/* Bookmark Form Dialog */}
      <BookmarkForm
        open={bookmarkFormOpen}
        onClose={() => setBookmarkFormOpen(false)}
        onSubmit={handleBookmarkFormSubmit}
        bookmark={editingBookmark}
        folders={folderTree}
        isSubmitting={createBookmark.isPending || updateBookmark.isPending}
        defaultFolderId={selectedFolderId}
      />

      {/* Move to Folder Dialog */}
      <MoveToFolderDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onMove={handleMoveConfirm}
        folders={folderTree}
        currentFolderId={bookmarkToMove?.folderId || null}
      />

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
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex">
          <div className="hidden md:block md:w-56 lg:w-72 border-r border-border p-2">
            <Skeleton className="h-7 w-full mb-2" />
            <Skeleton className="h-3 w-3/4 mb-1.5" />
            <Skeleton className="h-3 w-2/3 mb-1.5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex-1 p-3">
            <Skeleton className="h-10 w-full mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      }
    >
      <BookmarksContent />
    </Suspense>
  );
}
