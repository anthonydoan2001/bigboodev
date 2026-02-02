'use client';

import { useState } from 'react';
import { BookmarkFolderTreeNode } from '@/types/bookmarks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoveToFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
  folders: BookmarkFolderTreeNode[];
  currentFolderId: string | null;
}

interface FolderOptionProps {
  folder: BookmarkFolderTreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function FolderOption({ folder, level, selectedId, onSelect }: FolderOptionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children.length > 0;
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-favorite" />
        ) : (
          <Folder className="h-4 w-4 text-favorite" />
        )}
        <span className="text-sm">{folder.name}</span>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderOption
              key={child.id}
              folder={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MoveToFolderDialog({
  open,
  onClose,
  onMove,
  folders,
  currentFolderId,
}: MoveToFolderDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentFolderId);

  const handleMove = () => {
    onMove(selectedId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Move to Folder</DialogTitle>
        </DialogHeader>

        <div className="max-h-[300px] overflow-auto py-2">
          {/* No folder option */}
          <div
            className={cn(
              'flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors',
              selectedId === null && 'bg-accent'
            )}
            onClick={() => setSelectedId(null)}
          >
            <span className="w-5" />
            <Bookmark className="h-4 w-4 text-info" />
            <span className="text-sm">No folder (root)</span>
          </div>

          {/* Folder options */}
          {folders.map((folder) => (
            <FolderOption
              key={folder.id}
              folder={folder}
              level={0}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
