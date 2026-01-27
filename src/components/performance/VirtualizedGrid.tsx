'use client';

import { Grid } from 'react-window';
import { useCallback, useRef, useEffect, useState, memo, useMemo, CSSProperties, ReactElement } from 'react';

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columnWidth: number;
  rowHeight: number;
  gap?: number;
  className?: string;
  overscanCount?: number;
}

/**
 * VirtualizedGrid - High-performance virtualized grid using react-window v2
 *
 * Performance benefits:
 * - Only renders visible items (reduces DOM nodes by 90%+ for large lists)
 * - O(1) scroll performance regardless of list size
 * - Reduces memory usage significantly for 100+ item lists
 *
 * Use when:
 * - List has 50+ items
 * - Items have consistent heights
 * - Smooth scrolling is critical
 */
export const VirtualizedGrid = memo(function VirtualizedGrid<T>({
  items,
  renderItem,
  columnWidth,
  rowHeight,
  gap = 8,
  className = '',
  overscanCount = 2,
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate grid dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    updateDimensions();

    // Use ResizeObserver for efficient resize handling
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate columns based on container width
  const columnCount = useMemo(() => {
    if (dimensions.width === 0) return 1;
    return Math.max(1, Math.floor((dimensions.width + gap) / (columnWidth + gap)));
  }, [dimensions.width, columnWidth, gap]);

  // Calculate row count
  const rowCount = useMemo(() => {
    return Math.ceil(items.length / columnCount);
  }, [items.length, columnCount]);

  // Cell component for the grid
  const Cell = useCallback(({
    columnIndex,
    rowIndex,
    style,
  }: {
    ariaAttributes: { 'aria-colindex': number; role: 'gridcell' };
    columnIndex: number;
    rowIndex: number;
    style: CSSProperties;
  }): ReactElement | null => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= items.length) return null;

    const item = items[index];

    return (
      <div
        style={{
          ...style,
          paddingLeft: gap / 2,
          paddingRight: gap / 2,
          paddingTop: gap / 2,
          paddingBottom: gap / 2,
          boxSizing: 'border-box',
        }}
      >
        {renderItem(item, index)}
      </div>
    );
  }, [items, columnCount, gap, renderItem]);

  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div ref={containerRef} className={`w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth + gap}
        rowCount={rowCount}
        rowHeight={rowHeight + gap}
        cellComponent={Cell}
        cellProps={{}}
        defaultWidth={dimensions.width}
        defaultHeight={dimensions.height}
        overscanCount={overscanCount}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ width: dimensions.width, height: dimensions.height }}
      />
    </div>
  );
}) as <T>(props: VirtualizedGridProps<T>) => React.ReactElement;

export default VirtualizedGrid;
