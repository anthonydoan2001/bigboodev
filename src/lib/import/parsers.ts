// Parser utilities for Letterboxd CSV and MAL XML imports

export interface ParsedItem {
  title: string;
  year?: number;
  type: 'MOVIE' | 'SHOW' | 'ANIME';
  status: 'PLAN_TO_WATCH' | 'WATCHING' | 'WATCHED';
  externalId?: string; // MAL anime ID
  rating?: number;
  episodes?: number;
}

export interface ParseResult {
  items: ParsedItem[];
  errors: string[];
  skipped: number;
}

// Parse Letterboxd CSV (tab-delimited)
// Format: Date\tName\tYear\tLetterboxd URI
export function parseLetterboxdCSV(
  content: string,
  destination: 'PLAN_TO_WATCH' | 'WATCHED'
): ParseResult {
  const items: ParsedItem[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const lines = content.trim().split('\n');
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try tab-delimited first, then comma
    let parts = line.split('\t');
    if (parts.length < 3) {
      parts = line.split(',');
    }

    if (parts.length < 3) {
      errors.push(`Line ${i + 1}: Invalid format - "${line.substring(0, 50)}..."`);
      continue;
    }

    // Format: Date, Name, Year, Letterboxd URI (optional Rating for watched)
    const [, name, yearStr] = parts;
    const year = parseInt(yearStr, 10);

    if (!name || name.trim() === '') {
      errors.push(`Line ${i + 1}: Missing title`);
      continue;
    }

    items.push({
      title: name.trim(),
      year: isNaN(year) ? undefined : year,
      type: 'MOVIE', // Letterboxd is primarily movies
      status: destination,
    });
  }

  return { items, errors, skipped };
}

// MAL status to our status mapping
const MAL_STATUS_MAP: Record<string, 'PLAN_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'SKIP'> = {
  'Completed': 'WATCHED',
  'Watching': 'WATCHING',
  'Plan to Watch': 'PLAN_TO_WATCH',
  'Dropped': 'SKIP',
  'On-Hold': 'SKIP',
};

// Parse MAL XML export
export function parseMALXML(content: string): ParseResult {
  const items: ParsedItem[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Extract all <anime> blocks
  const animeRegex = /<anime>([\s\S]*?)<\/anime>/g;
  let match;

  while ((match = animeRegex.exec(content)) !== null) {
    const animeBlock = match[1];

    // Extract fields
    const idMatch = animeBlock.match(/<series_animedb_id>(\d+)<\/series_animedb_id>/);
    const titleMatch = animeBlock.match(/<series_title>[\s\S]*?<!\[CDATA\[\s*(.*?)\s*\]\]>[\s\S]*?<\/series_title>/);
    const titleMatchAlt = animeBlock.match(/<series_title>\s*(.*?)\s*<\/series_title>/);
    const statusMatch = animeBlock.match(/<my_status>(.*?)<\/my_status>/);
    const scoreMatch = animeBlock.match(/<my_score>(\d+)<\/my_score>/);
    const episodesMatch = animeBlock.match(/<series_episodes>(\d+)<\/series_episodes>/);

    const animeId = idMatch ? idMatch[1] : undefined;
    const title = titleMatch ? titleMatch[1].trim() : (titleMatchAlt ? titleMatchAlt[1].trim() : undefined);
    const malStatus = statusMatch ? statusMatch[1] : undefined;
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : undefined;
    const episodes = episodesMatch ? parseInt(episodesMatch[1], 10) : undefined;

    if (!title) {
      errors.push(`Anime ID ${animeId || 'unknown'}: Missing title`);
      continue;
    }

    if (!malStatus) {
      errors.push(`"${title}": Missing status`);
      continue;
    }

    const status = MAL_STATUS_MAP[malStatus];
    if (!status) {
      errors.push(`"${title}": Unknown status "${malStatus}"`);
      continue;
    }

    if (status === 'SKIP') {
      skipped++;
      continue;
    }

    items.push({
      title,
      type: 'ANIME',
      status,
      externalId: animeId,
      rating: score && score > 0 ? score : undefined,
      episodes: episodes && episodes > 0 ? episodes : undefined,
    });
  }

  return { items, errors, skipped };
}

// Detect file type from content
export function detectFileType(content: string, filename: string): 'letterboxd' | 'mal' | 'unknown' {
  const lowerFilename = filename.toLowerCase();
  
  // Check by filename
  if (lowerFilename.includes('animelist') && lowerFilename.endsWith('.xml')) {
    return 'mal';
  }
  
  if (lowerFilename.endsWith('.csv')) {
    return 'letterboxd';
  }

  // Check by content
  if (content.includes('<myanimelist>') || content.includes('<anime>')) {
    return 'mal';
  }

  if (content.includes('Letterboxd URI') || content.includes('boxd.it')) {
    return 'letterboxd';
  }

  return 'unknown';
}
