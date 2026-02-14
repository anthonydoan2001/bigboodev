import { describe, it, expect } from 'vitest';
import {
  extractVideoId,
  mulberry32,
  hashCode,
  shuffleArray,
  getMonthYearOptions,
} from '@/lib/tiktok-utils';

describe('extractVideoId', () => {
  it('extracts ID from tiktokv.com share URL', () => {
    expect(
      extractVideoId('https://www.tiktokv.com/share/video/7123456789012345678/')
    ).toBe('7123456789012345678');
  });

  it('extracts ID from tiktok.com user video URL', () => {
    expect(
      extractVideoId('https://www.tiktok.com/@user/video/7123456789012345678')
    ).toBe('7123456789012345678');
  });

  it('returns empty string for URL without video ID', () => {
    expect(extractVideoId('https://www.tiktok.com/@user')).toBe('');
  });

  it('returns empty string for non-TikTok URL', () => {
    expect(extractVideoId('https://example.com')).toBe('');
  });
});

describe('mulberry32', () => {
  it('returns a function', () => {
    expect(typeof mulberry32(42)).toBe('function');
  });

  it('produces values between 0 and 1', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('is deterministic for the same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe('hashCode', () => {
  it('returns a non-negative number', () => {
    expect(hashCode('test')).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic', () => {
    expect(hashCode('hello')).toBe(hashCode('hello'));
  });

  it('produces different hashes for different strings', () => {
    expect(hashCode('abc')).not.toBe(hashCode('xyz'));
  });
});

describe('shuffleArray', () => {
  it('returns a new array (does not mutate original)', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffleArray(original, 'seed');
    expect(result).not.toBe(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('contains all original elements', () => {
    const result = shuffleArray([1, 2, 3, 4, 5], 'seed');
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for the same seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffleArray(arr, 'daily')).toEqual(shuffleArray(arr, 'daily'));
  });

  it('produces different order for different seeds', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffleArray(arr, 'seed-a')).not.toEqual(shuffleArray(arr, 'seed-b'));
  });
});

describe('getMonthYearOptions', () => {
  it('returns unique month/year pairs sorted descending', () => {
    const dates = [
      new Date('2025-03-15'),
      new Date('2025-01-10'),
      new Date('2025-03-20'),
      new Date('2024-12-01'),
    ];
    const options = getMonthYearOptions(dates);
    expect(options).toHaveLength(3);
    expect(options[0].year).toBe(2025);
    expect(options[0].month).toBe(2); // March = month index 2
    expect(options[options.length - 1].year).toBe(2024);
  });

  it('returns empty array for empty input', () => {
    expect(getMonthYearOptions([])).toEqual([]);
  });

  it('includes label with month and year text', () => {
    const options = getMonthYearOptions([new Date('2025-06-15')]);
    expect(options[0].label).toContain('2025');
    expect(options[0].label).toContain('June');
  });
});
