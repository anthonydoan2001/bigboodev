'use client';

import { memo } from 'react';
import { BookmarkListItem } from '@/types/bookmarks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Copy,
  FolderInput,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkCardProps {
  bookmark: BookmarkListItem;
  onEdit: (bookmark: BookmarkListItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onMoveToFolder: (bookmark: BookmarkListItem) => void;
}

export const BookmarkCard = memo(function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onTogglePin,
  onMoveToFolder,
}: BookmarkCardProps) {
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
  };

  const handleOpenUrl = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  // Get hostname for display
  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname.replace('www.', '');
  } catch {
    hostname = bookmark.url;
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer',
        bookmark.isPinned && 'border-favorite/30 bg-favorite/5'
      )}
      onClick={handleOpenUrl}
    >
      {/* Favicon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
        {bookmark.faviconUrl ? (
          <img
            src={bookmark.faviconUrl}
            alt=""
            className="w-5 h-5 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>';
            }}
          />
        ) : (
          <Link2 className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate flex-1">{bookmark.title}</h3>
          {bookmark.isPinned && (
            <Pin className="h-3 w-3 text-favorite fill-favorite/20 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{hostname}</p>
        {bookmark.description && (
          <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1">
            {bookmark.description}
          </p>
        )}
        {bookmark.folder && (
          <div className="flex items-center gap-1 mt-1.5">
            <FolderInput className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{bookmark.folder.name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleOpenUrl}
          title="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTogglePin(bookmark.id, !bookmark.isPinned)}>
              {bookmark.isPinned ? (
                <>
                  <PinOff className="h-4 w-4 mr-2" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-2" />
                  Pin to top
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(bookmark)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyUrl}>
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveToFolder(bookmark)}>
              <FolderInput className="h-4 w-4 mr-2" />
              Move to folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(bookmark.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
