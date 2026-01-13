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
  count?: number;
  icon?: ReactNode;
  showMoreLink?: string;
  totalCount?: number; // Total count including items not shown
  showCount?: boolean; // Whether to show the count in the title
}

export function Carousel({ children, title, count, icon, showMoreLink, totalCount, showCount = true }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [itemWidth, setItemWidth] = useState(200);
  const { isCollapsed } = useSidebar();

  const calculateItemWidth = () => {
    if (!scrollRef.current) return;
    
    const containerWidth = scrollRef.current.clientWidth;
    if (containerWidth === 0) return; // Not yet rendered
    
    // Responsive gap based on screen size
    const isMobile = containerWidth < 640; // sm breakpoint
    const isTablet = containerWidth >= 640 && containerWidth < 1024; // md breakpoint
    const gap = isMobile ? 12 : isTablet ? 14 : 16; // Responsive gap: 12px mobile, 14px tablet, 16px desktop
    
    // Responsive poster sizes - balanced for readability and title wrapping
    const minWidth = isMobile ? 120 : isTablet ? 150 : 170;
    const maxWidth = isMobile ? 160 : isTablet ? 200 : 230;
    
    // Calculate how many items can fit with maximum width
    const maxItemsWithMaxWidth = Math.floor((containerWidth + gap) / (maxWidth + gap));
    
    // Calculate how many items can fit with minimum width
    const maxItemsWithMinWidth = Math.floor((containerWidth + gap) / (minWidth + gap));
    
    // Prefer larger posters - aim for good balance
    let targetItems = Math.max(1, maxItemsWithMaxWidth);
    
    // If we can fit more items, try to find a sweet spot
    if (maxItemsWithMinWidth > maxItemsWithMaxWidth) {
      // Aim for comfortable poster size that allows titles to wrap
      const preferredWidth = isMobile ? 140 : isTablet ? 175 : 200;
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
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 h-auto sm:h-[36px] flex-shrink-0 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {icon && (
            <span className="bg-primary/10 text-primary p-1 sm:p-1.5 rounded-md">
              {icon}
            </span>
          )}
          <span className="whitespace-nowrap">{title}</span>
          {showCount && count !== undefined && (
            <span className="text-muted-foreground text-xs sm:text-sm font-normal">
              ({totalCount !== undefined ? totalCount : count})
            </span>
          )}
        </h2>
        <div className="flex gap-1.5 sm:gap-2 items-center flex-shrink-0">
          {showMoreLink && (
            <Link href={showMoreLink}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 gap-1 text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Show More</span>
                <span className="sm:hidden">More</span>
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 transition-opacity flex-shrink-0",
              !canScrollLeft && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 transition-opacity flex-shrink-0",
              !canScrollRight && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 flex gap-3 sm:gap-4 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth snap-x snap-mandatory w-full min-h-0"
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




