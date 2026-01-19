'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { ZoomControls } from './ZoomControls';
import { ReaderSettingsDialog } from './ReaderSettingsDialog';

interface ReaderControlsProps {
  title: string;
  seriesTitle?: string;
  currentPage: number;
  totalPages: number;
  seriesId: string;
  onClose: () => void;
  onZoomChange?: (zoom: number) => void;
  onSettingsChange?: () => void;
  onPreviousBook?: () => void;
  onNextBook?: () => void;
  canGoToPreviousBook?: boolean;
  canGoToNextBook?: boolean;
}

export function ReaderControls({
  title,
  seriesTitle,
  currentPage,
  totalPages,
  seriesId,
  onClose,
  onZoomChange,
  onSettingsChange,
  onPreviousBook,
  onNextBook,
  canGoToPreviousBook = false,
  canGoToNextBook = false,
}: ReaderControlsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
    // Use setTimeout to ensure navigation happens after event handling
    setTimeout(() => {
      onClose();
    }, 0);
  };

  return (
    <div 
      className="bg-black/80 backdrop-blur-md px-4 py-3 flex items-center justify-between"
      style={{ pointerEvents: 'auto' }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.nativeEvent.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.nativeEvent.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (e.nativeEvent.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent.stopImmediatePropagation) {
              e.nativeEvent.stopImmediatePropagation();
            }
            handleClose(e);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent.stopImmediatePropagation) {
              e.nativeEvent.stopImmediatePropagation();
            }
          }}
          className="h-8 w-8 text-foreground hover:bg-white/10 flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h2 className="text-body-sm font-semibold text-foreground truncate">
            {title}
          </h2>
          {seriesTitle && (
            <p className="text-caption text-muted-foreground truncate">
              {seriesTitle}
            </p>
          )}
          
          {/* Book Navigation Buttons - Next to title */}
          {(onPreviousBook || onNextBook) && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.nativeEvent.stopImmediatePropagation) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  if (canGoToPreviousBook && onPreviousBook) {
                    onPreviousBook();
                  }
                }}
                disabled={!canGoToPreviousBook}
                className={`
                  h-7 w-7 flex items-center justify-center rounded
                  transition-colors duration-200
                  ${canGoToPreviousBook 
                    ? 'text-foreground hover:bg-white/10 cursor-pointer' 
                    : 'text-muted-foreground/50 cursor-not-allowed'
                  }
                `}
                aria-label="Previous book"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.nativeEvent.stopImmediatePropagation) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  if (canGoToNextBook && onNextBook) {
                    onNextBook();
                  }
                }}
                disabled={!canGoToNextBook}
                className={`
                  h-7 w-7 flex items-center justify-center rounded
                  transition-colors duration-200
                  ${canGoToNextBook 
                    ? 'text-foreground hover:bg-white/10 cursor-pointer' 
                    : 'text-muted-foreground/50 cursor-not-allowed'
                  }
                `}
                aria-label="Next book"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 mx-4">
        <ZoomControls seriesId={seriesId} onZoomChange={onZoomChange} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent.stopImmediatePropagation) {
              e.nativeEvent.stopImmediatePropagation();
            }
            setSettingsOpen(true);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent.stopImmediatePropagation) {
              e.nativeEvent.stopImmediatePropagation();
            }
          }}
          className="h-8 w-8 text-foreground hover:bg-white/10"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <span className="text-body-sm font-mono text-foreground whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </span>
      </div>

            <ReaderSettingsDialog
              seriesId={seriesId}
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onSettingsChange={onSettingsChange}
            />
    </div>
  );
}
