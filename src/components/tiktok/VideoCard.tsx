'use client';

import { TikTokVideo } from '@prisma/client';
import Image from 'next/image';
import { Calendar, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoCardProps {
  video: TikTokVideo;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

// Blur placeholder for video thumbnails (9:16 aspect ratio)
const BLUR_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAQCAYAAADESFVDAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAPklEQVQoz2NgGAUDDRgB8X8o24AYtf+hbANi1P6Hsv8To/Y/lP2fGLX/oez/xKj9D2X/J0btfyj7PzFqBxoAAJoqEhO1VxPuAAAAAElFTkSuQmCC';

// TikTok brand gradient for fallback
const TIKTOK_GRADIENT = 'linear-gradient(135deg, #00f2ea 0%, #ff0050 50%, #000000 100%)';

export function VideoCard({ video, onDelete, isDeleting }: VideoCardProps) {
  const handleClick = () => {
    // Create a temporary anchor element to open without referrer
    const a = document.createElement('a');
    a.href = video.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // Also set referrerPolicy to ensure no referrer is sent
    a.referrerPolicy = 'no-referrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(video.id);
    }
  };

  const formattedDate = new Date(video.likedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="group relative cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted transition-all duration-300 group-hover:scale-[1.02] shadow-lg ring-1 ring-black/10 group-hover:shadow-2xl group-hover:ring-primary/30">
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title || 'TikTok video'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 16vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: TIKTOK_GRADIENT }}
          >
            <div className="text-white text-center p-4">
              <svg
                viewBox="0 0 48 48"
                fill="currentColor"
                className="w-12 h-12 mx-auto mb-2"
              >
                <path d="M38.4,21.68v-5.12a9.6,9.6,0,0,1-6.08-2.4,10.24,10.24,0,0,1-3.2-6.88H24v26.56a5.76,5.76,0,1,1-4-5.44V23.36a10.88,10.88,0,1,0,9.12,10.72V22.88a14.72,14.72,0,0,0,9.28,3.2Z" />
              </svg>
              <span className="text-sm font-medium opacity-80">TikTok</span>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-3">
          {/* Delete Button - Top Right */}
          {onDelete && (
            <div className="flex justify-end">
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className={`h-4 w-4 ${isDeleting ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          )}

          {/* Info - Bottom */}
          <div className="space-y-1.5 pointer-events-none">
            {/* Date */}
            <div className="flex items-center gap-1.5 text-white/90 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            {/* Author */}
            {video.authorName && (
              <div className="flex items-center gap-1.5 text-white/90 text-xs">
                <User className="h-3.5 w-3.5" />
                <span className="truncate">@{video.authorName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title below card */}
      {video.title && (
        <div className="mt-2 px-1">
          <p
            className="text-body-sm text-foreground/80 line-clamp-2 leading-snug"
            title={video.title}
          >
            {video.title}
          </p>
        </div>
      )}
    </div>
  );
}
