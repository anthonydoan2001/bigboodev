import { WeatherResponse } from '@/types/weather';
import { getSession } from '@/lib/auth';

export async function fetchWeather(): Promise<WeatherResponse> {
  const sessionToken = getSession();
  
  const headers: HeadersInit = {};
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }
  
  const response = await fetch('/api/weather', {
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }
  return response.json();
}




