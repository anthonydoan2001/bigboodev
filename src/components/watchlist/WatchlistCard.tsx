'use client';

import { WatchlistItem } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, Eye, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface WatchlistCardProps {
  item: WatchlistItem;
  onDelete: () => void;
  onMarkWatched?: () => void;
  onMarkWatching?: () => void;
  disableContextMenu?: boolean;
  hideStatusBadge?: boolean;
}

export function WatchlistCard({ 
  item, 
  onDelete, 
  onMarkWatched, 
  onMarkWatching, 
  disableContextMenu = false, 
  hideStatusBadge = false 
}: WatchlistCardProps) {
  const isWatched = item.status === 'WATCHED';
  const isWatching = item.status === 'WATCHING';
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuIdRef = useRef(`menu-${item.id}-${Math.random().toString(36).substr(2, 9)}`);
  
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
      <div className="group relative space-y-2 w-full flex flex-col" style={{ width: '100%', maxWidth: 'var(--item-max-width, 100%)', minWidth: 0 }}>
        <div 
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
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50 px-2.5 py-1.5 bg-black/90 text-white text-caption rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[200px] break-words text-center">
              {item.title}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
            </div>

            <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, var(--item-width, 200px)"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                  <span className="text-body-sm">No Image</span>
                </div>
              )}
            </div>

            {/* Rating Badge - Top Left */}
            {item.rating && (
              <div className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-2 py-1 text-caption font-bold text-white backdrop-blur-md flex items-center gap-1 z-10">
                <span className="text-yellow-400 text-body-sm">★</span> {item.rating.toFixed(1)}
              </div>
            )}

            {/* Watched Badge - Below Category */}
            {!hideStatusBadge && isWatched && (
              <div className="absolute right-1.5 top-7 flex items-center gap-0.5 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md shadow-sm z-10">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Watched
              </div>
            )}

            {/* Watching Badge - Below Category */}
            {!hideStatusBadge && isWatching && (
              <div className="absolute right-1.5 top-7 flex items-center gap-0.5 rounded-md bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md shadow-sm z-10">
                <Eye className="h-2.5 w-2.5" />
                Watching
              </div>
            )}

            {/* Media Type Badge - Top Right */}
            <div className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md z-10">
              {item.type === 'ANIME' ? 'Anime' : item.type === 'MOVIE' ? 'Movie' : item.type === 'SHOW' ? 'TV Show' : item.type}
            </div>

            {/* Hover Overlay - Remove Button Icon */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-2 pointer-events-none gap-1.5">
              <div className="pointer-events-auto flex items-center justify-end gap-1.5">
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 hover:rotate-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 transition-transform duration-200" />
                </Button>
              </div>
            </div>
          </div>
        <DropdownMenuContent 
          align="end" 
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-48 p-1 bg-background/80 backdrop-blur-xl border-border/50 shadow-xl rounded-xl"
        >
          {!isWatched && onMarkWatched && (
            <DropdownMenuItem onClick={onMarkWatched} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Watched
            </DropdownMenuItem>
          )}
          {!isWatching && onMarkWatching && (
            <DropdownMenuItem onClick={onMarkWatching} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              Mark Watching
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
        
        <div className="space-y-1 w-full min-w-0 flex-shrink-0 overflow-visible">
          {(item.year || item.episodes) && (
            <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
              {item.year && <span>{item.year}</span>}
              {item.episodes && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span>{item.episodes} eps</span>
                </>
              )}
            </div>
          )}
          <h3
            className="text-body-sm font-semibold leading-snug text-foreground/90" 
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
            title={item.title}
          >
            {item.title}
          </h3>
        </div>
      </div>
    </DropdownMenu>
  );
}
