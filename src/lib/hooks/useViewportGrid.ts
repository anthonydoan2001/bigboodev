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
  const isCalculatingRef = useRef(false);
  const lastWidthRef = useRef(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Calculate a better initial estimate based on viewport
    const getInitialEstimate = () => {
      if (typeof window === 'undefined') return { minWidth: 200, maxWidth: 280, gap: 16, preferredWidth: 200 };
      
      const windowWidth = window.innerWidth;
      const isMobile = windowWidth < 640;
      const isTablet = windowWidth >= 640 && windowWidth < 1024;
      
      // Estimate card width based on viewport - try to match what calculateGrid will produce
      const estimatedGap = isMobile ? 12 : isTablet ? 14 : gap;
      const estimatedMinWidth = isMobile ? Math.min(minCardWidth, 140) : isTablet ? Math.min(minCardWidth, 200) : minCardWidth;
      const estimatedMaxWidth = isMobile ? Math.min(maxCardWidth, 220) : isTablet ? Math.min(maxCardWidth, 400) : maxCardWidth;
      
      // Estimate how many columns would fit - aim for a reasonable size
      const preferredWidth = isMobile ? 160 : isTablet ? 250 : 300;
      const estimatedColumns = Math.max(1, Math.floor((windowWidth - 64) / (preferredWidth + estimatedGap))); // 64px for padding
      const estimatedCardWidth = Math.floor(((windowWidth - 64) - (estimatedGap * (estimatedColumns - 1))) / estimatedColumns);
      const clampedWidth = Math.max(estimatedMinWidth, Math.min(estimatedMaxWidth, estimatedCardWidth));
      
      return {
        minWidth: estimatedMinWidth,
        maxWidth: estimatedMaxWidth,
        preferredWidth: clampedWidth,
        gap: estimatedGap
      };
    };

    // Set CSS Grid fallback immediately for initial layout
    const setCSSFallback = () => {
      if (!containerRef.current) return;
      
      const estimate = getInitialEstimate();
      
      // Set CSS Grid fallback that will work immediately - use the estimated preferred width
      // This prevents the flash of small cards
      containerRef.current.style.setProperty(
        'grid-template-columns',
        `repeat(auto-fit, minmax(${estimate.preferredWidth}px, 1fr))`
      );
      containerRef.current.style.setProperty('--item-max-width', `${estimate.maxWidth}px`);
      containerRef.current.style.setProperty('--item-width', `${estimate.preferredWidth}px`);
      containerRef.current.style.setProperty('gap', `${estimate.gap}px`);
      containerRef.current.style.width = '100%';
    };

    const calculateGrid = () => {
      if (!containerRef.current || isCalculatingRef.current) return;
      
      // Check multiple width sources for more reliable measurement
      const rect = containerRef.current.getBoundingClientRect();
      const clientWidth = containerRef.current.clientWidth;
      const offsetWidth = containerRef.current.offsetWidth;
      
      // Use the largest valid width (offsetWidth is most reliable for flex containers)
      let containerWidth = Math.max(rect.width, clientWidth, offsetWidth);
      
      // Skip if width hasn't changed significantly (within 10px) to prevent unnecessary recalculations
      // Also skip if we haven't initialized yet and width seems reasonable
      if (Math.abs(containerWidth - lastWidthRef.current) < 10 && lastWidthRef.current > 0) {
        return;
      }
      
      // If this is the first calculation, delay slightly to let CSS-based initial layout render
      // This prevents the flash of small cards before JavaScript kicks in
      if (!hasInitializedRef.current) {
        setTimeout(() => {
          if (containerRef.current && !hasInitializedRef.current) {
            calculateGrid();
          }
        }, 150);
        return;
      }
      
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
      
      isCalculatingRef.current = true;
      lastWidthRef.current = containerWidth;
      
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
        // Use requestAnimationFrame to batch style updates and prevent layout thrashing
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          
          containerRef.current.style.setProperty('--item-width', `${calculatedWidth}px`);
          containerRef.current.style.setProperty('--item-max-width', `${responsiveMaxWidth}px`);
          // Use auto-fit with 1fr to ensure cards fill the full width
          // Cards will maintain minimum size but expand to fill available space
          // The cards themselves will respect max-width via CSS variable
          containerRef.current.style.setProperty('grid-template-columns', `repeat(auto-fit, minmax(${calculatedWidth}px, 1fr))`);
          containerRef.current.style.setProperty('gap', `${responsiveGap}px`);
          // Ensure container takes full width
          containerRef.current.style.width = '100%';
          
          hasInitializedRef.current = true;
          isCalculatingRef.current = false;
        });
      } else {
        isCalculatingRef.current = false;
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

    // Use ResizeObserver for responsive updates with debouncing
    let resizeTimeout: NodeJS.Timeout | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      // Only recalculate if we've already initialized and container size actually changed
      if (!hasInitializedRef.current) return;
      
      // Debounce resize calculations to prevent excessive recalculations
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          calculateGrid();
        });
      }, 200); // Wait 200ms after resize stops to prevent flickering
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
    
    // Set up fallback immediately - this prevents initial layout shift
    // Use a microtask to ensure DOM is ready but before paint
    if (typeof window !== 'undefined') {
      // Set initial state immediately based on viewport
      const initialEstimate = getInitialEstimate();
      setItemWidth(initialEstimate.preferredWidth);
      
      // Set CSS fallback synchronously if container exists
      if (containerRef.current) {
        setCSSFallback();
      } else {
        // If container doesn't exist yet, set it up as soon as it's available
        const checkAndSet = () => {
          if (containerRef.current) {
            setCSSFallback();
          } else {
            requestAnimationFrame(checkAndSet);
          }
        };
        requestAnimationFrame(checkAndSet);
      }
    }
    
    // Set up observer after a short delay to ensure DOM is ready
    const observerTimeout = setTimeout(() => {
      setupFallbackAndObserver();
    }, 50);

    // Initial calculation with stability check - reduced retries to prevent flickering
    const timeouts: NodeJS.Timeout[] = [];
    
    // Try after a short delay to let layout settle
    timeouts.push(setTimeout(() => {
      requestAnimationFrame(() => {
        checkStabilityAndCalculate();
      });
    }, 100));
    
    // Retry after layout is likely complete
    timeouts.push(setTimeout(() => {
      requestAnimationFrame(() => {
        checkStabilityAndCalculate();
      });
    }, 300));

    // Listen to window resize for viewport changes with debouncing
    let windowResizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (windowResizeTimeout) clearTimeout(windowResizeTimeout);
      windowResizeTimeout = setTimeout(() => {
        requestAnimationFrame(calculateGrid);
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (observerTimeout) clearTimeout(observerTimeout);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (windowResizeTimeout) clearTimeout(windowResizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      isCalculatingRef.current = false;
    };
  }, [gap, minCardWidth, maxCardWidth, cardAspectRatio, headerHeight, footerHeight, textHeightBelowCard]);

  return { containerRef, itemWidth, columns, rows, itemsPerPage };
}
