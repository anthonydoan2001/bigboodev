'use client';

import { BookmarkListItem, GroupedBookmarks } from '@/types/bookmarks';
import { BookmarkCard } from './BookmarkCard';
import { Bookmark, Loader2, FolderOpen, LayoutList } from 'lucide-react';

interface BookmarkListProps {
  bookmarks: BookmarkListItem[];
  grouped?: GroupedBookmarks[];
  isLoading: boolean;
  currentFolderId?: string | null;
  onEdit: (bookmark: BookmarkListItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onMoveToFolder: (bookmark: BookmarkListItem) => void;
}

export function BookmarkList({
  bookmarks,
  grouped,
  isLoading,
  currentFolderId,
  onEdit,
  onDelete,
  onTogglePin,
  onMoveToFolder,
}: BookmarkListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Bookmark className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">No bookmarks yet</p>
        <p className="text-xs mt-1">Add your first bookmark to get started</p>
      </div>
    );
  }

  // Grouped view when showing all bookmarks
  if (grouped && grouped.length > 0) {
    return (
      <div className="p-2 sm:p-3 lg:p-4 space-y-4 lg:space-y-6">
        {grouped.map((group, groupIdx) => (
          <div key={group.section?.id || `unsectioned-${groupIdx}`}>
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-3">
              <LayoutList className="h-4 w-4 text-info" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {group.section?.name || 'Unsectioned'}
              </h2>
              <div className="flex-1 border-t border-border/50" />
            </div>

            {/* Folders within section */}
            <div className="space-y-3 lg:space-y-4 ml-1 sm:ml-2">
              {group.folders.map((folderGroup, folderIdx) => (
                <div key={folderGroup.folder?.id || `no-folder-${folderIdx}`}>
                  {/* Folder Header */}
                  {folderGroup.folder && (
                    <div className="flex items-center gap-1.5 mb-2 ml-1">
                      <FolderOpen className="h-3.5 w-3.5 text-favorite" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {folderGroup.folder.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground/60">
                        ({folderGroup.bookmarks.length})
                      </span>
                    </div>
                  )}

                  {/* Bookmarks in folder */}
                  <div className="space-y-2">
                    {folderGroup.bookmarks.map((bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        currentFolderId={currentFolderId}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onTogglePin={onTogglePin}
                        onMoveToFolder={onMoveToFolder}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat view (filtered by folder or search)
  return (
    <div className="space-y-2 p-2 sm:p-3 lg:p-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          currentFolderId={currentFolderId}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onMoveToFolder={onMoveToFolder}
        />
      ))}
    </div>
  );
}
