import { GasPriceResponse } from '@/types/gas';
import { getSession } from '@/lib/auth';

export async function fetchGasPrice(): Promise<GasPriceResponse> {
  const sessionToken = getSession();

  const headers: HeadersInit = {};
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }

  const response = await fetch('/api/gas', {
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch gas price');
  }

  return response.json();
}
