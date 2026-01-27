/**
 * Komga API Client
 * Handles communication with the Komga manga server
 */

import {
  KomgaSeries,
  KomgaSeriesResponse,
  KomgaBook,
  KomgaBooksResponse,
  KomgaPage,
  KomgaReadProgress,
  UpdateReadProgressRequest,
} from '@/types/komga';

// ============ Auth Helper ============

export function createBasicAuthHeader(email: string, password: string): string {
  const credentials = Buffer.from(`${email}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}

// ============ Server-side Komga Client ============

export class KomgaClient {
  private serverUrl: string;
  private authHeader: string;

  constructor(serverUrl: string, email: string, password: string) {
    // Remove trailing slash if present
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.authHeader = createBasicAuthHeader(email, password);
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.serverUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Komga API error: ${response.status} - ${errorText}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    // Return empty object for non-JSON responses (like 204 No Content)
    return {} as T;
  }

  private async fetchBinary(path: string): Promise<{ data: Buffer; contentType: string }> {
    const url = `${this.serverUrl}${path}`;

    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'Authorization': this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Komga API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return {
      data: Buffer.from(arrayBuffer),
      contentType,
    };
  }

  // ============ Test Connection ============

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use /api/v1/libraries as a test endpoint - it requires auth and is widely supported
      const url = `${this.serverUrl}/api/v1/libraries`;

      const response = await fetch(url, {
        headers: {
          'Authorization': this.authHeader,
        },
        redirect: 'follow', // Follow redirects (e.g., HTTP -> HTTPS)
      });

      if (response.ok) {
        return { success: true };
      }

      const errorText = await response.text().catch(() => '');
      if (response.status === 401) {
        return { success: false, error: 'Invalid email or password' };
      }
      if (response.status === 403) {
        return { success: false, error: 'Access forbidden - check user permissions' };
      }
      return { success: false, error: `Server returned ${response.status}: ${errorText}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Check for common network errors
      if (message.includes('ECONNREFUSED')) {
        return { success: false, error: 'Cannot connect to server - connection refused' };
      }
      if (message.includes('ENOTFOUND')) {
        return { success: false, error: 'Server not found - check the URL' };
      }
      if (message.includes('ETIMEDOUT')) {
        return { success: false, error: 'Connection timed out' };
      }
      return { success: false, error: `Connection failed: ${message}` };
    }
  }

  // ============ Series Endpoints ============

  async getSeries(options?: {
    page?: number;
    size?: number;
    search?: string;
    libraryId?: string;
    unpaged?: boolean;
  }): Promise<KomgaSeriesResponse> {
    const params = new URLSearchParams();

    if (options?.page !== undefined) params.set('page', options.page.toString());
    if (options?.size !== undefined) params.set('size', options.size.toString());
    if (options?.search) params.set('search', options.search);
    if (options?.libraryId) params.set('library_id', options.libraryId);
    if (options?.unpaged) params.set('unpaged', 'true');

    const query = params.toString();
    return this.fetch<KomgaSeriesResponse>(`/api/v1/series${query ? `?${query}` : ''}`);
  }

  async getSeriesById(seriesId: string): Promise<KomgaSeries> {
    return this.fetch<KomgaSeries>(`/api/v1/series/${seriesId}`);
  }

  async getSeriesThumbnail(seriesId: string): Promise<{ data: Buffer; contentType: string }> {
    return this.fetchBinary(`/api/v1/series/${seriesId}/thumbnail`);
  }

  // ============ Books Endpoints ============

  async getBooks(seriesId: string, options?: {
    page?: number;
    size?: number;
    unpaged?: boolean;
  }): Promise<KomgaBooksResponse> {
    const params = new URLSearchParams();

    if (options?.page !== undefined) params.set('page', options.page.toString());
    if (options?.size !== undefined) params.set('size', options.size.toString());
    if (options?.unpaged) params.set('unpaged', 'true');

    const query = params.toString();
    return this.fetch<KomgaBooksResponse>(`/api/v1/series/${seriesId}/books${query ? `?${query}` : ''}`);
  }

  async getBookById(bookId: string): Promise<KomgaBook> {
    return this.fetch<KomgaBook>(`/api/v1/books/${bookId}`);
  }

  async getBookThumbnail(bookId: string): Promise<{ data: Buffer; contentType: string }> {
    return this.fetchBinary(`/api/v1/books/${bookId}/thumbnail`);
  }

  // ============ Pages Endpoints ============

  async getBookPages(bookId: string): Promise<KomgaPage[]> {
    return this.fetch<KomgaPage[]>(`/api/v1/books/${bookId}/pages`);
  }

  async getPage(bookId: string, pageNum: number): Promise<{ data: Buffer; contentType: string }> {
    return this.fetchBinary(`/api/v1/books/${bookId}/pages/${pageNum}`);
  }

  // ============ Read Progress Endpoints ============

  async getReadProgress(bookId: string): Promise<KomgaReadProgress | null> {
    try {
      return await this.fetch<KomgaReadProgress>(`/api/v1/books/${bookId}/read-progress`);
    } catch {
      // No progress found
      return null;
    }
  }

  async updateReadProgress(bookId: string, progress: UpdateReadProgressRequest): Promise<void> {
    await this.fetch(`/api/v1/books/${bookId}/read-progress`, {
      method: 'PATCH',
      body: JSON.stringify(progress),
    });
  }

  async deleteReadProgress(bookId: string): Promise<void> {
    await this.fetch(`/api/v1/books/${bookId}/read-progress`, {
      method: 'DELETE',
    });
  }

  // ============ Continue Reading ============

  async getBooksInProgress(options?: {
    page?: number;
    size?: number;
  }): Promise<KomgaBooksResponse> {
    const params = new URLSearchParams();
    params.set('read_status', 'IN_PROGRESS');

    if (options?.page !== undefined) params.set('page', options.page.toString());
    if (options?.size !== undefined) params.set('size', options.size.toString());

    return this.fetch<KomgaBooksResponse>(`/api/v1/books?${params.toString()}`);
  }

  // ============ On Deck (Next unread in series) ============

  async getOnDeck(options?: {
    page?: number;
    size?: number;
  }): Promise<KomgaBooksResponse> {
    const params = new URLSearchParams();

    if (options?.page !== undefined) params.set('page', options.page.toString());
    if (options?.size !== undefined) params.set('size', options.size.toString());

    return this.fetch<KomgaBooksResponse>(`/api/v1/books/ondeck?${params.toString()}`);
  }

  // ============ Search ============

  async searchSeries(query: string, options?: {
    page?: number;
    size?: number;
  }): Promise<KomgaSeriesResponse> {
    return this.getSeries({
      search: query,
      page: options?.page,
      size: options?.size,
    });
  }

  // ============ Libraries ============

  async getLibraries(): Promise<Array<{ id: string; name: string }>> {
    return this.fetch<Array<{ id: string; name: string }>>('/api/v1/libraries');
  }

  // ============ Next/Previous Book in Series ============

  async getNextBook(bookId: string): Promise<KomgaBook | null> {
    try {
      return await this.fetch<KomgaBook>(`/api/v1/books/${bookId}/next`);
    } catch {
      return null;
    }
  }

  async getPreviousBook(bookId: string): Promise<KomgaBook | null> {
    try {
      return await this.fetch<KomgaBook>(`/api/v1/books/${bookId}/previous`);
    } catch {
      return null;
    }
  }
}

// ============ Singleton for default settings ============

let defaultClient: KomgaClient | null = null;

export function getKomgaClient(serverUrl: string, email: string, password: string): KomgaClient {
  // Create a new client (or could cache based on credentials)
  return new KomgaClient(serverUrl, email, password);
}

export function setDefaultKomgaClient(client: KomgaClient): void {
  defaultClient = client;
}

export function getDefaultKomgaClient(): KomgaClient | null {
  return defaultClient;
}
