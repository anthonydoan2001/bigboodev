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
      <div className="group relative flex flex-col w-full h-full transition-all duration-300 ease-out" style={{ width: '100%', minWidth: 0 }}>
        <div
          ref={cardRef}
          className="relative aspect-[2/3] overflow-visible rounded-xl bg-muted transition-all duration-300 ease-out cursor-context-menu w-full group-hover:scale-[1.02]"
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

          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-lg ring-1 ring-black/10 group-hover:shadow-2xl group-hover:ring-primary/30 transition-all duration-300">
            {result.image ? (
              <Image
                src={result.image}
                alt={result.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
                priority={false}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                <span className="text-sm font-medium">No Image</span>
              </div>
            )}
          </div>

          {/* Rating Badge - Top Left */}
          {result.rating && (
            <div className="absolute left-1 top-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm flex items-center gap-0.5 z-10 shadow-md">
              <span className="text-yellow-400 text-xs">★</span>
              <span>{result.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Status Badge - Below Category */}
          {alreadyInList && !isWatched && !isWatching && (
            <div className="absolute right-1 top-6 flex items-center gap-0.5 rounded-md bg-emerald-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-md z-10">
              <Check className="h-2.5 w-2.5" />
              <span>Saved</span>
            </div>
          )}
          {isWatched && (
            <div className="absolute right-1 top-6 flex items-center gap-0.5 rounded-md bg-emerald-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-md z-10">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Watched</span>
            </div>
          )}
          {isWatching && (
            <div className="absolute right-1 top-6 flex items-center gap-0.5 rounded-md bg-blue-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-md z-10">
              <Eye className="h-2.5 w-2.5" />
              <span>Watching</span>
            </div>
          )}

          {/* Type Badge - Top Right */}
          <div className="absolute right-1 top-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm z-10 shadow-md">
            {result.type === 'anime' ? 'Anime' : result.type === 'movie' ? 'Movie' : result.type === 'show' ? 'TV' : result.type}
          </div>

          {/* Hover Overlay - Add Button */}
          {!alreadyInList && !isWatched && !isWatching && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-1.5 pointer-events-none">
              <div className="pointer-events-auto flex flex-col">
                <Button
                  size="sm"
                  className="h-7 w-full text-xs font-medium opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  disabled={isAdding}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {isAdding ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          )}

          {/* Remove Button - Right Bottom */}
          {onDelete && (alreadyInList || isWatched || isWatching) && (
            <div className="absolute right-1 bottom-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none z-20">
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6 pointer-events-auto hover:scale-110 hover:rotate-12 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Metadata - Below Image */}
        <div className="mt-1 space-y-0.5 w-full min-w-0 flex-shrink-0">
          {(result.year || result.episodes) && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              {result.year && <span>{result.year}</span>}
              {result.episodes && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{result.episodes} eps</span>
                </>
              )}
            </div>
          )}
          <h3
            className="text-xs font-semibold leading-tight text-foreground line-clamp-2"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
            title={result.title}
          >
            {result.title}
          </h3>
        </div>

        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-48 p-1 bg-background/90 backdrop-blur-xl border-border/50 shadow-xl rounded-xl"
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
