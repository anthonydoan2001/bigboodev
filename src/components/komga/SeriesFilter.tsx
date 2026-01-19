'use client';

import { Button } from '@/components/ui/button';
import { BookOpen, BookMarked } from 'lucide-react';

export type SeriesFilterType = 'all' | 'comic' | 'manga';

interface SeriesFilterProps {
  filter: SeriesFilterType;
  onFilterChange: (filter: SeriesFilterType) => void;
  comicCount?: number;
  mangaCount?: number;
}

export function SeriesFilter({ filter, onFilterChange, comicCount, mangaCount }: SeriesFilterProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        onClick={() => onFilterChange('all')}
        className="h-10"
      >
        All
      </Button>
      <Button
        variant={filter === 'comic' ? 'default' : 'outline'}
        onClick={() => onFilterChange('comic')}
        className="h-10"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Comic{comicCount !== undefined ? ` (${comicCount})` : ''}
      </Button>
      <Button
        variant={filter === 'manga' ? 'default' : 'outline'}
        onClick={() => onFilterChange('manga')}
        className="h-10"
      >
        <BookMarked className="h-4 w-4 mr-2" />
        Manga{mangaCount !== undefined ? ` (${mangaCount})` : ''}
      </Button>
    </div>
  );
}
