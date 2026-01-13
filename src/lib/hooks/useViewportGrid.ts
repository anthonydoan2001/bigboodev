import { useEffect, useRef, useState } from 'react';

interface UseViewportGridOptions {
  gap?: number;
  minCardWidth?: number;
  maxCardWidth?: number;
  cardAspectRatio?: number; // height/width ratio (e.g., 1.5 for 2/3 aspect)
  headerHeight?: number; // Space for nav, filters, etc.
  footerHeight?: number; // Space for pagination
  textHeightBelowCard?: number; // Height of text below card (title, year, etc.)
}

export function useViewportGrid({ 
  gap = 16, 
  minCardWidth = 120, 
  maxCardWidth = 280,
  cardAspectRatio = 1.5, // 2/3 aspect ratio
  headerHeight = 200, // Nav + filters + spacing
  footerHeight = 80, // Pagination + spacing
  textHeightBelowCard = 60, // Text below card (year + title)
}: UseViewportGridOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(200);
  const [columns, setColumns] = useState(6);
  const [rows, setRows] = useState(3);
  const [itemsPerPage, setItemsPerPage] = useState(18);

  useEffect(() => {
    const calculateGrid = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth === 0) return;
      
      // Calculate available viewport height
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - headerHeight - footerHeight;
      
      // Calculate how many columns fit
      const maxItemsWithMaxWidth = Math.floor((containerWidth + gap) / (maxCardWidth + gap));
      const maxItemsWithMinWidth = Math.floor((containerWidth + gap) / (minCardWidth + gap));
      
      // Find optimal column count (prefer larger cards)
      let targetColumns = Math.max(1, maxItemsWithMaxWidth);
      
      if (maxItemsWithMinWidth > maxItemsWithMaxWidth) {
        // Try to find sweet spot around 160-200px width
        const preferredWidth = 180;
        const preferredItems = Math.floor((containerWidth + gap) / (preferredWidth + gap));
        if (preferredItems > 0) {
          targetColumns = preferredItems;
        }
      }
      
      // Calculate card width
      const totalGaps = gap * (targetColumns - 1);
      let calculatedWidth = Math.floor((containerWidth - totalGaps) / targetColumns);
      calculatedWidth = Math.max(minCardWidth, Math.min(maxCardWidth, calculatedWidth));
      
      // Calculate card height based on aspect ratio
      const cardImageHeight = calculatedWidth * cardAspectRatio;
      // Total card height includes image + text below
      const totalCardHeight = cardImageHeight + textHeightBelowCard;
      
      // Calculate how many rows fit in available height
      const rowHeight = totalCardHeight + gap;
      const maxRows = Math.floor((availableHeight + gap) / rowHeight);
      const targetRows = Math.max(1, maxRows);
      
      // Calculate items per page
      const totalItems = targetColumns * targetRows;
      
      setItemWidth(calculatedWidth);
      setColumns(targetColumns);
      setRows(targetRows);
      setItemsPerPage(totalItems);
      
      // Set CSS variables
      if (containerRef.current) {
        containerRef.current.style.setProperty('--item-width', `${calculatedWidth}px`);
        containerRef.current.style.setProperty('grid-template-columns', `repeat(${targetColumns}, ${calculatedWidth}px)`);
      }
    };

    // Initial calculation
    const timeoutId = setTimeout(calculateGrid, 0);

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(calculateGrid);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Listen to window resize for viewport changes
    window.addEventListener('resize', calculateGrid);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateGrid);
    };
  }, [gap, minCardWidth, maxCardWidth, cardAspectRatio, headerHeight, footerHeight, textHeightBelowCard]);

  return { containerRef, itemWidth, columns, rows, itemsPerPage };
}
