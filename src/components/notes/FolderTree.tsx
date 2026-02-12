'use client';

import { FolderTreeNode, NoteSection } from '@/types/notes';
import type { TreeNode } from '@/types/tree';
import { TreeView } from '@/components/ui/tree-view';
import { FileText } from 'lucide-react';

interface FolderTreeProps {
  folders: FolderTreeNode[];
  sections: NoteSection[];
  selectedFolderId: string | null;
  showTrash: boolean;
  onSelectFolder: (folderId: string | null) => void;
  onToggleTrash: () => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
  onCreateSection: () => void;
  onRenameSection: (sectionId: string, currentName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderFolders: (folderIds: string[], sectionId: string | null) => void;
  totalNotes: number;
  trashedNotes: number;
}

export function FolderTree({
  totalNotes,
  showTrash,
  onToggleTrash,
  trashedNotes,
  ...props
}: FolderTreeProps) {
  return (
    <TreeView
      {...props}
      totalItemCount={totalNotes}
      headerLabel="Notes"
      allItemsLabel="All Notes"
      headerIcon={<FileText className="h-4 w-4 text-info" />}
      getItemCount={(node: TreeNode) => (node as FolderTreeNode).noteCount}
      trash={{
        show: showTrash,
        count: trashedNotes,
        onToggle: onToggleTrash,
      }}
    />
  );
}
