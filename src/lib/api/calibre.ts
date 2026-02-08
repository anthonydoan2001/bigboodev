import { getAuthHeaders } from '@/lib/api-client';
import {
  CalibreBook,
  CalibreBooksResponse,
  CalibreWebSettings,
  CalibreWebSettingsInput,
  CalibreAuthor,
  CalibreSeries,
  CalibreShelf,
  BookReadingProgress,
  BookAnnotation,
  BookBookmark,
  CreateAnnotationInput,
  UpdateAnnotationInput,
  CreateBookmarkInput,
  AnnotationColor,
} from '@/types/calibre-web';

const BASE_URL = '/api';

// ============ Settings API ============

export async function fetchCalibreSettings(): Promise<{
  configured: boolean;
  settings?: CalibreWebSettings & { hasPassword: boolean };
}> {
  const res = await fetch(`${BASE_URL}/calibre/settings`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch Calibre-Web settings');
  return res.json();
}

export async function saveCalibreSettings(input: CalibreWebSettingsInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  settings?: CalibreWebSettings;
}> {
  const res = await fetch(`${BASE_URL}/calibre/settings`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function testCalibreConnection(input: CalibreWebSettingsInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const res = await fetch(`${BASE_URL}/calibre/test`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteCalibreSettings(): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/calibre/settings`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete Calibre-Web settings');
  return res.json();
}

// ============ Books API ============

export async function fetchBooks(feed: string = 'new'): Promise<CalibreBooksResponse> {
  const res = await fetch(`${BASE_URL}/calibre/books?feed=${encodeURIComponent(feed)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch books' }));
    throw new Error(error.error || 'Failed to fetch books');
  }

  return res.json();
}

export async function fetchBookById(bookId: number): Promise<CalibreBook> {
  const res = await fetch(`${BASE_URL}/calibre/books/${bookId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch book' }));
    throw new Error(error.error || 'Failed to fetch book');
  }

  return res.json();
}

export async function searchBooks(query: string): Promise<CalibreBooksResponse> {
  const res = await fetch(`${BASE_URL}/calibre/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to search books' }));
    throw new Error(error.error || 'Failed to search books');
  }

  return res.json();
}

// ============ Navigation API ============

export async function fetchAuthors(): Promise<CalibreAuthor[]> {
  const res = await fetch(`${BASE_URL}/calibre/authors`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to fetch authors');
  return res.json();
}

export async function fetchSeries(): Promise<CalibreSeries[]> {
  const res = await fetch(`${BASE_URL}/calibre/series`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to fetch series');
  return res.json();
}

export async function fetchShelves(): Promise<CalibreShelf[]> {
  const res = await fetch(`${BASE_URL}/calibre/shelves`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to fetch shelves');
  return res.json();
}

// ============ URL Helpers ============

export function getBookCoverUrl(bookId: number): string {
  return `${BASE_URL}/calibre/cover?id=${bookId}`;
}

export function getBookDownloadUrl(bookId: number, format: string): string {
  return `${BASE_URL}/calibre/books/${bookId}/download/${format}`;
}

// ============ Reading Progress API ============

export async function fetchReadingProgress(
  bookId: string,
  format: string
): Promise<BookReadingProgress | null> {
  const res = await fetch(
    `${BASE_URL}/calibre/progress?bookId=${encodeURIComponent(bookId)}&format=${encodeURIComponent(format)}`,
    {
      headers: getAuthHeaders(),
      credentials: 'include',
    }
  );

  if (!res.ok) throw new Error('Failed to fetch reading progress');
  const data = await res.json();
  return data.progress || null;
}

export async function fetchRecentlyRead(): Promise<BookReadingProgress[]> {
  const res = await fetch(`${BASE_URL}/calibre/progress/recent`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to fetch recently read');
  const data = await res.json();
  return data.progress || [];
}

export async function saveReadingProgress(
  bookId: string,
  format: string,
  position: string,
  progress: number
): Promise<void> {
  const res = await fetch(`${BASE_URL}/calibre/progress`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ bookId, format, position, progress }),
  });

  if (!res.ok) throw new Error('Failed to save reading progress');
}

// ============ Annotations API ============

export async function fetchAnnotations(bookId: string): Promise<BookAnnotation[]> {
  const res = await fetch(
    `${BASE_URL}/calibre/annotations?bookId=${encodeURIComponent(bookId)}&type=annotation`,
    { headers: getAuthHeaders(), credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to fetch annotations');
  const data = await res.json();
  return data.annotations || [];
}

export async function createAnnotation(input: CreateAnnotationInput): Promise<BookAnnotation> {
  const res = await fetch(`${BASE_URL}/calibre/annotations`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ ...input, type: 'annotation', annotationType: input.type || 'highlight' }),
  });
  if (!res.ok) throw new Error('Failed to create annotation');
  const data = await res.json();
  return data.annotation;
}

export async function updateAnnotation(input: UpdateAnnotationInput): Promise<BookAnnotation> {
  const res = await fetch(`${BASE_URL}/calibre/annotations`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ ...input, type: 'annotation' }),
  });
  if (!res.ok) throw new Error('Failed to update annotation');
  const data = await res.json();
  return data.annotation;
}

export async function deleteAnnotation(id: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/calibre/annotations?id=${encodeURIComponent(id)}&type=annotation`,
    { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to delete annotation');
}

// ============ Bookmarks API ============

export async function fetchBookmarks(bookId: string): Promise<BookBookmark[]> {
  const res = await fetch(
    `${BASE_URL}/calibre/annotations?bookId=${encodeURIComponent(bookId)}&type=bookmark`,
    { headers: getAuthHeaders(), credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  const data = await res.json();
  return data.bookmarks || [];
}

export async function createBookmark(input: CreateBookmarkInput): Promise<BookBookmark> {
  const res = await fetch(`${BASE_URL}/calibre/annotations`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ ...input, type: 'bookmark' }),
  });
  if (!res.ok) throw new Error('Failed to create bookmark');
  const data = await res.json();
  return data.bookmark;
}

export async function deleteBookmark(id: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/calibre/annotations?id=${encodeURIComponent(id)}&type=bookmark`,
    { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to delete bookmark');
}
