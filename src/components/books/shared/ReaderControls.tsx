'use client';

import { useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ReaderControlsProps {
  title: string;
  subtitle?: string;
  currentLocation: string;
  progress: number; // 0-100
  onPrevious: () => void;
  onNext: () => void;
  onProgressChange?: (value: number) => void;
  hasPrevious: boolean;
  hasNext: boolean;
  backHref: string;
  children: ReactNode;
  extraControls?: ReactNode;
  hideBottomBar?: boolean;
}

export function ReaderControls({
  title,
  subtitle,
  currentLocation,
  progress,
  onPrevious,
  onNext,
  onProgressChange,
  hasPrevious,
  hasNext,
  backHref,
  children,
  extraControls,
  hideBottomBar,
}: ReaderControlsProps) {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showUI = useCallback(() => setIsUIVisible(true), []);
  const hideUI = useCallback(() => setIsUIVisible(false), []);

  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    showUI();
    hideTimeoutRef.current = setTimeout(() => {
      hideUI();
    }, 3000);
  }, [showUI, hideUI]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          onPrevious();
          resetHideTimer();
          break;
        case 'ArrowRight':
          onNext();
          resetHideTimer();
          break;
        case 'Escape':
          // Navigate back handled by browser
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, resetHideTimer]);

  // Touch swipe navigation
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Require horizontal swipe: min 50px, more horizontal than vertical, under 500ms
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      if (dx > 0) {
        onPrevious();
      } else {
        onNext();
      }
      resetHideTimer();
    }
  }, [onPrevious, onNext, resetHideTimer]);

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col"
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-50 transition-transform duration-300',
          isUIVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="bg-gradient-to-b from-black/80 to-transparent px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9 flex-shrink-0"
              asChild
            >
              <Link href={backHref}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div className="text-white min-w-0 flex-1">
              <p className="font-medium truncate text-sm sm:text-base" title={title}>
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-white/70 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8 hidden sm:inline-flex"
                onClick={onPrevious}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-white text-[10px] sm:text-sm font-medium min-w-[40px] sm:min-w-[60px] text-center">
                {currentLocation}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8 hidden sm:inline-flex"
                onClick={onNext}
                disabled={!hasNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              {extraControls}
            </div>
          </div>
        </div>
      </div>

      {/* Reader content */}
      <div className="flex-1 overflow-hidden relative">{children}</div>

      {/* Bottom bar */}
      {!hideBottomBar && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 z-50 transition-transform duration-300',
            isUIVisible ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="bg-gradient-to-t from-black/80 to-transparent px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-xs min-w-[40px]">
                {Math.round(progress)}%
              </span>
              {onProgressChange ? (
                <Slider
                  value={[progress]}
                  onValueChange={([val]) => onProgressChange(val)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              ) : (
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
