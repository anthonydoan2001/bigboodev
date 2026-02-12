import { useEffect, useMemo, useRef, useState } from 'react';

const PAGE_GAP = 8;
const PADDING_X_SM = 16;
const PADDING_X_LG = 32;

export type ViewMode = 'scroll' | 'single' | 'double';
export type ZoomMode = 'fit-width' | 'fit-page' | 'custom';

interface UsePdfScaleOptions {
  defaultPageSize: { width: number; height: number } | null;
  viewMode: ViewMode;
  zoomMode: ZoomMode;
  customZoom: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function usePdfScale({
  defaultPageSize,
  viewMode,
  zoomMode,
  customZoom,
  scrollContainerRef,
}: UsePdfScaleOptions) {
  const [containerWidth, setContainerWidth] = useState(0);
  const prevScaleRef = useRef(0);
  const prevViewModeRef = useRef<string>('');

  // Auto-downgrade double to single on narrow screens
  const effectiveViewMode = useMemo(() => {
    if (viewMode === 'double' && containerWidth > 0 && containerWidth < 600) {
      return 'single' as const;
    }
    return viewMode;
  }, [viewMode, containerWidth]);

  const effectiveIsPageMode = effectiveViewMode === 'single' || effectiveViewMode === 'double';

  const scale = useMemo(() => {
    if (!defaultPageSize || containerWidth === 0) return 1;
    const paddingX = containerWidth < 640 ? PADDING_X_SM : PADDING_X_LG;
    const availWidth = containerWidth - paddingX;
    const pageWidthDivisor = effectiveViewMode === 'double'
      ? defaultPageSize.width * 2 + PAGE_GAP
      : defaultPageSize.width;

    switch (zoomMode) {
      case 'fit-width':
        return availWidth / pageWidthDivisor;
      case 'fit-page': {
        const containerH = scrollContainerRef.current?.clientHeight || window.innerHeight;
        const paddingV = containerWidth < 640 ? 16 : 32;
        return Math.min(
          availWidth / pageWidthDivisor,
          (containerH - paddingV) / defaultPageSize.height
        );
      }
      case 'custom':
        return customZoom / 100;
      default:
        return availWidth / pageWidthDivisor;
    }
  }, [zoomMode, customZoom, containerWidth, defaultPageSize, effectiveViewMode, scrollContainerRef]);

  const scaledWidth = defaultPageSize ? Math.floor(defaultPageSize.width * scale) : 0;
  const scaledHeight = defaultPageSize ? Math.floor(defaultPageSize.height * scale) : 0;
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const scaleKey = `${scale.toFixed(4)}-${dpr}`;

  // Container resize observer
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  return {
    containerWidth,
    effectiveViewMode,
    effectiveIsPageMode,
    scale,
    scaledWidth,
    scaledHeight,
    dpr,
    scaleKey,
    prevScaleRef,
    prevViewModeRef,
  };
}

export { PAGE_GAP };
export const PADDING_Y = 16;
