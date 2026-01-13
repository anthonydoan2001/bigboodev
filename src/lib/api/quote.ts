import { Quote } from '@/types/quote';
import { getSession } from '@/lib/auth';

export async function fetchQuote(date?: string): Promise<Quote> {
  const url = date ? `/api/quote?date=${date}` : '/api/quote';
  const sessionToken = getSession();
  
  const headers: HeadersInit = {};
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }
  
  const response = await fetch(url, {
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch quote');
  }
  return response.json();
}
