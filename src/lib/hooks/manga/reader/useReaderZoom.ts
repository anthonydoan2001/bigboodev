import { useEffect, useRef, useCallback } from 'react';
import { useMangaStore, useSeriesZoom } from '@/lib/stores/manga-store';

interface UseReaderZoomOptions {
  seriesId: string;
  isPageMode: boolean;
  currentPage: number;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  pageRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}

export function useReaderZoom({
  seriesId,
  isPageMode,
  currentPage,
  scrollContainerRef,
  pageRefs,
}: UseReaderZoomOptions) {
  const { setSeriesZoom } = useMangaStore();
  const zoom = useSeriesZoom(seriesId);
  const zoomPercentage = Math.round(zoom * 100);
  const prevZoomRef = useRef<number | null>(null);

  const centerScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    const scrollTop = (container.scrollHeight - container.clientHeight) / 2;

    container.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: 'instant'
    });
  }, [scrollContainerRef]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(2, zoom + 0.1);
    setSeriesZoom(seriesId, newZoom);
  }, [zoom, seriesId, setSeriesZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.5, zoom - 0.1);
    setSeriesZoom(seriesId, newZoom);
  }, [zoom, seriesId, setSeriesZoom]);

  // Preserve scroll position when zoom changes
  useEffect(() => {
    if (prevZoomRef.current === null) {
      prevZoomRef.current = zoom;
      return;
    }

    if (prevZoomRef.current === zoom) return;

    if (isPageMode) {
      prevZoomRef.current = zoom;
      if (zoom > 1) {
        requestAnimationFrame(() => centerScrollPosition());
      }
      return;
    }

    const currentPageEl = pageRefs.current.get(currentPage);
    if (currentPageEl) {
      requestAnimationFrame(() => {
        currentPageEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    }

    prevZoomRef.current = zoom;
  }, [zoom, currentPage, isPageMode, centerScrollPosition, pageRefs]);

  return {
    zoom,
    zoomPercentage,
    handleZoomIn,
    handleZoomOut,
    centerScrollPosition,
  };
}
