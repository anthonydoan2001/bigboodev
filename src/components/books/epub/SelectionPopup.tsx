'use client';

import { ANNOTATION_COLORS, HIGHLIGHT_DOT_COLORS } from '../shared/constants';
import { StickyNote } from 'lucide-react';
import type { AnnotationColor } from '@/types/calibre-web';

interface SelectionPopupProps {
  position: { x: number; y: number };
  onHighlight: (color: AnnotationColor) => void;
  onAddNote: (color: AnnotationColor) => void;
}

export function SelectionPopup({ position, onHighlight, onAddNote }: SelectionPopupProps) {
  return (
    <div
      className="fixed z-[100] flex items-center gap-1.5 bg-popover border border-border rounded-lg shadow-xl px-2.5 py-1.5"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      {ANNOTATION_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onHighlight(color)}
          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/50 transition-colors flex-shrink-0"
          style={{ backgroundColor: HIGHLIGHT_DOT_COLORS[color] }}
          title={`Highlight ${color}`}
        />
      ))}
      <div className="w-px h-5 bg-border mx-0.5" />
      <button
        onClick={() => onAddNote('yellow')}
        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Add note"
      >
        <StickyNote className="h-4 w-4" />
      </button>
    </div>
  );
}
