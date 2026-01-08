import { NextResponse } from 'next/server';
import { WeatherResponse } from '@/types/weather';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const LAT = '29.9717'; // Cypress, TX Latitude
const LON = '-95.6938'; // Cypress, TX Longitude

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'OpenWeather API key is missing' },
      { status: 500 }
    );
  }

  try {
    // Fetch Current Weather
    const currentRes = await fetch(
      `${BASE_URL}/weather?lat=${LAT}&lon=${LON}&units=imperial&appid=${API_KEY}`,
      { cache: 'no-store' }
    );

    if (!currentRes.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const currentData = await currentRes.json();

    // Fetch Forecast (5 day / 3 hour) to simulate daily/hourly if One Call isn't available
    // Note: For true daily/hourly, One Call API 3.0 is needed, but this works with standard free keys
    const forecastRes = await fetch(
      `${BASE_URL}/forecast?lat=${LAT}&lon=${LON}&units=imperial&appid=${API_KEY}`,
      { cache: 'no-store' }
    );

    const forecastData = await forecastRes.ok ? await forecastRes.json() : null;

    // Transform Data
    const weather: WeatherResponse = {
      current: {
        location: 'Cypress, TX',
        temperature: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        condition: currentData.weather[0].main,
        icon: currentData.weather[0].icon,
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed),
        high: Math.round(currentData.main.temp_max),
        low: Math.round(currentData.main.temp_min),
      },
      // Map first 12 forecast items as "hourly" (they are 3-hour steps)
      hourly: forecastData?.list.slice(0, 12).map((item: any) => {
        const date = new Date(item.dt * 1000);
        const hour = date.getHours();
        const isToday = date.toDateString() === new Date().toDateString();
        let timeLabel = '';
        
        if (isToday && hour === new Date().getHours()) {
          timeLabel = 'Now';
        } else {
          timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        }
        
        return {
          time: timeLabel,
          temperature: Math.round(item.main.temp),
          condition: item.weather[0].main,
          icon: item.weather[0].icon,
          precipitation: Math.round(item.pop * 100)
        };
      }) || [],
      // Map distinct days for daily
      daily: forecastData ? processDailyForecast(forecastData.list) : []
    };

    return NextResponse.json(weather);
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

function processDailyForecast(list: any[]): any[] {
  const dailyMap = new Map();

  list.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        high: item.main.temp_max,
        low: item.main.temp_min,
        condition: item.weather[0].main,
        icon: item.weather[0].icon,
        precipitation: item.pop * 100
      });
    } else {
      const existing = dailyMap.get(date);
      existing.high = Math.max(existing.high, item.main.temp_max);
      existing.low = Math.min(existing.low, item.main.temp_min);
    }
  });

  return Array.from(dailyMap.values()).slice(0, 10).map(day => ({
    ...day,
    high: Math.round(day.high),
    low: Math.round(day.low),
    precipitation: Math.round(day.precipitation)
  }));
}

