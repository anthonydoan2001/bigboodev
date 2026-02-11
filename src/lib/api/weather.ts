import { WeatherResponse } from '@/types/weather';

export async function fetchWeather(): Promise<WeatherResponse> {
  const response = await fetch('/api/weather', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }
  return response.json();
}
