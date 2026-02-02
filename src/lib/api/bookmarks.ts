import { getAuthHeaders } from '@/lib/api-client';
import {
  BookmarksListResponse,
  BookmarkResponse,
  BookmarkFoldersResponse,
  BookmarkFolderResponse,
  BookmarksFilters,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  CreateBookmarkFolderInput,
  UpdateBookmarkFolderInput,
  UrlMetadata,
} from '@/types/bookmarks';

const BASE_URL = '/api';

// Helper to build query string
function buildQueryString(filters?: BookmarksFilters, includeCounts?: boolean): string {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.folderId) {
      params.set('folderId', filters.folderId);
    }
    if (filters.isPinned !== undefined) params.set('isPinned', String(filters.isPinned));
    if (filters.search) params.set('search', filters.search);
  }

  if (includeCounts) {
    params.set('includeCounts', 'true');
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

// ============ Bookmarks API ============

export async function fetchBookmarks(filters?: BookmarksFilters, includeCounts?: boolean): Promise<BookmarksListResponse> {
  const res = await fetch(`${BASE_URL}/bookmarks${buildQueryString(filters, includeCounts)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  return res.json();
}

export async function fetchBookmark(id: string): Promise<BookmarkResponse> {
  const res = await fetch(`${BASE_URL}/bookmarks/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch bookmark');
  return res.json();
}

export async function createBookmark(input: CreateBookmarkInput): Promise<BookmarkResponse> {
  const res = await fetch(`${BASE_URL}/bookmarks`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create bookmark');
  }
  return res.json();
}

export async function updateBookmark(id: string, input: UpdateBookmarkInput): Promise<BookmarkResponse> {
  const res = await fetch(`${BASE_URL}/bookmarks/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update bookmark');
  }
  return res.json();
}

export async function deleteBookmark(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/bookmarks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete bookmark');
}

// ============ Bookmark Folders API ============

export async function fetchBookmarkFolders(): Promise<BookmarkFoldersResponse> {
  const res = await fetch(`${BASE_URL}/bookmark-folders`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch bookmark folders');
  return res.json();
}

export async function createBookmarkFolder(input: CreateBookmarkFolderInput): Promise<BookmarkFolderResponse> {
  const res = await fetch(`${BASE_URL}/bookmark-folders`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create bookmark folder');
  }
  return res.json();
}

export async function updateBookmarkFolder(id: string, input: UpdateBookmarkFolderInput): Promise<BookmarkFolderResponse> {
  const res = await fetch(`${BASE_URL}/bookmark-folders/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update bookmark folder');
  }
  return res.json();
}

export async function deleteBookmarkFolder(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/bookmark-folders/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete bookmark folder');
  }
}

// ============ URL Metadata API ============

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const res = await fetch(`${BASE_URL}/bookmarks/metadata`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch URL metadata');
  }
  return res.json();
}

// ============ Pinned Bookmarks (for dashboard widget) ============

export async function fetchPinnedBookmarks(limit: number = 3): Promise<BookmarksListResponse> {
  const res = await fetch(`${BASE_URL}/bookmarks?isPinned=true&limit=${limit}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch pinned bookmarks');
  return res.json();
}
