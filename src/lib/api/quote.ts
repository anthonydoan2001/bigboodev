import { Quote } from '@/types/quote';

export async function fetchQuote(date?: string): Promise<Quote> {
  const url = date ? `/api/quote?date=${date}` : '/api/quote';

  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch quote');
  }
  return response.json();
}
