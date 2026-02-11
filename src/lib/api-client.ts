/**
 * Client-side API fetch wrapper
 * Authentication is handled via HttpOnly cookies (credentials: 'include')
 */

/**
 * Get headers for API requests.
 * No longer injects session tokens — cookies handle auth.
 */
export function getAuthHeaders(
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  return { ...additionalHeaders };
}

/**
 * Fetch wrapper that includes cookies for authentication
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}
