'use client';

import { UniversalSearchResult } from '@/app/api/watchlist/search/universal/route';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, CheckCircle2, Eye, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface SearchResultCardProps {
  result: UniversalSearchResult;
  onAdd: () => void;
  isAdding: boolean;
  alreadyInList: boolean;
  isWatched?: boolean;
  isWatching?: boolean;
  onMarkWatched?: () => void;
  isMarkingWatched?: boolean;
  onMarkWatching?: () => void;
  isMarkingWatching?: boolean;
  onDelete?: () => void;
  disableContextMenu?: boolean;
}

export function SearchResultCard({
  result,
  onAdd,
  isAdding,
  alreadyInList,
  isWatched,
  isWatching,
  onMarkWatched,
  isMarkingWatched,
  onMarkWatching,
  isMarkingWatching,
  onDelete,
  disableContextMenu = false,
}: SearchResultCardProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const menuIdRef = useRef(`menu-${result.id}-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    if (open && position.x > 0 && position.y > 0) {
      const positionMenu = () => {
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        if (menuElements.length === 0) return;
        
        // Get the last one (most recently opened)
        const menuElement = Array.from(menuElements)[menuElements.length - 1] as HTMLElement;
        
        if (menuElement) {
          // Force position to mouse location
          menuElement.style.position = 'fixed';
          menuElement.style.left = `${position.x}px`;
          menuElement.style.top = `${position.y}px`;
          menuElement.style.transform = 'translate(10px, 0)';
          menuElement.style.margin = '0';
          menuElement.style.zIndex = '9999';
          // Prevent Radix from repositioning
          menuElement.style.setProperty('--radix-dropdown-menu-content-transform-origin', 'var(--radix-popper-transform-origin)');
        }
      };
      
      // Use multiple attempts to catch the menu when it appears
      const timeout1 = setTimeout(positionMenu, 0);
      const timeout2 = setTimeout(positionMenu, 10);
      const timeout3 = setTimeout(positionMenu, 50);
      const timeout4 = setTimeout(positionMenu, 100);
      
      // Also use MutationObserver to catch when menu is added to DOM
      const observer = new MutationObserver(() => {
        positionMenu();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        observer.disconnect();
      };
    }
  }, [open, position]);

  // Close dropdown on scroll - don't interfere with scrolling
  useEffect(() => {
    if (open) {
      const handleScroll = () => {
        // Close after scroll has happened
        setOpen(false);
        // Clean up positioned flag
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        menuElements.forEach(el => {
          delete (el as HTMLElement).dataset.positioned;
        });
      };
      // Only listen to actual scroll events, not wheel (to not interfere)
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [open]);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <div className="group relative space-y-2 w-full flex flex-col" style={{ width: 'var(--item-width, 100%)', maxWidth: 'var(--item-width, 100%)', minWidth: 0 }}>
        <div 
          ref={cardRef}
          className="relative aspect-[2/3] overflow-visible rounded-xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 cursor-context-menu"
          onContextMenu={(e) => {
            if (disableContextMenu) return;
            e.preventDefault();
            e.stopPropagation();
            setPosition({ x: e.clientX, y: e.clientY });
            setOpen(true);
          }}
          onMouseDown={(e) => {
            // Prevent middle mouse button (button 1) from scrolling
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DropdownMenuTrigger asChild className="hidden">
            <div />
          </DropdownMenuTrigger>
          {/* Tooltip */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50 px-2.5 py-1.5 bg-black/90 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[200px] break-words text-center">
            {result.title}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
          </div>

          <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
            {result.image ? (
              <Image
                src={result.image}
                alt={result.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, var(--item-width, 200px)"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                <span className="text-sm font-medium">No Image</span>
              </div>
            )}
          </div>

          {/* Rating Badge - Top Left */}
          {result.rating && (
            <div className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md flex items-center gap-1 z-10">
              <span className="text-yellow-400 text-sm">★</span> {result.rating.toFixed(1)}
            </div>
          )}

          {/* Status Badge - Below Category */}
          {alreadyInList && !isWatched && !isWatching && (
            <div className="absolute right-1.5 top-7 flex items-center gap-0.5 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm z-10">
              <Check className="h-2.5 w-2.5" />
              SAVED
            </div>
          )}
          {isWatched && (
            <div className="absolute right-1.5 top-7 flex items-center gap-0.5 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm z-10">
              <CheckCircle2 className="h-2.5 w-2.5" />
              WATCHED
            </div>
          )}
          {isWatching && (
            <div className="absolute right-1.5 top-7 flex items-center gap-0.5 rounded-md bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm z-10">
              <Eye className="h-2.5 w-2.5" />
              WATCHING
            </div>
          )}

          {/* Type Badge - Top Right */}
          <div className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md z-10">
            {result.type === 'anime' ? 'Anime' : result.type === 'movie' ? 'Movie' : result.type === 'show' ? 'TV Show' : result.type}
          </div>

          {/* Hover Overlay - Add Button */}
          {!alreadyInList && !isWatched && !isWatching && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-2 pointer-events-none gap-1.5">
              <div className="pointer-events-auto flex flex-col gap-1.5">
                <Button
                  size="sm"
                  className="h-8 w-full text-xs font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  disabled={isAdding}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {isAdding ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          )}

          {/* Remove Button - Right Bottom */}
          {onDelete && (alreadyInList || isWatched || isWatching) && (
            <div className="absolute right-1.5 bottom-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none z-20">
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7 pointer-events-auto hover:scale-110 hover:rotate-12"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 transition-transform duration-200" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Title and Metadata - Under the poster */}
        <div className="space-y-1 w-full min-w-0 flex-shrink-0 overflow-visible">
          {(result.year || result.episodes) && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              {result.year && <span>{result.year}</span>}
              {result.episodes && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span>{result.episodes} eps</span>
                </>
              )}
            </div>
          )}
          <h3 
            className="text-sm font-semibold leading-snug text-foreground/90" 
            style={{ 
              width: '100%',
              minWidth: 0,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              whiteSpace: 'normal',
              overflow: 'visible',
              textOverflow: 'clip',
              display: 'block',
              maxWidth: '100%',
              hyphens: 'auto'
            }} 
            title={result.title}
          >
            {result.title}
          </h3>
        </div>
        
        <DropdownMenuContent 
          align="end" 
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-48 p-1 bg-background/80 backdrop-blur-xl border-border/50 shadow-xl rounded-xl"
        >
          {!isWatched && onMarkWatched && (
            <DropdownMenuItem onClick={onMarkWatched} disabled={isMarkingWatched} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isMarkingWatched ? 'Marking...' : 'Mark Watched'}
            </DropdownMenuItem>
          )}
          {!isWatching && onMarkWatching && (
            <DropdownMenuItem onClick={onMarkWatching} disabled={isMarkingWatching} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              {isMarkingWatching ? 'Marking...' : 'Mark Watching'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}
