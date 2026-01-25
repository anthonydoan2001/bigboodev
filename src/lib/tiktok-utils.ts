/**
 * Extract video ID from TikTok URL
 * Handles formats like:
 * - https://www.tiktokv.com/share/video/7123456789012345678/
 * - https://www.tiktok.com/@user/video/7123456789012345678
 */
export function extractVideoId(url: string): string {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : '';
}

/**
 * Mulberry32 seeded PRNG
 * Returns a function that generates pseudo-random numbers between 0 and 1
 */
export function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Convert string to a numeric hash for seeding
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle with seeded PRNG
 * Produces consistent order for the same seed
 */
export function shuffleArray<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  const random = mulberry32(hashCode(seed));

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * Get today's date string in UTC for consistent daily seeding
 */
export function getTodaySeed(): string {
  return new Date().toISOString().split('T')[0]; // "2026-01-24"
}

/**
 * TikTok oEmbed response type
 */
export interface TikTokOEmbedData {
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
}

/**
 * Fetch TikTok oEmbed data with retry logic
 * Returns null if fetch fails after retries
 */
export async function fetchTikTokOEmbed(
  url: string,
  retries: number = 1
): Promise<{ thumbnail?: string; title?: string; authorName?: string } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: TikTokOEmbedData = await response.json();
      return {
        thumbnail: data.thumbnail_url,
        title: data.title,
        authorName: data.author_name,
      };
    } catch (error) {
      if (attempt < retries) {
        // Wait 3 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      // Log error but don't throw - we'll continue without metadata
      console.error(`Failed to fetch oEmbed for ${url}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }
  return null;
}

/**
 * Generate month/year filter options from video dates
 */
export function getMonthYearOptions(dates: Date[]): Array<{
  label: string;
  value: string;
  month: number;
  year: number;
}> {
  const uniqueDates = new Set<string>();

  dates.forEach(date => {
    const d = new Date(date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    uniqueDates.add(key);
  });

  const options = Array.from(uniqueDates).map(key => {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month);
    return {
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: key,
      month,
      year,
    };
  });

  // Sort descending (newest first)
  return options.sort((a, b) => b.year - a.year || b.month - a.month);
}

/**
 * Sleep utility for batch processing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
