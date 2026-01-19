'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface KomgaSearchBarProps {
  placeholder?: string;
}

export function KomgaSearchBar({ placeholder = 'Search comics...' }: KomgaSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('search') || '';
  const [query, setQuery] = useState(urlQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with URL query param
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const handleSearch = (searchQuery: string) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce search (300ms delay)
    debounceTimerRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        router.push(`/manga?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push('/manga');
      }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    router.push('/manga');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder={placeholder}
          className="pl-10 pr-24 h-12 text-base w-full"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 hover:bg-muted rounded-full"
              title="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button
            type="submit"
            disabled={!query.trim()}
            className="h-9 px-4 ml-1"
            size="sm"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
