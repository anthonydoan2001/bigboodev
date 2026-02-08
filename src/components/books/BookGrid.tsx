'use client';

import { CalibreBook } from '@/types/calibre-web';
import { BookCard } from './BookCard';

interface BookGridProps {
  books: CalibreBook[];
}

export function BookGrid({ books }: BookGridProps) {
  // Deduplicate by ID (OPDS feeds can produce collisions)
  const unique = books.filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {unique.map((book, index) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
