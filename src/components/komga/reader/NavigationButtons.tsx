'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function NavigationButtons({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: NavigationButtonsProps) {
  return (
    <>
      {/* Previous Page Zone (Left 30%) - Exclude top controls area */}
      <button
        onClick={canGoPrevious ? onPrevious : undefined}
        disabled={!canGoPrevious}
        className={cn(
          'fixed left-0 top-16 bottom-0 w-[30%] z-10',
          'flex items-center justify-start pl-4',
          'transition-opacity duration-200',
          canGoPrevious
            ? 'cursor-pointer hover:bg-black/10 active:bg-black/20'
            : 'cursor-default opacity-30',
          'group'
        )}
        aria-label="Previous page"
      >
        <div
          className={cn(
            'rounded-full bg-black/60 backdrop-blur-sm p-3',
            'transition-all duration-200',
            canGoPrevious && 'group-hover:bg-black/80 group-hover:scale-110'
          )}
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </div>
      </button>

      {/* Next Page Zone (Right 30%) - Exclude top controls area */}
      <button
        onClick={canGoNext ? onNext : undefined}
        disabled={!canGoNext}
        className={cn(
          'fixed right-0 top-16 bottom-0 w-[30%] z-10',
          'flex items-center justify-end pr-4',
          'transition-opacity duration-200',
          canGoNext
            ? 'cursor-pointer hover:bg-black/10 active:bg-black/20'
            : 'cursor-default opacity-30',
          'group'
        )}
        aria-label="Next page"
      >
        <div
          className={cn(
            'rounded-full bg-black/60 backdrop-blur-sm p-3',
            'transition-all duration-200',
            canGoNext && 'group-hover:bg-black/80 group-hover:scale-110'
          )}
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </div>
      </button>
    </>
  );
}
