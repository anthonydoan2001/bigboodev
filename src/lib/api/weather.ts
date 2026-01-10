import { WeatherResponse } from '@/types/weather';

export async function fetchWeather(): Promise<WeatherResponse> {
  const response = await fetch('/api/weather');
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }
  return response.json();
}




