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
    const calculateWidth = () => {
      if (!containerRef.current) return;
      
      // Check if container has children before calculating
      if (containerRef.current.children.length === 0) return;
      
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth === 0) return;
      
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

    // Initial calculation
    const timeoutId = setTimeout(calculateWidth, 0);

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(calculateWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Fallback to window resize
    window.addEventListener('resize', calculateWidth);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateWidth);
    };
  }, [gap, minWidth, maxWidth, recalculateTrigger]);

  // Recalculate when trigger changes (e.g., when content loads)
  useEffect(() => {
    if (recalculateTrigger !== undefined && containerRef.current) {
      const calculateWidth = () => {
        if (!containerRef.current) return;
        
        const containerWidth = containerRef.current.clientWidth;
        if (containerWidth === 0) return;
        
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
