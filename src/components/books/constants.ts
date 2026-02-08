import type { AnnotationColor } from '@/types/calibre-web';

export const HIGHLIGHT_COLORS: Record<AnnotationColor, { bg: string; border: string; label: string }> = {
  yellow: { bg: 'rgba(255, 235, 59, 0.3)', border: 'rgba(255, 235, 59, 0.6)', label: 'Yellow' },
  green: { bg: 'rgba(76, 175, 80, 0.3)', border: 'rgba(76, 175, 80, 0.6)', label: 'Green' },
  blue: { bg: 'rgba(66, 165, 245, 0.3)', border: 'rgba(66, 165, 245, 0.6)', label: 'Blue' },
  pink: { bg: 'rgba(236, 64, 122, 0.3)', border: 'rgba(236, 64, 122, 0.6)', label: 'Pink' },
  orange: { bg: 'rgba(255, 152, 0, 0.3)', border: 'rgba(255, 152, 0, 0.6)', label: 'Orange' },
};

export const ANNOTATION_COLORS: AnnotationColor[] = ['yellow', 'green', 'blue', 'pink', 'orange'];

export const HIGHLIGHT_DOT_COLORS: Record<AnnotationColor, string> = {
  yellow: '#FFEB3B',
  green: '#4CAF50',
  blue: '#42A5F5',
  pink: '#EC407A',
  orange: '#FF9800',
};

export const FONT_FAMILIES = [
  { value: 'default', label: 'Default' },
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Merriweather', serif", label: 'Merriweather' },
  { value: "'Literata', serif", label: 'Literata' },
];
