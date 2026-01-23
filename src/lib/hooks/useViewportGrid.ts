import { useEffect, useRef, useState } from 'react';
import { useSidebar } from '@/lib/providers/SidebarProvider';

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

  // Get sidebar state to recalculate grid when sidebar toggles
  const { isCollapsed } = useSidebar();

  // Use consistent initial values for SSR and CSR to prevent hydration errors
  // These will be updated immediately on client mount via useEffect
  const [itemWidth, setItemWidth] = useState(200);
  const [columns, setColumns] = useState(6);
  const [rows, setRows] = useState(3);
  const [itemsPerPage, setItemsPerPage] = useState(18);
  const [isReady, setIsReady] = useState(false); // New: track if grid is ready to display
  const isCalculatingRef = useRef(false);
  const lastWidthRef = useRef(0);
  const lastHeightRef = useRef(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Calculate a better initial estimate based on viewport
    const getInitialEstimate = () => {
      if (typeof window === 'undefined') return { minWidth: 200, maxWidth: 280, gap: 16, preferredWidth: 200 };

      const windowWidth = window.innerWidth;
      const isMobile = windowWidth < 640;
      const isTablet = windowWidth >= 640 && windowWidth < 1024;

      // Estimate card width based on viewport - match calculateGrid logic exactly (20% larger)
      const estimatedGap = isMobile ? 12 : isTablet ? 14 : gap;
      const estimatedMinWidth = isMobile ? Math.min(minCardWidth, 168) : isTablet ? Math.min(minCardWidth, 240) : minCardWidth;
      const estimatedMaxWidth = isMobile ? Math.min(maxCardWidth, 264) : isTablet ? Math.min(maxCardWidth, 480) : maxCardWidth;

      // Account for sidebar width (same logic as setCSSFallback)
      let sidebarWidth = 0;
      if (!isMobile) {
        try {
          const sidebarCollapsed = localStorage.getItem('sidebar-collapsed');
          const isSidebarCollapsed = sidebarCollapsed ? JSON.parse(sidebarCollapsed) : false;
          sidebarWidth = isSidebarCollapsed ? 70 : 256;
        } catch {
          sidebarWidth = 70; // Default to collapsed
        }
      }

      // More accurate padding estimation + sidebar
      const pagePaddingX = isMobile ? 16 : isTablet ? 24 : 48;
      const availableWidth = windowWidth - sidebarWidth - pagePaddingX;

      // Calculate columns using same logic as calculateGrid
      const maxColumnsWithMaxWidth = Math.floor((availableWidth + estimatedGap) / (estimatedMaxWidth + estimatedGap));
      const maxColumnsWithMinWidth = Math.floor((availableWidth + estimatedGap) / (estimatedMinWidth + estimatedGap));

      let estimatedColumns = Math.max(1, maxColumnsWithMaxWidth);

      if (maxColumnsWithMinWidth > maxColumnsWithMaxWidth) {
        const preferredWidth = isMobile ? 192 : isTablet ? 300 : 360; // 20% larger
        const preferredColumns = Math.floor((availableWidth + estimatedGap) / (preferredWidth + estimatedGap));
        if (preferredColumns > 0) {
          estimatedColumns = preferredColumns;
        }
      }

      // Calculate actual card width
      const totalGaps = estimatedGap * (estimatedColumns - 1);
      let estimatedCardWidth = Math.floor((availableWidth - totalGaps) / estimatedColumns);
      estimatedCardWidth = Math.max(estimatedMinWidth, Math.min(estimatedMaxWidth, estimatedCardWidth));

      return {
        minWidth: estimatedMinWidth,
        maxWidth: estimatedMaxWidth,
        preferredWidth: estimatedCardWidth,
        gap: estimatedGap
      };
    };

    // Set CSS Grid fallback immediately for initial layout
    const setCSSFallback = () => {
      if (!containerRef.current) return;

      // Only run on client side
      if (typeof window === 'undefined') return;

      const estimate = getInitialEstimate();

      // Calculate estimated columns for initial layout - account for sidebar
      const windowWidth = window.innerWidth;
      const isMobile = windowWidth < 640;
      const isTablet = windowWidth >= 640 && windowWidth < 1024;

      // Check sidebar state from localStorage to calculate accurate available width
      let sidebarWidth = 0;
      if (!isMobile) {
        // Only desktop has visible sidebar (md: breakpoint is 768px)
        try {
          const sidebarCollapsed = localStorage.getItem('sidebar-collapsed');
          const isCollapsed = sidebarCollapsed ? JSON.parse(sidebarCollapsed) : (isMobile ? true : false);
          sidebarWidth = isCollapsed ? 70 : 256; // 70px collapsed, 256px (w-64) expanded
        } catch {
          sidebarWidth = 70; // Default to collapsed if can't read
        }
      }

      // More accurate padding estimation based on actual page layout
      // py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6
      const pagePaddingX = isMobile ? 16 : isTablet ? 24 : 48; // Left + Right padding
      const availableWidth = windowWidth - sidebarWidth - pagePaddingX;

      // Calculate columns with the same logic as calculateGrid
      const maxColumnsWithMaxWidth = Math.floor((availableWidth + estimate.gap) / (estimate.maxWidth + estimate.gap));
      const maxColumnsWithMinWidth = Math.floor((availableWidth + estimate.gap) / (estimate.minWidth + estimate.gap));

      let estimatedColumns = Math.max(1, maxColumnsWithMaxWidth);

      // If we can fit more items, try the preferred width
      if (maxColumnsWithMinWidth > maxColumnsWithMaxWidth) {
        const preferredColumns = Math.floor((availableWidth + estimate.gap) / (estimate.preferredWidth + estimate.gap));
        if (preferredColumns > 0) {
          estimatedColumns = preferredColumns;
        }
      }

      // Calculate actual card width to fit exactly
      const totalGaps = estimate.gap * (estimatedColumns - 1);
      let cardWidth = Math.floor((availableWidth - totalGaps) / estimatedColumns);
      cardWidth = Math.max(estimate.minWidth, Math.min(estimate.maxWidth, cardWidth));

      // Set CSS Grid fallback with calculated columns and width - with transitions disabled
      containerRef.current.classList.add('no-transition');
      containerRef.current.style.gridTemplateColumns = `repeat(${estimatedColumns}, ${cardWidth}px)`;
      containerRef.current.style.setProperty('--item-max-width', `${estimate.maxWidth}px`);
      containerRef.current.style.setProperty('--item-width', `${cardWidth}px`);
      containerRef.current.style.setProperty('gap', `${estimate.gap}px`);
      containerRef.current.style.width = '100%';
    };

    const calculateGrid = (forceRecalculate = false) => {
      // Only run on client side
      if (typeof window === 'undefined') return;
      if (!containerRef.current || isCalculatingRef.current) return;

      // Check multiple width sources for more reliable measurement
      const rect = containerRef.current.getBoundingClientRect();
      const clientWidth = containerRef.current.clientWidth;
      const offsetWidth = containerRef.current.offsetWidth;

      // Use the largest valid width (offsetWidth is most reliable for flex containers)
      let containerWidth = Math.max(rect.width, clientWidth, offsetWidth);

      // Get current viewport height to detect height changes
      const currentHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

      // Recalculate if width OR height changed significantly (within 10px threshold)
      // This ensures itemsPerPage updates when viewport height changes
      const widthChanged = Math.abs(containerWidth - lastWidthRef.current) >= 10;
      const heightChanged = Math.abs(currentHeight - lastHeightRef.current) >= 10;

      // Skip only if BOTH width and height haven't changed significantly AND we've already initialized
      // UNLESS forceRecalculate is true (used by window resize handler)
      if (!forceRecalculate && !widthChanged && !heightChanged && lastWidthRef.current > 0 && hasInitializedRef.current) {
        return;
      }

      // Run calculation immediately on first load to prevent flash of large cards
      // No delay needed - CSS fallback handles initial layout

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
      if (typeof window !== 'undefined') {
        lastHeightRef.current = window.innerHeight;
      }

      // Responsive breakpoints
      const isMobile = containerWidth < 640; // sm breakpoint
      const isTablet = containerWidth >= 640 && containerWidth < 1024; // md breakpoint

      // Responsive gap based on screen size - more compact
      const responsiveGap = isMobile ? Math.max(gap - 4, 6) : isTablet ? Math.max(gap - 2, 8) : gap;

      // Responsive card sizes based on screen size - 20% larger
      const responsiveMinWidth = isMobile ? Math.min(minCardWidth, 120) : isTablet ? Math.min(minCardWidth, 144) : minCardWidth;
      const responsiveMaxWidth = isMobile ? Math.min(maxCardWidth, 192) : isTablet ? Math.min(maxCardWidth, 240) : maxCardWidth;

      // Responsive header/footer heights for mobile - more compact
      const responsiveHeaderHeight = isMobile ? Math.max(headerHeight - 50, 100) : isTablet ? Math.max(headerHeight - 20, 130) : headerHeight;
      const responsiveFooterHeight = isMobile ? Math.max(footerHeight - 30, 40) : isTablet ? Math.max(footerHeight - 15, 50) : footerHeight;

      // Calculate available viewport height
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - responsiveHeaderHeight - responsiveFooterHeight;

      // Calculate how many columns fit
      const maxItemsWithMaxWidth = Math.floor((containerWidth + responsiveGap) / (responsiveMaxWidth + responsiveGap));
      const maxItemsWithMinWidth = Math.floor((containerWidth + responsiveGap) / (responsiveMinWidth + responsiveGap));

      // Find optimal column count (prefer larger cards)
      let targetColumns = Math.max(1, maxItemsWithMaxWidth);

      if (maxItemsWithMinWidth > maxItemsWithMaxWidth) {
        // Try to find sweet spot - responsive preferred width, 20% larger
        const preferredWidth = isMobile ? 156 : isTablet ? 180 : 192; // 20% increase
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
      // Total card height includes image + text below - more compact
      const responsiveTextHeight = isMobile ? Math.max(textHeightBelowCard - 15, 35) : isTablet ? Math.max(textHeightBelowCard - 10, 40) : textHeightBelowCard;
      const totalCardHeight = cardImageHeight + responsiveTextHeight;

      // Calculate how many rows fit in available height
      // Use minimal buffer to maximize items per page while preventing cut-off
      const rowHeight = totalCardHeight + responsiveGap;
      // Use a minimal buffer - reduce for compact layout
      const buffer = isMobile ? 10 : isTablet ? 15 : 20;
      const maxRows = Math.floor((availableHeight - buffer) / rowHeight);
      const targetRows = Math.max(1, maxRows);

      // Calculate items per page - dynamically calculated, no hard limits
      // This will vary based on viewport size: larger screens = more items, smaller screens = fewer items
      const totalItems = targetColumns * targetRows;

      // Debug logging
      console.log('🎯 Grid Calculation:', {
        containerWidth,
        viewportHeight,
        availableHeight,
        columns: targetColumns,
        rows: targetRows,
        cardWidth: calculatedWidth,
        cardHeight: totalCardHeight,
        itemsPerPage: totalItems,
        gap: responsiveGap
      });

      // Update state immediately - don't wait for requestAnimationFrame
      // This ensures React re-renders with new itemsPerPage value
      setItemWidth(calculatedWidth);
      setColumns(targetColumns);
      setRows(targetRows);
      setItemsPerPage(totalItems);

      // Set CSS variables and apply grid layout dynamically
      if (containerRef.current) {
        // Disable transitions on first calculation to prevent visible shift
        const isFirstCalculation = !hasInitializedRef.current;

        if (isFirstCalculation) {
          // Disable transitions for instant initial layout
          containerRef.current.classList.add('no-transition');
        }

        // Update CSS variables immediately for responsive behavior
        containerRef.current.style.setProperty('--item-width', `${calculatedWidth}px`);
        containerRef.current.style.setProperty('--item-max-width', `${responsiveMaxWidth}px`);
        containerRef.current.style.setProperty('gap', `${responsiveGap}px`);

        // CRITICAL: Set grid-template-columns dynamically based on calculated columns
        // This overrides the CSS class and makes the grid truly responsive
        containerRef.current.style.gridTemplateColumns = `repeat(${targetColumns}, ${calculatedWidth}px)`;

        // Ensure container takes full width
        containerRef.current.style.width = '100%';

        // Re-enable transitions after first calculation completes
        if (isFirstCalculation) {
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.classList.remove('no-transition');
            }
          });
        }

        // Use requestAnimationFrame only for marking as initialized
        requestAnimationFrame(() => {
          hasInitializedRef.current = true;
          isCalculatingRef.current = false;
          // Mark grid as ready to display after first calculation
          setIsReady(true);
        });
      } else {
        isCalculatingRef.current = false;
      }
    };

    // Check if container width is stable before calculating
    const checkStabilityAndCalculate = () => {
      // Only run on client side
      if (typeof window === 'undefined') return;
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
          calculateGrid(true); // Force recalculation on container resize
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

    // Set up fallback immediately - client-side only to prevent hydration errors
    // Set CSS fallback synchronously if container exists
    if (containerRef.current) {
      setCSSFallback();
    }

    // Also set it up as soon as it becomes available
    const checkAndSet = () => {
      if (containerRef.current && !containerRef.current.style.gridTemplateColumns) {
        setCSSFallback();
      }
    };
    requestAnimationFrame(checkAndSet);

    // Set up CSS fallback immediately - synchronously
    if (containerRef.current) {
      setCSSFallback();
    }

    // Set up observer and retry fallback after DOM is ready
    const observerTimeout = setTimeout(() => {
      setupFallbackAndObserver();
    }, 0);

    // Initial calculation - run immediately on client to prevent flash
    const timeouts: NodeJS.Timeout[] = [];

    // First attempt - truly immediate calculation on mount (client-side only)
    if (typeof window !== 'undefined' && containerRef.current) {
      // Synchronous calculation - no async delays for instant layout
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = Math.max(
        rect.width,
        containerRef.current.clientWidth,
        containerRef.current.offsetWidth
      );

      if (containerWidth >= 200) {
        // Container has valid width, calculate immediately
        calculateGrid(true);
      } else {
        // Container not ready yet, use microtask
        Promise.resolve().then(() => {
          calculateGrid(true);
        });
      }
    }

    // Listen to window resize for viewport changes with debouncing (client-side only)
    // This is critical for updating itemsPerPage when viewport height changes
    let windowResizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (windowResizeTimeout) clearTimeout(windowResizeTimeout);
      windowResizeTimeout = setTimeout(() => {
        // Force recalculation - bypass early return check
        // This ensures calculation always runs on window resize
        requestAnimationFrame(() => {
          calculateGrid(true); // Pass true to force recalculation
        });
      }, 150); // Slightly longer debounce for smoother animations
    };

    // Only add event listener on client side
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (observerTimeout) clearTimeout(observerTimeout);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (windowResizeTimeout) clearTimeout(windowResizeTimeout);
      resizeObserver.disconnect();
      // Only remove event listener on client side
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      isCalculatingRef.current = false;
    };
  }, [gap, minCardWidth, maxCardWidth, cardAspectRatio, headerHeight, footerHeight, textHeightBelowCard, isCollapsed]);

  // Separate effect to handle sidebar toggle - recalculate grid smoothly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasInitializedRef.current) return; // Skip on initial mount

    // Sidebar uses 500ms transition - sync grid animation with it
    // Multiple calculations during the transition for smooth adjustment
    const timeouts: NodeJS.Timeout[] = [];

    // Immediate calculation to start the transition
    timeouts.push(setTimeout(() => {
      lastWidthRef.current = 0;
      lastHeightRef.current = 0;
      window.dispatchEvent(new Event('resize'));
    }, 50)); // Small delay to let sidebar start animating

    // Mid-transition update for smoother animation
    timeouts.push(setTimeout(() => {
      lastWidthRef.current = 0;
      lastHeightRef.current = 0;
      window.dispatchEvent(new Event('resize'));
    }, 250)); // Halfway through sidebar animation

    // Final update after sidebar transition completes (500ms + buffer)
    timeouts.push(setTimeout(() => {
      lastWidthRef.current = 0;
      lastHeightRef.current = 0;
      window.dispatchEvent(new Event('resize'));
    }, 550)); // After sidebar animation completes

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isCollapsed]);

  // Handle tab visibility changes - recalculate when tab becomes visible (keep content visible)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden && hasInitializedRef.current) {
        // Tab became visible - keep isReady true, just recalculate layout
        // Use microtask for instant recalculation
        Promise.resolve().then(() => {
          lastWidthRef.current = 0;
          lastHeightRef.current = 0;
          window.dispatchEvent(new Event('resize'));
        });
      }
    };

    const handleFocus = () => {
      // Window gained focus - keep isReady true, just recalculate layout
      if (hasInitializedRef.current) {
        Promise.resolve().then(() => {
          lastWidthRef.current = 0;
          lastHeightRef.current = 0;
          window.dispatchEvent(new Event('resize'));
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Recalculate on mount - immediately, no visible shift
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Immediate calculation on mount - no setTimeout to prevent visual jump
    if (containerRef.current) {
      // Force immediate recalculation before first paint
      Promise.resolve().then(() => {
        lastWidthRef.current = 0;
        lastHeightRef.current = 0;

        // Directly call calculateGrid instead of dispatching resize event
        // This is faster and prevents the visual shift
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const containerWidth = Math.max(
            rect.width,
            containerRef.current.clientWidth,
            containerRef.current.offsetWidth
          );

          if (containerWidth >= 200) {
            // Container is ready, calculate immediately
            hasInitializedRef.current = false; // Reset to force recalculation
            window.dispatchEvent(new Event('resize'));
          }
        }
      });
    }
  }, []);

  return { containerRef, itemWidth, columns, rows, itemsPerPage, isReady };
}
