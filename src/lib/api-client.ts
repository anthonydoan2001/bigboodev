/**
 * Client-side API fetch wrapper that automatically includes session token
 * Use this instead of native fetch for all API calls
 */

import { getSession } from './auth';

/**
 * Get headers with session token included
 */
export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const sessionToken = getSession();
  const headers: Record<string, string> = { ...additionalHeaders };
  
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }
  
  return headers;
}

/**
 * Fetch wrapper that automatically includes session token in headers
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Convert HeadersInit to Record if needed
  let existingHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        existingHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        existingHeaders[key] = value;
      });
    } else {
      existingHeaders = options.headers as Record<string, string>;
    }
  }
  
  const headers = getAuthHeaders(existingHeaders);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });
}
