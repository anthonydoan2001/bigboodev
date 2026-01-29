'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { getReadListThumbnailUrl } from '@/lib/api/manga';
import { KomgaReadList } from '@/types/komga';
import { List } from 'lucide-react';
import { useState } from 'react';

interface ReadListCardProps {
  readList: KomgaReadList;
  /** Set to true for above-the-fold images to load with high priority */
  priority?: boolean;
}

export function ReadListCard({ readList, priority = false }: ReadListCardProps) {
  const [imageError, setImageError] = useState(false);

  // Use lastModifiedDate as stable cache key (only changes when readlist actually changes)
  const lastModifiedTime = new Date(readList.lastModifiedDate).getTime();
  const thumbnailUrl = `${getReadListThumbnailUrl(readList.id)}?lm=${lastModifiedTime}`;
  const bookCount = readList.bookIds?.length ?? readList.bookCount ?? 0;

  return (
    <Link
      href={`/manga/readlist/${readList.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3] transition-transform group-hover:scale-[1.02]">
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={readList.name}
            fill
            unoptimized
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <List className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Reading List indicator */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-purple-600 hover:bg-purple-600 text-white border-0">
            <List className="h-3 w-3 mr-1" />
            List
          </Badge>
        </div>

        {/* Book count */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-black/70 text-white border-0">
            {bookCount} {bookCount === 1 ? 'issue' : 'issues'}
          </Badge>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {readList.name}
        </h3>
        {readList.summary && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {readList.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
