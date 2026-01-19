'use client';

import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getZoomLevel, saveZoomLevel } from '@/lib/reader-settings';
import { useState, useEffect } from 'react';

interface ZoomControlsProps {
  seriesId: string;
  onZoomChange?: (zoom: number) => void;
}

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

export function ZoomControls({ seriesId, onZoomChange }: ZoomControlsProps) {
  const [zoom, setZoom] = useState(1.0);

  // Load zoom level when component mounts
  useEffect(() => {
    if (seriesId) {
      const savedZoom = getZoomLevel(seriesId);
      setZoom(savedZoom);
      if (onZoomChange) {
        onZoomChange(savedZoom);
      }
    }
  }, [seriesId, onZoomChange]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    setZoom(newZoom);
    saveZoomLevel(seriesId, newZoom);
    // Dispatch event to notify other books in the same series
    window.dispatchEvent(new Event('komga-settings-changed'));
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    setZoom(newZoom);
    saveZoomLevel(seriesId, newZoom);
    // Dispatch event to notify other books in the same series
    window.dispatchEvent(new Event('komga-settings-changed'));
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  };

  const handleReset = () => {
    const resetZoom = 1.0;
    setZoom(resetZoom);
    saveZoomLevel(seriesId, resetZoom);
    // Dispatch event to notify other books in the same series
    window.dispatchEvent(new Event('komga-settings-changed'));
    if (onZoomChange) {
      onZoomChange(resetZoom);
    }
  };

  return (
    <div className="flex items-center gap-1">
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
          handleZoomOut();
        }}
        disabled={zoom <= MIN_ZOOM}
        className="h-8 w-8 text-foreground hover:bg-white/10"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-xs text-foreground min-w-[3rem] text-center">
        {Math.round(zoom * 100)}%
      </span>
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
          handleZoomIn();
        }}
        disabled={zoom >= MAX_ZOOM}
        className="h-8 w-8 text-foreground hover:bg-white/10"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
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
          handleReset();
        }}
        disabled={zoom === 1.0}
        className="h-8 w-8 text-foreground hover:bg-white/10"
        aria-label="Reset zoom"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
