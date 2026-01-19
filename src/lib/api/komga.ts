import { getAuthHeaders } from '@/lib/api-client';
import { KomgaBook, KomgaLibraryStats } from '@/types/komga';

/**
 * Komga API Client
 * Client-side functions that call Next.js API routes
 */

export async function fetchRecentBooks(limit: number = 10): Promise<KomgaBook[]> {
  try {
    const response = await fetch(`/api/komga/recent?limit=${limit}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent books');
    }

    const data = await response.json();
    return data.books || [];
  } catch (error) {
    console.error('Error fetching recent books:', error);
    throw error;
  }
}

export async function fetchInProgressBooks(): Promise<KomgaBook[]> {
  try {
    const response = await fetch('/api/komga/in-progress', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch in-progress books');
    }

    const data = await response.json();
    return data.books || [];
  } catch (error) {
    console.error('Error fetching in-progress books:', error);
    throw error;
  }
}

export async function fetchLibraryStats(): Promise<KomgaLibraryStats> {
  try {
    const response = await fetch('/api/komga/stats', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch library stats');
    }

    const data = await response.json();
    return {
      totalBooks: data.totalBooks || 0,
      totalSeries: data.totalSeries || 0,
      unreadBooks: data.unreadBooks || 0,
      inProgressBooks: data.inProgressBooks || 0,
    };
  } catch (error) {
    console.error('Error fetching library stats:', error);
    throw error;
  }
}

export async function searchBooks(query: string, page: number = 0, size: number = 20): Promise<{
  books: KomgaBook[];
  totalElements: number;
  totalPages: number;
  page: number;
}> {
  try {
    const response = await fetch(`/api/komga/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to search books');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
}

/**
 * Get thumbnail URL for a book (uses Next.js proxy route)
 */
export function getBookThumbnailUrl(bookId: string): string {
  return `/api/komga/thumbnail/${bookId}`;
}

/**
 * Get Komga reader URL for a book
 * Uses NEXT_PUBLIC_KOMGA_BASE_URL if set, otherwise defaults to komga.bigboo.dev
 */
export function getBookReaderUrl(bookId: string): string {
  // NEXT_PUBLIC_ env vars are available on both client and server in Next.js
  const baseUrl = process.env.NEXT_PUBLIC_KOMGA_BASE_URL || 'https://komga.bigboo.dev';
  return `${baseUrl}/book/${bookId}`;
}
