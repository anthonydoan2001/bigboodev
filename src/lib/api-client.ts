/**
 * Client-side API fetch wrapper that automatically includes session token
 * Use this instead of native fetch for all API calls
 */

import { getSession } from './auth';

/**
 * Get headers with session token included
 */
export function getAuthHeaders(additionalHeaders: HeadersInit = {}): HeadersInit {
  const sessionToken = getSession();
  const headers: HeadersInit = { ...additionalHeaders };
  
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
  const headers = getAuthHeaders(options.headers as HeadersInit);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });
}
