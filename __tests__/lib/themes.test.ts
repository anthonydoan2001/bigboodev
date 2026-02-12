import { describe, it, expect } from 'vitest';
import { getThemeById, getDarkThemes, getLightThemes, themes } from '@/lib/themes';

describe('themes', () => {
  describe('getThemeById', () => {
    it('returns theme for valid ID', () => {
      const theme = getThemeById('dark');
      expect(theme).toBeDefined();
      expect(theme!.name).toBe('Dark');
      expect(theme!.isDark).toBe(true);
    });

    it('returns undefined for invalid ID', () => {
      expect(getThemeById('nonexistent')).toBeUndefined();
    });
  });

  describe('getDarkThemes', () => {
    it('returns only dark themes', () => {
      const dark = getDarkThemes();
      expect(dark.length).toBeGreaterThan(0);
      expect(dark.every((t) => t.isDark)).toBe(true);
    });
  });

  describe('getLightThemes', () => {
    it('returns only light themes', () => {
      const light = getLightThemes();
      expect(light.length).toBeGreaterThan(0);
      expect(light.every((t) => !t.isDark)).toBe(true);
    });
  });

  it('dark + light themes account for all themes', () => {
    expect(getDarkThemes().length + getLightThemes().length).toBe(themes.length);
  });
});
