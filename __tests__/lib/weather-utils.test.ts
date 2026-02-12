import { describe, it, expect } from 'vitest';
import {
  getWeatherBackground,
  getWeatherSummary,
  getWeatherIcon,
} from '@/lib/weather-utils';

describe('getWeatherBackground', () => {
  it('returns snow animation for snow conditions', () => {
    const result = getWeatherBackground('Heavy Snow');
    expect(result.animation).toBe('animate-snow');
  });

  it('returns rain animation for rain conditions', () => {
    const result = getWeatherBackground('Light Rain');
    expect(result.animation).toBe('animate-rain');
  });

  it('returns rain animation for drizzle', () => {
    const result = getWeatherBackground('Drizzle');
    expect(result.animation).toBe('animate-rain');
  });

  it('returns thunder animation for thunderstorms', () => {
    const result = getWeatherBackground('Thunderstorm');
    expect(result.animation).toBe('animate-thunder');
  });

  it('returns clouds animation for cloudy/overcast', () => {
    expect(getWeatherBackground('Cloudy').animation).toBe('animate-clouds');
    expect(getWeatherBackground('Overcast').animation).toBe('animate-clouds');
  });

  it('returns partly-cloudy animation for "partly" without "cloud"', () => {
    const result = getWeatherBackground('Partly Sunny');
    expect(result.animation).toBe('animate-partly-cloudy');
  });

  it('matches cloud condition before partly for "Partly Cloudy"', () => {
    // "Partly Cloudy" contains "cloud", so the cloud branch matches first
    const result = getWeatherBackground('Partly Cloudy');
    expect(result.animation).toBe('animate-clouds');
  });

  it('returns sunny animation for clear/sunny', () => {
    expect(getWeatherBackground('Clear').animation).toBe('animate-sunny');
    expect(getWeatherBackground('Sunny').animation).toBe('animate-sunny');
  });

  it('returns fog animation for mist/fog/haze', () => {
    expect(getWeatherBackground('Mist').animation).toBe('animate-fog');
    expect(getWeatherBackground('Fog').animation).toBe('animate-fog');
    expect(getWeatherBackground('Haze').animation).toBe('animate-fog');
    expect(getWeatherBackground('Haze').textColor).toBe('text-gray-900');
  });

  it('returns sunny default for unknown conditions', () => {
    const result = getWeatherBackground('Unknown Weather');
    expect(result.animation).toBe('animate-sunny');
    expect(result.textColor).toBe('text-white');
  });

  it('is case-insensitive', () => {
    expect(getWeatherBackground('heavy snow').animation).toBe('animate-snow');
    expect(getWeatherBackground('RAIN').animation).toBe('animate-rain');
  });
});

describe('getWeatherSummary', () => {
  it('detects snow in upcoming hours', () => {
    const hourly = [
      { condition: 'Snow', time: '2 PM', precipitation: 80 },
      { condition: 'Clear', time: '3 PM', precipitation: 0 },
    ];
    expect(getWeatherSummary('Cloudy', hourly)).toContain('Snowy');
  });

  it('detects rain via high precipitation', () => {
    const hourly = [
      { condition: 'Cloudy', time: 'this afternoon', precipitation: 50 },
    ];
    const summary = getWeatherSummary('Cloudy', hourly);
    expect(summary).toContain('Rainy');
  });

  it('returns clear summary for no special conditions', () => {
    const hourly = [
      { condition: 'Clear', time: '2 PM', precipitation: 0 },
    ];
    expect(getWeatherSummary('Clear', hourly)).toContain('Clear');
  });

  it('detects clouds when current is clear', () => {
    const hourly = [
      { condition: 'Cloudy', time: '2 PM', precipitation: 0 },
    ];
    const summary = getWeatherSummary('Clear', hourly);
    expect(summary).toContain('Cloudy');
  });

  it('handles wind conditions', () => {
    const hourly = [{ condition: 'Clear', time: '2 PM', precipitation: 0 }];
    expect(getWeatherSummary('Windy', hourly)).toContain('Windy');
  });
});

describe('getWeatherIcon', () => {
  it('returns OpenWeather icon URL with 2x size', () => {
    const url = getWeatherIcon('01d');
    expect(url).toBe('https://openweathermap.org/img/wn/01d@2x.png');
  });

  it('handles night icon codes', () => {
    const url = getWeatherIcon('02n');
    expect(url).toContain('02n@2x');
  });
});
