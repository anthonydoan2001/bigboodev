'use client';

import Link from 'next/link';
import { getBookCoverUrl } from '@/lib/api/calibre';
import { CalibreBook } from '@/types/calibre-web';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface BookCardProps {
  book: CalibreBook;
}

export function BookCard({ book }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const coverUrl = getBookCoverUrl(book.id);

  const readableFormat = book.formats.find((f) => f.toLowerCase() === 'epub')
    || book.formats.find((f) => f.toLowerCase() === 'pdf');
  const href = readableFormat
    ? `/books/read/${book.id}?format=${readableFormat.toLowerCase()}&title=${encodeURIComponent(book.title)}`
    : '#';

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3] transition-transform group-hover:scale-[1.02]">
        {!imageError ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity group-hover:opacity-90"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Format badges */}
        {book.formats.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {book.formats.map((format) => (
              <Badge
                key={format}
                variant="secondary"
                className="bg-black/70 text-white border-0 text-[10px] uppercase"
              >
                {format}
              </Badge>
            ))}
          </div>
        )}

        {/* Rating */}
        {book.rating && book.rating > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white border-0">
              {'★'.repeat(Math.round(book.rating))}
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        {book.authors.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.authors.join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}
