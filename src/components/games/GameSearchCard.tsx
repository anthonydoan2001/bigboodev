'use client';

import { GameSearchResult } from '@/types/games';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Gamepad2, Trophy, ListPlus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface GameSearchCardProps {
  result: GameSearchResult;
  onAdd: (status: 'PLAYLIST' | 'PLAYING' | 'PLAYED') => void;
  isAdding: boolean;
  alreadyInList: boolean;
  currentStatus?: 'PLAYING' | 'PLAYED' | 'PLAYLIST' | null;
  onUpdateStatus?: (status: 'PLAYING' | 'PLAYED' | 'PLAYLIST') => void;
  onDelete?: () => void;
  disableContextMenu?: boolean;
}

export function GameSearchCard({
  result,
  onAdd,
  isAdding,
  alreadyInList,
  currentStatus,
  onUpdateStatus,
  onDelete,
  disableContextMenu = false,
}: GameSearchCardProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

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

  const releaseYear = result.releaseDate ? new Date(result.releaseDate).getFullYear() : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <div className="group relative flex flex-col w-full h-full transition-all duration-300 ease-out" style={{ width: '100%', minWidth: 0 }}>
        <div
          ref={cardRef}
          className="relative aspect-[16/9] overflow-visible rounded-xl bg-muted transition-all duration-300 ease-out cursor-context-menu w-full group-hover:scale-[1.02]"
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

          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted shadow-lg ring-1 ring-black/10 group-hover:shadow-2xl group-hover:ring-primary/30 transition-all duration-300">
            {result.coverImage ? (
              <Image
                src={result.coverImage}
                alt={result.name}
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

          {/* Metacritic Badge - Top Left */}
          {result.metacritic && (
            <div className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm z-10 shadow-md ${
              result.metacritic >= 75 ? 'bg-success/90' : result.metacritic >= 50 ? 'bg-warning/90' : 'bg-destructive/90'
            }`}>
              {result.metacritic}
            </div>
          )}

          {/* Status Badge - Bottom Left */}
          {alreadyInList && currentStatus === 'PLAYLIST' && (
            <div className="absolute left-1.5 bottom-1.5 flex items-center gap-0.5 rounded-md bg-accent/95 px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground backdrop-blur-sm shadow-md z-10">
              <Check className="h-2.5 w-2.5" />
              <span>Saved</span>
            </div>
          )}
          {currentStatus === 'PLAYING' && (
            <div className="absolute left-1.5 bottom-1.5 flex items-center gap-0.5 rounded-md bg-in-progress/95 px-1.5 py-0.5 text-[9px] font-bold text-in-progress-foreground backdrop-blur-sm shadow-md z-10">
              <Gamepad2 className="h-2.5 w-2.5" />
              <span>Playing</span>
            </div>
          )}
          {currentStatus === 'PLAYED' && (
            <div className="absolute left-1.5 bottom-1.5 flex items-center gap-0.5 rounded-md bg-success/95 px-1.5 py-0.5 text-[9px] font-bold text-success-foreground backdrop-blur-sm shadow-md z-10">
              <Trophy className="h-2.5 w-2.5" />
              <span>Played</span>
            </div>
          )}

          {/* Hover Overlay - Add Button */}
          {!alreadyInList && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-1.5 pointer-events-none">
              <div className="pointer-events-auto flex flex-col">
                <Button
                  size="sm"
                  className="h-7 w-full text-xs font-medium opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd('PLAYLIST');
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
          {onDelete && alreadyInList && (
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
          {(releaseYear || result.genres.length > 0) && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              {releaseYear && <span>{releaseYear}</span>}
              {result.genres.length > 0 && (
                <>
                  {releaseYear && <span className="text-muted-foreground/40">•</span>}
                  <span className="truncate">{result.genres[0]}</span>
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
            title={result.name}
          >
            {result.name}
          </h3>
        </div>

        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-48 p-1 bg-background/90 backdrop-blur-xl border-border/50 shadow-xl rounded-xl"
        >
          {!alreadyInList ? (
            <>
              <DropdownMenuItem onClick={() => onAdd('PLAYLIST')} disabled={isAdding} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
                <ListPlus className="mr-2 h-4 w-4" />
                Add to Playlist
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAdd('PLAYING')} disabled={isAdding} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
                <Gamepad2 className="mr-2 h-4 w-4" />
                Add as Playing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAdd('PLAYED')} disabled={isAdding} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
                <Trophy className="mr-2 h-4 w-4" />
                Add as Played
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {currentStatus !== 'PLAYING' && onUpdateStatus && (
                <DropdownMenuItem onClick={() => onUpdateStatus('PLAYING')} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Mark Playing
                </DropdownMenuItem>
              )}
              {currentStatus !== 'PLAYED' && onUpdateStatus && (
                <DropdownMenuItem onClick={() => onUpdateStatus('PLAYED')} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
                  <Trophy className="mr-2 h-4 w-4" />
                  Mark Played
                </DropdownMenuItem>
              )}
              {currentStatus !== 'PLAYLIST' && onUpdateStatus && (
                <DropdownMenuItem onClick={() => onUpdateStatus('PLAYLIST')} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
                  <ListPlus className="mr-2 h-4 w-4" />
                  Move to Playlist
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}
