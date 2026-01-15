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
      
      // Responsive breakpoints
      const isMobile = containerWidth < 640; // sm breakpoint
      const isTablet = containerWidth >= 640 && containerWidth < 1024; // md breakpoint
      
      // Responsive gap based on screen size
      const responsiveGap = isMobile ? 12 : isTablet ? 14 : gap;
      
      // Responsive card sizes based on screen size
      const responsiveMinWidth = isMobile ? Math.min(minCardWidth, 140) : isTablet ? Math.min(minCardWidth, 200) : minCardWidth;
      const responsiveMaxWidth = isMobile ? Math.min(maxCardWidth, 220) : isTablet ? Math.min(maxCardWidth, 400) : maxCardWidth;
      
      // Responsive header/footer heights for mobile
      const responsiveHeaderHeight = isMobile ? Math.max(headerHeight - 40, 120) : headerHeight;
      const responsiveFooterHeight = isMobile ? Math.max(footerHeight - 20, 60) : footerHeight;
      
      // Calculate available viewport height
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - responsiveHeaderHeight - responsiveFooterHeight;
      
      // Calculate how many columns fit
      const maxItemsWithMaxWidth = Math.floor((containerWidth + responsiveGap) / (responsiveMaxWidth + responsiveGap));
      const maxItemsWithMinWidth = Math.floor((containerWidth + responsiveGap) / (responsiveMinWidth + responsiveGap));
      
      // Find optimal column count (prefer larger cards)
      let targetColumns = Math.max(1, maxItemsWithMaxWidth);
      
      if (maxItemsWithMinWidth > maxItemsWithMaxWidth) {
        // Try to find sweet spot - responsive preferred width
        const preferredWidth = isMobile ? 160 : isTablet ? 250 : 300;
        const preferredItems = Math.floor((containerWidth + responsiveGap) / (preferredWidth + responsiveGap));
        if (preferredItems > 0) {
          targetColumns = preferredItems;
        }
      }
      
      // Calculate card width
      const totalGaps = responsiveGap * (targetColumns - 1);
      let calculatedWidth = Math.floor((containerWidth - totalGaps) / targetColumns);
      calculatedWidth = Math.max(responsiveMinWidth, Math.min(responsiveMaxWidth, calculatedWidth));
      
      // Calculate card height based on aspect ratio
      const cardImageHeight = calculatedWidth * cardAspectRatio;
      // Total card height includes image + text below
      const responsiveTextHeight = isMobile ? Math.max(textHeightBelowCard - 10, 50) : textHeightBelowCard;
      const totalCardHeight = cardImageHeight + responsiveTextHeight;
      
      // Calculate how many rows fit in available height
      const rowHeight = totalCardHeight + responsiveGap;
      const maxRows = Math.floor((availableHeight + responsiveGap) / rowHeight);
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
        // Use auto-fill with calculated width to allow wrapping to next row when needed
        // Cards will maintain consistent size and wrap automatically if they don't fit
        containerRef.current.style.setProperty('grid-template-columns', `repeat(auto-fill, minmax(${calculatedWidth}px, ${calculatedWidth}px))`);
        containerRef.current.style.setProperty('gap', `${responsiveGap}px`);
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
