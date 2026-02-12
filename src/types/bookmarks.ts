import type { TreeNode, TreeSection } from './tree';

// Bookmark for list views
export interface BookmarkListItem {
  id: string;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  folderId: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  folder?: { id: string; name: string; sectionId?: string | null } | null;
}

// Extended Bookmark type with relations (for detail view)
export interface BookmarkWithRelations {
  id: string;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  folderId: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  folder?: { id: string; name: string; sectionId?: string | null } | null;
}

// Section type
export interface BookmarkSection extends TreeSection {}

// Folder with nested children
export interface BookmarkFolderWithChildren {
  id: string;
  name: string;
  parentId: string | null;
  sectionId: string | null;
  isPinned: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  children: BookmarkFolderWithChildren[];
  bookmarks?: BookmarkListItem[];
  _count?: { bookmarks: number };
}

// Folder tree structure for rendering
export interface BookmarkFolderTreeNode extends TreeNode {
  children: BookmarkFolderTreeNode[];
  bookmarkCount: number;
}

// Section with folders for sidebar rendering
export interface BookmarkSectionWithFolders {
  id: string;
  name: string;
  position: number;
  folders: BookmarkFolderTreeNode[];
}

// Input types for creating/updating
export interface CreateBookmarkInput {
  url: string;
  title: string;
  description?: string | null;
  faviconUrl?: string | null;
  folderId?: string | null;
  isPinned?: boolean;
}

export interface UpdateBookmarkInput {
  url?: string;
  title?: string;
  description?: string | null;
  faviconUrl?: string | null;
  folderId?: string | null;
  isPinned?: boolean;
}

export interface CreateBookmarkFolderInput {
  name: string;
  parentId?: string | null;
  sectionId?: string | null;
}

export interface UpdateBookmarkFolderInput {
  name?: string;
  parentId?: string | null;
  sectionId?: string | null;
  isPinned?: boolean;
  position?: number;
}

export interface CreateBookmarkSectionInput {
  name: string;
}

export interface UpdateBookmarkSectionInput {
  name?: string;
  position?: number;
}

// API Response types
export interface BookmarksListResponse {
  items: BookmarkListItem[];
  counts?: {
    total: number;
  };
  grouped?: GroupedBookmarks[];
}

export interface BookmarkResponse {
  item: BookmarkWithRelations;
}

export interface BookmarkFoldersResponse {
  items: BookmarkFolderWithChildren[];
  tree: BookmarkFolderTreeNode[];
}

export interface BookmarkFolderResponse {
  item: BookmarkFolderWithChildren;
}

export interface BookmarkSectionsResponse {
  items: BookmarkSection[];
}

export interface BookmarkSectionResponse {
  item: BookmarkSection;
}

// Grouped bookmarks for "All Bookmarks" view
export interface GroupedBookmarks {
  section: { id: string; name: string } | null;
  folders: {
    folder: { id: string; name: string } | null;
    bookmarks: BookmarkListItem[];
  }[];
}

// Filter types
export interface BookmarksFilters {
  folderId?: string | null;
  isPinned?: boolean;
  search?: string;
  grouped?: boolean;
}

// URL metadata response
export interface UrlMetadata {
  title: string;
  faviconUrl: string | null;
  description: string | null;
}
