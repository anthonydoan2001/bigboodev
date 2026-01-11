'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/providers/SidebarProvider';

interface CarouselProps {
  children: ReactNode;
  title: string;
  count: number;
  icon?: ReactNode;
  showMoreLink?: string;
  totalCount?: number; // Total count including items not shown
}

export function Carousel({ children, title, count, icon, showMoreLink, totalCount }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [itemWidth, setItemWidth] = useState(200);
  const { isCollapsed } = useSidebar();

  const calculateItemWidth = () => {
    if (!scrollRef.current) return;
    
    const containerWidth = scrollRef.current.clientWidth;
    if (containerWidth === 0) return; // Not yet rendered
    
    const gap = 16; // gap-4 = 16px
    const minWidth = 120; // Minimum width for very small screens
    const maxWidth = 280; // Maximum width - increased to fill more space
    
    // Calculate how many items can fit with maximum width (prefer larger items)
    const maxItemsWithMaxWidth = Math.floor((containerWidth + gap) / (maxWidth + gap));
    
    // Calculate how many items can fit with minimum width
    const maxItemsWithMinWidth = Math.floor((containerWidth + gap) / (minWidth + gap));
    
    // Prefer showing fewer, larger items to fill the space better
    // Start with maxWidth calculation and work down if needed
    let targetItems = Math.max(1, maxItemsWithMaxWidth);
    
    // If we can fit more items, try to find a sweet spot
    // But prioritize larger items over more items
    if (maxItemsWithMinWidth > maxItemsWithMaxWidth) {
      // Try to find optimal number between min and max
      // Aim for items around 180-220px width for good balance
      const preferredWidth = 200;
      const preferredItems = Math.floor((containerWidth + gap) / (preferredWidth + gap));
      if (preferredItems > 0) {
        targetItems = preferredItems;
      }
    }
    
    // Calculate width to fit exactly that many items
    const totalGaps = gap * (targetItems - 1);
    let calculatedWidth = Math.floor((containerWidth - totalGaps) / targetItems);
    
    // Clamp to min/max bounds
    calculatedWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
    
    // Verify: ensure the calculated width fits perfectly
    const totalWidth = (calculatedWidth * targetItems) + (gap * (targetItems - 1));
    if (totalWidth <= containerWidth + 2) { // Allow 2px tolerance for rounding
      setItemWidth(calculatedWidth);
      if (scrollRef.current) {
        scrollRef.current.style.setProperty('--item-width', `${calculatedWidth}px`);
      }
    } else {
      // If it doesn't fit, reduce by 1 item and recalculate
      const adjustedItems = Math.max(1, targetItems - 1);
      const adjustedGaps = gap * (adjustedItems - 1);
      const adjustedWidth = Math.floor((containerWidth - adjustedGaps) / adjustedItems);
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, adjustedWidth));
      
      setItemWidth(finalWidth);
      if (scrollRef.current) {
        scrollRef.current.style.setProperty('--item-width', `${finalWidth}px`);
      }
    }
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    // Initial calculation with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      calculateItemWidth();
      checkScroll();
    }, 0);

    // Use ResizeObserver for more accurate container size tracking
    const resizeObserver = new ResizeObserver(() => {
      calculateItemWidth();
      checkScroll();
    });

    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    // Fallback to window resize for edge cases
    const handleResize = () => {
      calculateItemWidth();
      checkScroll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [children, isCollapsed]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newScrollLeft = direction === 'left'
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between h-[36px] flex-shrink-0 mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {icon && (
            <span className="bg-primary/10 text-primary p-1.5 rounded-md">
              {icon}
            </span>
          )}
          {title}
          <span className="text-muted-foreground text-sm font-normal ml-1">
            ({totalCount !== undefined ? totalCount : count})
          </span>
        </h2>
        <div className="flex gap-2">
          {showMoreLink && (
            <Link href={showMoreLink}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
              >
                Show More
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              "h-8 w-8 transition-opacity",
              !canScrollLeft && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              "h-8 w-8 transition-opacity",
              !canScrollRight && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth snap-x snap-mandatory w-full min-h-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '--item-width': `${itemWidth}px`,
        } as React.CSSProperties & { '--item-width': string }}
      >
        {children}
      </div>
    </div>
  );
}




