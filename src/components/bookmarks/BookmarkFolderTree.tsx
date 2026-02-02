'use client';

import { useState, memo, useCallback } from 'react';
import { BookmarkFolderTreeNode } from '@/types/bookmarks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Bookmark,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Pin,
  PinOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderItemProps {
  folder: BookmarkFolderTreeNode;
  level: number;
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onRename: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
}

const FolderItem = memo(function FolderItem({
  folder,
  level,
  selectedFolderId,
  onSelect,
  onRename,
  onDelete,
  onCreateSubfolder,
  onPinFolder,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const canCreateSubfolder = level < 2; // Max 3 levels deep

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-1 px-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 10 + 6}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-favorite flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-favorite flex-shrink-0" />
        )}

        {folder.isPinned && (
          <Pin className="h-3 w-3 text-favorite fill-favorite/20 flex-shrink-0" />
        )}

        <span className="flex-1 text-sm truncate">{folder.name}</span>

        {folder.bookmarkCount > 0 && (
          <span className="text-[11px] text-muted-foreground">{folder.bookmarkCount}</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPinFolder(folder.id, !folder.isPinned)}>
              {folder.isPinned ? (
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
            <DropdownMenuItem onClick={() => onRename(folder.id, folder.name)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            {canCreateSubfolder && (
              <DropdownMenuItem onClick={() => onCreateSubfolder(folder.id)}>
                <Plus className="h-4 w-4 mr-2" />
                New Subfolder
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(folder.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
              onPinFolder={onPinFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface BookmarkFolderTreeProps {
  folders: BookmarkFolderTreeNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
  totalBookmarks: number;
}

export function BookmarkFolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onPinFolder,
  totalBookmarks,
}: BookmarkFolderTreeProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <h2 className="font-semibold text-sm">Bookmarks</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onCreateFolder()}
          title="New Folder"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto py-1.5">
        {/* All Bookmarks */}
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-accent/50 transition-colors',
            selectedFolderId === null && 'bg-accent'
          )}
          onClick={() => onSelectFolder(null)}
        >
          <Bookmark className="h-4 w-4 text-info" />
          <span className="flex-1 text-sm">All Bookmarks</span>
          <span className="text-[11px] text-muted-foreground">{totalBookmarks}</span>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <div className="mt-1.5">
            <div className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Folders
            </div>
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                selectedFolderId={selectedFolderId}
                onSelect={onSelectFolder}
                onRename={onRenameFolder}
                onDelete={onDeleteFolder}
                onCreateSubfolder={(parentId) => onCreateFolder(parentId)}
                onPinFolder={onPinFolder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
