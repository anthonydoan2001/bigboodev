import { GasPriceResponse } from '@/types/gas';

export async function fetchGasPrice(): Promise<GasPriceResponse> {
  const response = await fetch('/api/gas', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch gas price');
  }

  return response.json();
}
