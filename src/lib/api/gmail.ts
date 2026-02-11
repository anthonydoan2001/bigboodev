import { GmailResponse } from '@/types/gmail';

export async function fetchGmailEmails(): Promise<GmailResponse> {
  const response = await fetch('/api/gmail', {
    credentials: 'include',
  });

  if (!response.ok) {
    // If not connected or unauthorized, return empty state
    if (response.status === 404 || response.status === 401) {
      return {
        emails: [],
        unreadCount: 0,
        connected: false,
      };
    }
    throw new Error('Failed to fetch Gmail emails');
  }

  return response.json();
}

export function connectGmail(): void {
  // Redirect to Gmail OAuth flow
  window.location.href = '/api/auth/gmail';
}

export async function disconnectGmail(): Promise<void> {
  const response = await fetch('/api/gmail/disconnect', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect Gmail');
  }
}
