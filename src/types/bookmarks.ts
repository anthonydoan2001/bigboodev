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
  folder?: { id: string; name: string } | null;
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
  folder?: { id: string; name: string } | null;
}

// Folder with nested children
export interface BookmarkFolderWithChildren {
  id: string;
  name: string;
  parentId: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  children: BookmarkFolderWithChildren[];
  bookmarks?: BookmarkListItem[];
  _count?: { bookmarks: number };
}

// Folder tree structure for rendering
export interface BookmarkFolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: BookmarkFolderTreeNode[];
  bookmarkCount: number;
  isPinned: boolean;
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
}

export interface UpdateBookmarkFolderInput {
  name?: string;
  parentId?: string | null;
  isPinned?: boolean;
}

// API Response types
export interface BookmarksListResponse {
  items: BookmarkListItem[];
  counts?: {
    total: number;
  };
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

// Filter types
export interface BookmarksFilters {
  folderId?: string | null;
  isPinned?: boolean;
  search?: string;
}

// URL metadata response
export interface UrlMetadata {
  title: string;
  faviconUrl: string | null;
  description: string | null;
}
