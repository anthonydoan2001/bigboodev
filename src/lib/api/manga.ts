import { getAuthHeaders } from '@/lib/api-client';
import {
  KomgaSeries,
  KomgaSeriesResponse,
  KomgaBook,
  KomgaBooksResponse,
  KomgaPage,
  KomgaSettings,
  KomgaSettingsInput,
  UpdateReadProgressRequest,
} from '@/types/komga';

const BASE_URL = '/api';

// ============ Settings API ============

export async function fetchKomgaSettings(): Promise<{
  configured: boolean;
  settings?: KomgaSettings & { hasPassword: boolean };
}> {
  const res = await fetch(`${BASE_URL}/komga/settings`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch Komga settings');
  return res.json();
}

export async function saveKomgaSettings(input: KomgaSettingsInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  settings?: KomgaSettings;
}> {
  const res = await fetch(`${BASE_URL}/komga/settings`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function testKomgaConnection(input: KomgaSettingsInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  libraryCount?: number;
}> {
  const res = await fetch(`${BASE_URL}/komga/test`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteKomgaSettings(): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/komga/settings`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete Komga settings');
  return res.json();
}

// ============ Series API ============

export async function fetchSeries(options?: {
  page?: number;
  size?: number;
  search?: string;
}): Promise<KomgaSeriesResponse> {
  const params = new URLSearchParams();
  if (options?.page !== undefined) params.set('page', options.page.toString());
  if (options?.size !== undefined) params.set('size', options.size.toString());
  if (options?.search) params.set('search', options.search);

  const query = params.toString();
  const res = await fetch(`${BASE_URL}/komga/series${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch series' }));
    throw new Error(error.error || 'Failed to fetch series');
  }

  return res.json();
}

export async function fetchSeriesById(seriesId: string): Promise<KomgaSeries> {
  const res = await fetch(`${BASE_URL}/komga/series/${seriesId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch series' }));
    throw new Error(error.error || 'Failed to fetch series');
  }

  return res.json();
}

// ============ Books API ============

export async function fetchBooks(seriesId: string, options?: {
  page?: number;
  size?: number;
  unpaged?: boolean;
}): Promise<KomgaBooksResponse> {
  const params = new URLSearchParams();
  if (options?.page !== undefined) params.set('page', options.page.toString());
  if (options?.size !== undefined) params.set('size', options.size.toString());
  if (options?.unpaged) params.set('unpaged', 'true');

  const query = params.toString();
  const res = await fetch(`${BASE_URL}/komga/series/${seriesId}/books${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch books' }));
    throw new Error(error.error || 'Failed to fetch books');
  }

  return res.json();
}

export async function fetchBookById(bookId: string): Promise<KomgaBook> {
  const res = await fetch(`${BASE_URL}/komga/books/${bookId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch book' }));
    throw new Error(error.error || 'Failed to fetch book');
  }

  return res.json();
}

// ============ Pages API ============

export async function fetchBookPages(bookId: string): Promise<KomgaPage[]> {
  const res = await fetch(`${BASE_URL}/komga/books/${bookId}/pages`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch pages' }));
    throw new Error(error.error || 'Failed to fetch pages');
  }

  return res.json();
}

export function getPageUrl(bookId: string, pageNum: number): string {
  return `${BASE_URL}/komga/books/${bookId}/pages/${pageNum}`;
}

export function getSeriesThumbnailUrl(seriesId: string): string {
  return `${BASE_URL}/komga/series/${seriesId}/thumbnail`;
}

export function getBookThumbnailUrl(bookId: string): string {
  return `${BASE_URL}/komga/books/${bookId}/thumbnail`;
}

// ============ Read Progress API ============

export async function updateReadProgress(
  bookId: string,
  progress: UpdateReadProgressRequest
): Promise<void> {
  const res = await fetch(`${BASE_URL}/komga/books/${bookId}/read-progress`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(progress),
  });

  if (!res.ok && res.status !== 204) {
    const error = await res.json().catch(() => ({ error: 'Failed to update progress' }));
    throw new Error(error.error || 'Failed to update progress');
  }
}

export async function deleteReadProgress(bookId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/komga/books/${bookId}/read-progress`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to delete progress');
  }
}

// ============ Continue Reading API ============

export async function fetchBooksInProgress(options?: {
  page?: number;
  size?: number;
}): Promise<KomgaBooksResponse> {
  const params = new URLSearchParams();
  params.set('read_status', 'IN_PROGRESS');
  if (options?.page !== undefined) params.set('page', options.page.toString());
  if (options?.size !== undefined) params.set('size', options.size.toString());

  const res = await fetch(`${BASE_URL}/komga/books?${params.toString()}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch in-progress books' }));
    throw new Error(error.error || 'Failed to fetch in-progress books');
  }

  return res.json();
}

export async function fetchOnDeck(options?: {
  page?: number;
  size?: number;
}): Promise<KomgaBooksResponse> {
  const params = new URLSearchParams();
  if (options?.page !== undefined) params.set('page', options.page.toString());
  if (options?.size !== undefined) params.set('size', options.size.toString());

  const query = params.toString();
  const res = await fetch(`${BASE_URL}/komga/books/ondeck${query ? `?${query}` : ''}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch on deck books' }));
    throw new Error(error.error || 'Failed to fetch on deck books');
  }

  return res.json();
}

// ============ Navigation API ============

export async function fetchNextBook(bookId: string): Promise<KomgaBook | null> {
  try {
    const res = await fetch(`${BASE_URL}/komga/books/${bookId}/next`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchPreviousBook(bookId: string): Promise<KomgaBook | null> {
  try {
    const res = await fetch(`${BASE_URL}/komga/books/${bookId}/previous`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
