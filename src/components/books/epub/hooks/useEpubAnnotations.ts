import { useCallback, useEffect, useState } from 'react';
import {
  useAnnotations,
  useAnnotationMutations,
} from '@/lib/hooks/useBooks';
import type { Rendition } from 'epubjs';
import type { BookAnnotation, AnnotationColor } from '@/types/calibre-web';

interface UseEpubAnnotationsOptions {
  bookId: number;
  renditionRef: React.RefObject<Rendition | null>;
  currentChapter?: string;
}

export function useEpubAnnotations({
  bookId,
  renditionRef,
  currentChapter,
}: UseEpubAnnotationsOptions) {
  const bookIdStr = String(bookId);
  const { annotations } = useAnnotations(bookIdStr);
  const annotationMutations = useAnnotationMutations(bookIdStr);

  const [selectionPopup, setSelectionPopup] = useState<{
    position: { x: number; y: number };
    cfiRange: string;
    text: string;
  } | null>(null);

  const [noteDialogAnnotation, setNoteDialogAnnotation] = useState<BookAnnotation | null>(null);

  // Apply existing annotations as highlights
  const rehydrateAnnotations = useCallback((rendition: Rendition, anns: BookAnnotation[]) => {
    for (const ann of anns) {
      try {
        rendition.annotations.highlight(
          ann.cfiRange,
          { id: ann.id },
          () => {
            setNoteDialogAnnotation(ann);
          },
          `highlight-${ann.color}`
        );
      } catch {
        // Skip invalid CFI ranges
      }
    }
  }, []);

  // Rehydrate annotations whenever they change
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || annotations.length === 0) return;

    // Clear existing annotations first
    try {
      for (const ann of annotations) {
        try {
          rendition.annotations.remove(ann.cfiRange, 'highlight');
        } catch {
          // Ignore
        }
      }
    } catch {
      // Ignore
    }

    rehydrateAnnotations(rendition, annotations);
  }, [annotations, rehydrateAnnotations, renditionRef]);

  const handleCreateHighlight = useCallback(async (color: AnnotationColor) => {
    if (!selectionPopup) return;
    const rendition = renditionRef.current;
    if (!rendition) return;

    try {
      const annotation = await annotationMutations.create({
        bookId: bookIdStr,
        cfiRange: selectionPopup.cfiRange,
        text: selectionPopup.text,
        color,
        chapter: currentChapter,
      });

      rendition.annotations.highlight(
        selectionPopup.cfiRange,
        { id: annotation.id },
        () => setNoteDialogAnnotation(annotation),
        `highlight-${color}`
      );
    } catch (err) {
      console.error('Failed to create highlight:', err);
    }

    setSelectionPopup(null);
    // Clear selection in iframe
    try {
      const iframe = (rendition as unknown as { manager?: { container?: HTMLElement } })
        .manager?.container?.querySelector('iframe');
      iframe?.contentWindow?.getSelection()?.removeAllRanges();
    } catch {
      // Ignore
    }
  }, [selectionPopup, annotationMutations, bookIdStr, currentChapter, renditionRef]);

  const handleAddNote = useCallback((color: AnnotationColor) => {
    handleCreateHighlight(color).then(() => {
      // After creating, the annotation will be the last created one
    });
  }, [handleCreateHighlight]);

  const handleSaveNote = useCallback(async (id: string, note: string | null, color: AnnotationColor) => {
    try {
      await annotationMutations.update({ id, note, color });
    } catch (err) {
      console.error('Failed to update annotation:', err);
    }
  }, [annotationMutations]);

  const handleDeleteAnnotation = useCallback(async (id: string) => {
    const ann = annotations.find((a) => a.id === id);
    if (ann) {
      try {
        renditionRef.current?.annotations.remove(ann.cfiRange, 'highlight');
      } catch {
        // Ignore
      }
    }
    try {
      await annotationMutations.remove(id);
    } catch (err) {
      console.error('Failed to delete annotation:', err);
    }
  }, [annotations, annotationMutations, renditionRef]);

  const handleSelection = useCallback((cfiRange: string, text: string, position: { x: number; y: number }) => {
    if (!cfiRange) {
      setSelectionPopup(null);
      return;
    }
    setSelectionPopup({ cfiRange, text, position });
  }, []);

  const clearSelectionPopup = useCallback(() => {
    setSelectionPopup(null);
  }, []);

  return {
    annotations,
    selectionPopup,
    noteDialogAnnotation,
    setNoteDialogAnnotation,
    handleCreateHighlight,
    handleAddNote,
    handleSaveNote,
    handleDeleteAnnotation,
    handleSelection,
    clearSelectionPopup,
  };
}
