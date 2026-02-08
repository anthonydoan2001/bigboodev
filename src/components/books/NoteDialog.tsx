'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ANNOTATION_COLORS, HIGHLIGHT_DOT_COLORS } from './constants';
import type { BookAnnotation, AnnotationColor } from '@/types/calibre-web';

interface NoteDialogProps {
  open: boolean;
  onClose: () => void;
  annotation: BookAnnotation | null;
  onSave: (id: string, note: string | null, color: AnnotationColor) => void;
  onDelete: (id: string) => void;
}

export function NoteDialog({ open, onClose, annotation, onSave, onDelete }: NoteDialogProps) {
  const [note, setNote] = useState(annotation?.note || '');
  const [color, setColor] = useState<AnnotationColor>(annotation?.color || 'yellow');

  // Sync state when annotation changes
  if (annotation && (note !== (annotation.note || '') || color !== annotation.color) && open) {
    // Only reset when the dialog opens with a new annotation
  }

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && annotation) {
      setNote(annotation.note || '');
      setColor(annotation.color);
    }
    if (!isOpen) onClose();
  };

  const handleSave = () => {
    if (!annotation) return;
    onSave(annotation.id, note.trim() || null, color);
    onClose();
  };

  const handleDelete = () => {
    if (!annotation) return;
    onDelete(annotation.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Highlight</DialogTitle>
        </DialogHeader>

        {annotation && (
          <div className="space-y-4">
            {/* Highlighted text */}
            <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground line-clamp-4">
              {annotation.text}
            </blockquote>

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Color:</span>
              {ANNOTATION_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-all flex-shrink-0"
                  style={{
                    backgroundColor: HIGHLIGHT_DOT_COLORS[c],
                    outline: c === color ? '2px solid white' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>

            {/* Note textarea */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
