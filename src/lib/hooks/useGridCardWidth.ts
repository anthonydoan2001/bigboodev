import { useEffect, useRef, useState } from 'react';

interface UseGridCardWidthOptions {
  gap?: number;
  minWidth?: number;
  maxWidth?: number;
  recalculateTrigger?: number | string; // Trigger recalculation when this changes
}

export function useGridCardWidth({ 
  gap = 16, 
  minWidth = 120, 
  maxWidth = 280,
  recalculateTrigger
}: UseGridCardWidthOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(200);
  const [columns, setColumns] = useState(6);

  useEffect(() => {
    // Set CSS Grid fallback immediately for initial layout
    const setCSSFallback = () => {
      if (!containerRef.current) return;
      
      // Get responsive min width for fallback
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const isMobile = windowWidth < 640;
      const isTablet = windowWidth >= 640 && windowWidth < 1024;
      const fallbackMinWidth = isMobile ? 120 : isTablet ? 150 : Math.min(minWidth, 200);
      
      // Set CSS Grid fallback that will work immediately
      containerRef.current.style.setProperty(
        'grid-template-columns',
        `repeat(auto-fill, minmax(${fallbackMinWidth}px, 1fr))`
      );
    };

    const calculateWidth = () => {
      if (!containerRef.current) return;
      
      // Check if container has children before calculating
      if (containerRef.current.children.length === 0) return;
      
      // Check multiple width sources for more reliable measurement
      const rect = containerRef.current.getBoundingClientRect();
      const clientWidth = containerRef.current.clientWidth;
      const offsetWidth = containerRef.current.offsetWidth;
      
      // Use the largest valid width (offsetWidth is most reliable for flex containers)
      let containerWidth = Math.max(rect.width, clientWidth, offsetWidth);
      
      // Wait for container to have a reasonable width
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
        
        if (containerWidth < 200) {
          return;
        }
      }
      
      // Use same calculation logic as carousel
      // Calculate how many items can fit with maximum width (prefer larger items)
      const maxItemsWithMaxWidth = Math.floor((containerWidth + gap) / (maxWidth + gap));
      
      // Calculate how many items can fit with minimum width
      const maxItemsWithMinWidth = Math.floor((containerWidth + gap) / (minWidth + gap));
      
      // Prefer showing fewer, larger items to fill the space better
      // Start with maxWidth calculation and work down if needed
      let targetColumns = Math.max(1, maxItemsWithMaxWidth);
      
      // If we can fit more items, try to find a sweet spot
      // But prioritize larger items over more items
      if (maxItemsWithMinWidth > maxItemsWithMaxWidth) {
        // Try to find optimal number between min and max
        // Aim for items around 180-220px width for good balance
        const preferredWidth = 200;
        const preferredItems = Math.floor((containerWidth + gap) / (preferredWidth + gap));
        if (preferredItems > 0) {
          targetColumns = preferredItems;
        }
      }
      
      // Calculate width to fit exactly that many items
      const totalGaps = gap * (targetColumns - 1);
      let calculatedWidth = Math.floor((containerWidth - totalGaps) / targetColumns);
      
      // Clamp to min/max bounds (same as carousel)
      calculatedWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
      
      setItemWidth(calculatedWidth);
      setColumns(targetColumns);
      
      // Set CSS variable on container
      if (containerRef.current) {
        containerRef.current.style.setProperty('--item-width', `${calculatedWidth}px`);
        // Use exact pixel widths instead of 1fr to prevent items from being cutoff
        containerRef.current.style.setProperty('grid-template-columns', `repeat(${targetColumns}, ${calculatedWidth}px)`);
      }
    };

    // Check if container width is stable before calculating
    const checkStabilityAndCalculate = () => {
      if (!containerRef.current) return;
      if (containerRef.current.children.length === 0) return;
      
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
          calculateWidth();
        } else if (width1 < 200 || Math.abs(width1 - width2) >= 5) {
          // Width is still changing or too small, retry
          setTimeout(checkStabilityAndCalculate, 100);
        }
      }, 50);
    };

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        calculateWidth();
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
    const timeouts: NodeJS.Timeout[] = [];
    timeouts.push(setTimeout(() => requestAnimationFrame(checkStabilityAndCalculate), 0));
    timeouts.push(setTimeout(() => requestAnimationFrame(checkStabilityAndCalculate), 100));
    timeouts.push(setTimeout(() => requestAnimationFrame(checkStabilityAndCalculate), 250));
    timeouts.push(setTimeout(() => requestAnimationFrame(checkStabilityAndCalculate), 500));

    // Fallback to window resize
    const handleResize = () => {
      requestAnimationFrame(calculateWidth);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [gap, minWidth, maxWidth, recalculateTrigger]);

  // Recalculate when trigger changes (e.g., when content loads)
  useEffect(() => {
    if (recalculateTrigger !== undefined && containerRef.current) {
      const calculateWidth = () => {
        if (!containerRef.current) return;
        
        // Check multiple width sources for more reliable measurement
        const rect = containerRef.current.getBoundingClientRect();
        const clientWidth = containerRef.current.clientWidth;
        const offsetWidth = containerRef.current.offsetWidth;
        
        // Use the largest valid width (offsetWidth is most reliable for flex containers)
        let containerWidth = Math.max(rect.width, clientWidth, offsetWidth);
        
        // Wait for container to have a reasonable width
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
          
          if (containerWidth < 200) {
            return;
          }
        }
        
        const maxItemsWithMaxWidth = Math.floor((containerWidth + gap) / (maxWidth + gap));
        const maxItemsWithMinWidth = Math.floor((containerWidth + gap) / (minWidth + gap));
        
        let targetColumns = Math.max(1, maxItemsWithMaxWidth);
        
        if (maxItemsWithMinWidth > maxItemsWithMaxWidth) {
          const preferredWidth = 200;
          const preferredItems = Math.floor((containerWidth + gap) / (preferredWidth + gap));
          if (preferredItems > 0) {
            targetColumns = preferredItems;
          }
        }
        
        const totalGaps = gap * (targetColumns - 1);
        let calculatedWidth = Math.floor((containerWidth - totalGaps) / targetColumns);
        calculatedWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
        
        if (containerRef.current) {
          containerRef.current.style.setProperty('--item-width', `${calculatedWidth}px`);
          // Use exact pixel widths instead of 1fr to prevent items from being cutoff
          containerRef.current.style.setProperty('grid-template-columns', `repeat(${targetColumns}, ${calculatedWidth}px)`);
        }
      };
      
      // Check if container has children before calculating
      if (containerRef.current.children.length === 0) {
        // If no children, wait a bit longer
        const timeoutId = setTimeout(() => {
          if (containerRef.current && containerRef.current.children.length > 0) {
            calculateWidth();
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
      
      // Use multiple timeouts to ensure DOM has updated
      const timeoutId1 = setTimeout(calculateWidth, 0);
      const timeoutId2 = setTimeout(calculateWidth, 100);
      const timeoutId3 = setTimeout(calculateWidth, 300);
      const timeoutId4 = setTimeout(calculateWidth, 500);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
        clearTimeout(timeoutId4);
      };
    }
  }, [recalculateTrigger, gap, minWidth, maxWidth]);

  return { containerRef, itemWidth, columns };
}
