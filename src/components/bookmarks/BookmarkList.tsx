'use client';

import { BookmarkListItem } from '@/types/bookmarks';
import { BookmarkCard } from './BookmarkCard';
import { Bookmark, Loader2 } from 'lucide-react';

interface BookmarkListProps {
  bookmarks: BookmarkListItem[];
  isLoading: boolean;
  onEdit: (bookmark: BookmarkListItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onMoveToFolder: (bookmark: BookmarkListItem) => void;
}

export function BookmarkList({
  bookmarks,
  isLoading,
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

  return (
    <div className="space-y-2 p-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onMoveToFolder={onMoveToFolder}
        />
      ))}
    </div>
  );
}
