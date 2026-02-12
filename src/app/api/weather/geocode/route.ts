import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

const API_KEY = process.env.OPENWEATHER_API_KEY;

export const GET = withAuth(async (request: Request) => {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'OpenWeather API key is missing' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      throw new Error(`Geocoding API error: ${res.status}`);
    }

    const data = await res.json();

    const results = data.map((item: { name: string; state?: string; country: string; lat: number; lon: number }) => ({
      name: item.name,
      state: item.state || null,
      country: item.country,
      lat: item.lat.toString(),
      lon: item.lon.toString(),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
});
