'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, onClear, placeholder = 'Search...', isLoading }: SearchBarProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('search') || '';
  const [query, setQuery] = useState(urlQuery);

  // Sync with URL query param
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-24 h-12 text-base w-full"
          disabled={isLoading}
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
            disabled={!query.trim() || isLoading}
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

