/**
 * Reader settings storage and management
 * Settings are stored per series in localStorage
 */

export type ReadingMode = 
  | 'paged-ltr'      // Paged (Left to Right)
  | 'paged-rtl'      // Paged (Right to Left)
  | 'continuous-ltr' // Continuous (Left to Right)
  | 'continuous-rtl' // Continuous (Right to Left)
  | 'continuous-vertical'; // Continuous (Vertical)

export interface ReaderSettings {
  readingMode: ReadingMode;
  zoom: number; // Zoom level (1.0 = 100%, 0.5 = 50%, 2.0 = 200%, etc.)
}

const DEFAULT_SETTINGS: ReaderSettings = {
  readingMode: 'paged-ltr',
  zoom: 1.0,
};

const STORAGE_KEY_PREFIX = 'komga_reader_settings_';

/**
 * Get reader settings for a series
 */
export function getReaderSettings(seriesId: string): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${seriesId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        readingMode: parsed.readingMode || DEFAULT_SETTINGS.readingMode,
        zoom: parsed.zoom ?? DEFAULT_SETTINGS.zoom,
      };
    }
  } catch (error) {
    console.error('Error reading reader settings:', error);
  }
  
  return DEFAULT_SETTINGS;
}

/**
 * Save reader settings for a series
 */
export function saveReaderSettings(seriesId: string, settings: Partial<ReaderSettings>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getReaderSettings(seriesId);
    const updated = { ...current, ...settings };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${seriesId}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving reader settings:', error);
  }
}

/**
 * Get reading mode for a series
 */
export function getReadingMode(seriesId: string): ReadingMode {
  return getReaderSettings(seriesId).readingMode;
}

/**
 * Get zoom level for a series
 */
export function getZoomLevel(seriesId: string): number {
  return getReaderSettings(seriesId).zoom;
}

/**
 * Save reading mode for a series
 */
export function saveReadingMode(seriesId: string, mode: ReadingMode): void {
  saveReaderSettings(seriesId, { readingMode: mode });
}

/**
 * Save zoom level for a series
 */
export function saveZoomLevel(seriesId: string, zoom: number): void {
  saveReaderSettings(seriesId, { zoom });
}
