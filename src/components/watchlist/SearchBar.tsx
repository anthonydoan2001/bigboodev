'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with URL query param
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const fireSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);
  }, [onSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fireSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on Enter — cancel any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch(query.trim());
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        {isLoading ? (
          <Loader2 className="absolute left-3 h-5 w-5 text-muted-foreground pointer-events-none animate-spin" />
        ) : (
          <Search className="absolute left-3 h-5 w-5 text-muted-foreground pointer-events-none" />
        )}
        <Input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-10 pr-12 h-12 text-base w-full"
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
        </div>
      </div>
    </form>
  );
}
