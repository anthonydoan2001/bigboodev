'use client';

import { useState, memo, useCallback } from 'react';
import { FolderTreeNode, TagWithCount } from '@/types/notes';
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
  FileText,
  Trash2,
  MoreHorizontal,
  Plus,
  Pencil,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderItemProps {
  folder: FolderTreeNode;
  level: number;
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onRename: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
}

const FolderItem = memo(function FolderItem({
  folder,
  level,
  selectedFolderId,
  onSelect,
  onRename,
  onDelete,
  onCreateSubfolder,
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
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {isExpanded ? (
          <FolderOpen className="h-3.5 w-3.5 text-favorite flex-shrink-0" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-favorite flex-shrink-0" />
        )}

        <span className="flex-1 text-[13px] truncate">{folder.name}</span>

        {folder.noteCount > 0 && (
          <span className="text-[10px] text-muted-foreground">{folder.noteCount}</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface FolderTreeProps {
  folders: FolderTreeNode[];
  tags: TagWithCount[];
  selectedFolderId: string | null;
  selectedTagId: string | null;
  showTrash: boolean;
  onSelectFolder: (folderId: string | null) => void;
  onSelectTag: (tagId: string | null) => void;
  onToggleTrash: () => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  totalNotes: number;
  trashedNotes: number;
}

export function FolderTree({
  folders,
  tags,
  selectedFolderId,
  selectedTagId,
  showTrash,
  onSelectFolder,
  onSelectTag,
  onToggleTrash,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  totalNotes,
  trashedNotes,
}: FolderTreeProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <h2 className="font-semibold text-[13px]">Notes</h2>
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
        {/* All Notes */}
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-accent/50 transition-colors',
            selectedFolderId === null && selectedTagId === null && !showTrash && 'bg-accent'
          )}
          onClick={() => {
            onSelectFolder(null);
            onSelectTag(null);
          }}
        >
          <FileText className="h-3.5 w-3.5 text-info" />
          <span className="flex-1 text-[13px]">All Notes</span>
          <span className="text-[10px] text-muted-foreground">{totalNotes}</span>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <div className="mt-1.5">
            <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Folders
            </div>
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                selectedFolderId={selectedFolderId}
                onSelect={(id) => {
                  onSelectFolder(id);
                  onSelectTag(null);
                }}
                onRename={onRenameFolder}
                onDelete={onDeleteFolder}
                onCreateSubfolder={(parentId) => onCreateFolder(parentId)}
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2">
            <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tags
            </div>
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={cn(
                  'flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-accent/50 transition-colors',
                  selectedTagId === tag.id && 'bg-accent'
                )}
                onClick={() => {
                  onSelectTag(tag.id);
                  onSelectFolder(null);
                }}
              >
                <Tag className="h-3.5 w-3.5" style={{ color: tag.color }} />
                <span className="flex-1 text-[13px] truncate">{tag.name}</span>
                <span className="text-[10px] text-muted-foreground">{tag._count?.notes || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trash */}
      <div className="border-t border-border p-1.5">
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-accent/50 rounded-md transition-colors',
            showTrash && 'bg-accent'
          )}
          onClick={onToggleTrash}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 text-[13px]">Trash</span>
          {trashedNotes > 0 && (
            <span className="text-[10px] text-muted-foreground">{trashedNotes}</span>
          )}
        </div>
      </div>
    </div>
  );
}
