/**
 * Client-side session management utilities
 * Stores session token in localStorage for persistent authentication
 */

const SESSION_STORAGE_KEY = 'dashboard_session_token';

/**
 * Generate a simple session token
 * For a single-user app, a simple UUID-like token is sufficient
 */
function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create and store a new session token
 */
export function createSession(): string {
  const token = generateSessionToken();
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, token);
  }
  return token;
}

/**
 * Retrieve the current session token from localStorage
 */
export function getSession(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

/**
 * Check if a session token exists
 */
export function hasSession(): boolean {
  return getSession() !== null;
}

/**
 * Remove the session token (not used per requirements, but available)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Validate that a session token exists and is not empty
 */
export function validateSession(token: string | null): boolean {
  return token !== null && token.length > 0 && token.startsWith('session_');
}
