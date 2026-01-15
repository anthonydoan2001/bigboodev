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
    // Set CSS Grid fallback immediately for initial layout
    const setCSSFallback = () => {
      if (!containerRef.current) return;
      
      // Get responsive min width for fallback
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const isMobile = windowWidth < 640;
      const isTablet = windowWidth >= 640 && windowWidth < 1024;
      const fallbackMinWidth = isMobile ? 140 : isTablet ? 200 : Math.min(minCardWidth, 280);
      
      // Set CSS Grid fallback that will work immediately
      containerRef.current.style.setProperty(
        'grid-template-columns',
        `repeat(auto-fill, minmax(${fallbackMinWidth}px, 1fr))`
      );
    };

    const calculateGrid = () => {
      if (!containerRef.current) return;
      
      // Check multiple width sources for more reliable measurement
      const rect = containerRef.current.getBoundingClientRect();
      const clientWidth = containerRef.current.clientWidth;
      const offsetWidth = containerRef.current.offsetWidth;
      
      // Use the largest valid width (offsetWidth is most reliable for flex containers)
      let containerWidth = Math.max(rect.width, clientWidth, offsetWidth);
      
      // If container width is still too small, try to get a better measurement
      if (containerWidth < 200) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const parentOffsetWidth = parent.offsetWidth;
          const parentWidth = Math.max(parentRect.width, parent.clientWidth, parentOffsetWidth);
          if (parentWidth > containerWidth && parentWidth >= 200) {
            containerWidth = parentWidth;
          }
        }
        
        // If still too small, wait for proper sizing
        if (containerWidth < 200) {
          return;
        }
      }
      
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
      
      // Set CSS variables and fine-tune grid
      if (containerRef.current) {
        containerRef.current.style.setProperty('--item-width', `${calculatedWidth}px`);
        // Use auto-fill with calculated width to allow wrapping to next row when needed
        // Cards will maintain consistent size and wrap automatically if they don't fit
        containerRef.current.style.setProperty('grid-template-columns', `repeat(auto-fill, minmax(${calculatedWidth}px, ${calculatedWidth}px))`);
        containerRef.current.style.setProperty('gap', `${responsiveGap}px`);
      }
    };

    // Check if container width is stable before calculating
    const checkStabilityAndCalculate = () => {
      if (!containerRef.current) return;
      
      const width1 = Math.max(
        containerRef.current.getBoundingClientRect().width,
        containerRef.current.clientWidth,
        containerRef.current.offsetWidth
      );
      
      // Check again after a short delay to ensure width is stable
      setTimeout(() => {
        if (!containerRef.current) return;
        
        const width2 = Math.max(
          containerRef.current.getBoundingClientRect().width,
          containerRef.current.clientWidth,
          containerRef.current.offsetWidth
        );
        
        // If width is stable (within 5px), proceed with calculation
        if (Math.abs(width1 - width2) < 5 && width1 >= 200) {
          calculateGrid();
        } else if (width1 < 200 || Math.abs(width1 - width2) >= 5) {
          // Width is still changing or too small, retry
          setTimeout(checkStabilityAndCalculate, 100);
        }
      }, 50);
    };

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        calculateGrid();
      });
    });
    
    // Set CSS fallback immediately and whenever container becomes available
    const setupFallbackAndObserver = () => {
      if (containerRef.current) {
        setCSSFallback();
        
        if (!containerRef.current.dataset.observed) {
          resizeObserver.observe(containerRef.current);
          containerRef.current.dataset.observed = 'true';
        }
      }
    };
    
    // Set up fallback and observer immediately and after delays
    setupFallbackAndObserver();
    setTimeout(setupFallbackAndObserver, 0);
    setTimeout(setupFallbackAndObserver, 50);
    setTimeout(setupFallbackAndObserver, 150);

    // Initial calculation with stability check
    // This ensures the grid calculates only when container has stable dimensions
    const timeouts: NodeJS.Timeout[] = [];
    
    // Try immediately with stability check
    timeouts.push(setTimeout(() => {
      requestAnimationFrame(checkStabilityAndCalculate);
    }, 0));
    
    // Retry after a short delay
    timeouts.push(setTimeout(() => {
      requestAnimationFrame(checkStabilityAndCalculate);
    }, 100));
    
    // Retry after a longer delay (for slow renders)
    timeouts.push(setTimeout(() => {
      requestAnimationFrame(checkStabilityAndCalculate);
    }, 250));
    
    // Retry after layout is likely complete
    timeouts.push(setTimeout(() => {
      requestAnimationFrame(checkStabilityAndCalculate);
    }, 500));

    // Listen to window resize for viewport changes
    const handleResize = () => {
      requestAnimationFrame(calculateGrid);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [gap, minCardWidth, maxCardWidth, cardAspectRatio, headerHeight, footerHeight, textHeightBelowCard]);

  return { containerRef, itemWidth, columns, rows, itemsPerPage };
}
