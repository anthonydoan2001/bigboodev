'use client';

import { Game } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Gamepad2, Trophy, ListPlus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface GameCardProps {
  game: Game;
  onDelete: () => void;
  onMarkPlaying?: () => void;
  onMarkPlayed?: () => void;
  onMoveToPlaylist?: () => void;
  disableContextMenu?: boolean;
  hideStatusBadge?: boolean;
}

export function GameCard({
  game,
  onDelete,
  onMarkPlaying,
  onMarkPlayed,
  onMoveToPlaylist,
  disableContextMenu = false,
  hideStatusBadge = false
}: GameCardProps) {
  const isPlaying = game.status === 'PLAYING';
  const isPlayed = game.status === 'PLAYED';
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

  const releaseYear = game.releaseDate ? new Date(game.releaseDate).getFullYear() : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <div className="group relative flex flex-col w-full h-full transition-all duration-300 ease-out" style={{ width: '100%', minWidth: 0 }}>
        <div
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
            {game.coverArtUrl ? (
              <Image
                src={game.coverArtUrl}
                alt={game.gameTitle}
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
          {game.metacritic && (
            <div className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm z-10 shadow-md ${
              game.metacritic >= 75 ? 'bg-green-600/90' : game.metacritic >= 50 ? 'bg-yellow-600/90' : 'bg-red-600/90'
            }`}>
              {game.metacritic}
            </div>
          )}

          {/* Status Badges - Bottom Left */}
          {!hideStatusBadge && isPlaying && (
            <div className="absolute left-1.5 bottom-1.5 flex items-center gap-0.5 rounded-md bg-blue-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-md z-10">
              <Gamepad2 className="h-2.5 w-2.5" />
              <span>Playing</span>
            </div>
          )}

          {!hideStatusBadge && isPlayed && (
            <div className="absolute left-1.5 bottom-1.5 flex items-center gap-0.5 rounded-md bg-emerald-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-md z-10">
              <Trophy className="h-2.5 w-2.5" />
              <span>Played</span>
            </div>
          )}

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
          {!isPlaying && onMarkPlaying && (
            <DropdownMenuItem onClick={onMarkPlaying} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Mark Playing
            </DropdownMenuItem>
          )}
          {!isPlayed && onMarkPlayed && (
            <DropdownMenuItem onClick={onMarkPlayed} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <Trophy className="mr-2 h-4 w-4" />
              Mark Played
            </DropdownMenuItem>
          )}
          {game.status !== 'PLAYLIST' && onMoveToPlaylist && (
            <DropdownMenuItem onClick={onMoveToPlaylist} className="rounded-lg focus:bg-accent/50 focus:text-accent-foreground cursor-pointer">
              <ListPlus className="mr-2 h-4 w-4" />
              Move to Playlist
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>

        {/* Metadata - Below Image */}
        <div className="mt-1 space-y-0.5 w-full min-w-0 flex-shrink-0">
          {(releaseYear || game.genres) && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              {releaseYear && <span>{releaseYear}</span>}
              {game.genres && (
                <>
                  {releaseYear && <span className="text-muted-foreground/40">•</span>}
                  <span className="truncate">{game.genres.split(',')[0]}</span>
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
            title={game.gameTitle}
          >
            {game.gameTitle}
          </h3>
        </div>
      </div>
    </DropdownMenu>
  );
}
