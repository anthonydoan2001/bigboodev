'use client';

import { BookmarkFolderTreeNode, BookmarkSection } from '@/types/bookmarks';
import type { TreeNode } from '@/types/tree';
import { TreeView } from '@/components/ui/tree-view';
import { Bookmark } from 'lucide-react';

interface BookmarkFolderTreeProps {
  folders: BookmarkFolderTreeNode[];
  sections: BookmarkSection[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onPinFolder: (folderId: string, isPinned: boolean) => void;
  onCreateSection: () => void;
  onRenameSection: (sectionId: string, currentName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderFolders: (folderIds: string[], sectionId: string | null) => void;
  totalBookmarks: number;
  onPrefetch?: (folderId: string) => void;
}

export function BookmarkFolderTree({
  totalBookmarks,
  onPrefetch,
  ...props
}: BookmarkFolderTreeProps) {
  return (
    <TreeView
      {...props}
      totalItemCount={totalBookmarks}
      headerLabel="Bookmarks"
      allItemsLabel="All Bookmarks"
      headerIcon={<Bookmark className="h-4 w-4 text-info" />}
      getItemCount={(node: TreeNode) => (node as BookmarkFolderTreeNode).bookmarkCount}
      onPrefetch={onPrefetch}
    />
  );
}
