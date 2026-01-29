export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    accent: string;
  };
}

export const themes: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright',
    isDark: false,
    colors: {
      primary: 'oklch(0.50 0.22 280)',
      background: 'oklch(0.985 0.002 260)',
      accent: 'oklch(0.55 0.15 200)',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes',
    isDark: true,
    colors: {
      primary: 'oklch(0.65 0.22 280)',
      background: 'oklch(0.1 0.01 260)',
      accent: 'oklch(0.45 0.12 200)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue-purple',
    isDark: true,
    colors: {
      primary: 'oklch(0.75 0.05 250)',
      background: 'oklch(0.08 0.015 250)',
      accent: 'oklch(0.55 0.12 220)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange tones',
    isDark: false,
    colors: {
      primary: 'oklch(0.55 0.18 35)',
      background: 'oklch(0.97 0.015 65)',
      accent: 'oklch(0.60 0.16 50)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool teal-cyan',
    isDark: false,
    colors: {
      primary: 'oklch(0.45 0.16 230)',
      background: 'oklch(0.97 0.015 200)',
      accent: 'oklch(0.50 0.14 190)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy greens',
    isDark: false,
    colors: {
      primary: 'oklch(0.45 0.14 145)',
      background: 'oklch(0.97 0.015 130)',
      accent: 'oklch(0.55 0.12 90)',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft pinks',
    isDark: false,
    colors: {
      primary: 'oklch(0.55 0.16 350)',
      background: 'oklch(0.97 0.015 350)',
      accent: 'oklch(0.60 0.14 320)',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Neutral minimal',
    isDark: false,
    colors: {
      primary: 'oklch(0.45 0.005 260)',
      background: 'oklch(0.97 0.002 260)',
      accent: 'oklch(0.55 0.08 260)',
    },
  },
];

export function getThemeById(id: string): ThemeDefinition | undefined {
  return themes.find((theme) => theme.id === id);
}

export function getDarkThemes(): ThemeDefinition[] {
  return themes.filter((theme) => theme.isDark);
}

export function getLightThemes(): ThemeDefinition[] {
  return themes.filter((theme) => !theme.isDark);
}
