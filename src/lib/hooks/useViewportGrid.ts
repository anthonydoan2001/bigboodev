import { useCallback, useEffect, useRef, useState } from 'react';

interface UseGridPaginationOptions {
  gap?: number;
  cardAspectRatio?: number;
  headerHeight?: number;
  textHeightBelowCard?: number;
}

export function useViewportGrid({
  gap = 8,
  cardAspectRatio = 1.5,
  headerHeight = 160,
  textHeightBelowCard = 45,
}: UseGridPaginationOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerPage, setItemsPerPage] = useState(18);

  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Read actual column count from the resolved CSS grid
    const cols = getComputedStyle(el).gridTemplateColumns.split(' ').length;

    // Measure one cell width to derive card height
    const cellWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth
      : el.offsetWidth / cols;

    const cardHeight = cellWidth * cardAspectRatio + textHeightBelowCard + gap;
    const available = window.innerHeight - headerHeight;
    const rows = Math.max(1, Math.floor(available / cardHeight));

    setItemsPerPage(cols * rows);
  }, [cardAspectRatio, headerHeight, textHeightBelowCard, gap]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial calc after first paint
    requestAnimationFrame(recalculate);

    const ro = new ResizeObserver(() => recalculate());
    ro.observe(el);

    const onResize = () => recalculate();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [recalculate]);

  return { containerRef, itemsPerPage };
}
