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
import { useState, useEffect, memo } from 'react';

// Blur placeholder for poster images (2:3 aspect ratio)
const BLUR_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAQklEQVQoz2NgGAUwwAjE/0HYgBj1/6F8A2LU/4fy/5Oh/j+Ub0CM+v9Q/n8y1P+H8v+Tof4/lP+fDPX/ofz/ZKgfBAA4cRITSQqCYAAAAABJRU5ErkJggg==';

interface GridCardProps {
  item: WatchlistItem;
  onDelete: () => void;
  onMarkWatched?: () => void;
  onMarkWatching?: () => void;
  disableContextMenu?: boolean;
  hideStatusBadge?: boolean;
}

/**
 * GridCard - Optimized for grid layouts (watched/watching pages)
 * Features:
 * - Responsive sizing based on grid container
 * - Larger card footprint for better visibility in paginated views
 * - Optimized hover states for grid context
 */
export function GridCard({
  item,
  onDelete,
  onMarkWatched,
  onMarkWatching,
  disableContextMenu = false,
  hideStatusBadge = false
}: GridCardProps) {
  const isWatched = item.status === 'WATCHED';
  const isWatching = item.status === 'WATCHING';
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (open && position.x > 0 && position.y > 0) {
      const positionMenu = () => {
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        if (menuElements.length === 0) return;

        const menuElement = Array.from(menuElements)[menuElements.length - 1] as HTMLElement;

        if (menuElement) {
          menuElement.style.position = 'fixed';
          menuElement.style.left = `${position.x}px`;
          menuElement.style.top = `${position.y}px`;
          menuElement.style.transform = 'translate(10px, 0)';
          menuElement.style.margin = '0';
          menuElement.style.zIndex = '9999';
          menuElement.style.setProperty('--radix-dropdown-menu-content-transform-origin', 'var(--radix-popper-transform-origin)');
        }
      };

      const timeout1 = setTimeout(positionMenu, 0);
      const timeout2 = setTimeout(positionMenu, 10);
      const timeout3 = setTimeout(positionMenu, 50);
      const timeout4 = setTimeout(positionMenu, 100);

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

  useEffect(() => {
    if (open) {
      const handleScroll = () => {
        setOpen(false);
        const menuElements = document.querySelectorAll('[data-slot="dropdown-menu-content"]');
        menuElements.forEach(el => {
          delete (el as HTMLElement).dataset.positioned;
        });
      };
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
          className="relative aspect-[2/3] overflow-visible rounded-xl bg-muted transition-all duration-300 ease-out cursor-context-menu w-full group-hover:scale-[1.02]"
          onContextMenu={(e) => {
            if (disableContextMenu) return;
            e.preventDefault();
            e.stopPropagation();
            setPosition({ x: e.clientX, y: e.clientY });
            setOpen(true);
          }}
          onMouseDown={(e) => {
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
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                loading="lazy"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                <span className="text-sm font-medium">No Image</span>
              </div>
            )}
          </div>

          {/* Rating Badge - Top Left */}
          {item.rating && (
            <div className="absolute left-1 top-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm flex items-center gap-0.5 z-10 shadow-md">
              <span className="text-yellow-400 text-xs">★</span>
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Status Badges */}
          {!hideStatusBadge && isWatched && (
            <div className="absolute right-1 top-6 flex items-center gap-0.5 rounded-md bg-emerald-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-md z-10">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Watched</span>
            </div>
          )}

          {!hideStatusBadge && isWatching && (
            <div className="absolute right-1 top-6 flex items-center gap-0.5 rounded-md bg-blue-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-md z-10">
              <Eye className="h-2.5 w-2.5" />
              <span>Watching</span>
            </div>
          )}

          {/* Media Type Badge - Top Right */}
          <div className="absolute right-1 top-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm z-10 shadow-md">
            {item.type === 'ANIME' ? 'Anime' : item.type === 'MOVIE' ? 'Movie' : item.type === 'SHOW' ? 'TV' : item.type}
          </div>

          {/* Hover Overlay - Delete Button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-1.5 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-end">
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 hover:rotate-12 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-48 p-1 bg-background/90 backdrop-blur-xl border-border/50 shadow-xl rounded-xl"
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

        {/* Metadata - Below Image */}
        <div className="mt-1 space-y-0.5 w-full min-w-0 flex-shrink-0">
          {(item.year || item.episodes) && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              {item.year && <span>{item.year}</span>}
              {item.episodes && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{item.episodes} eps</span>
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
            title={item.title}
          >
            {item.title}
          </h3>
        </div>
      </div>
    </DropdownMenu>
  );
}
