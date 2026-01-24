'use client';

import { Button } from '@/components/ui/button';
import { PrefetchLink } from '@/components/performance/PrefetchLink';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { CheckCircle2, Eye, ListVideo, Trophy } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { SearchBar } from './SearchBar';

export function WatchlistNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get('search') || '';
  const { watchlistItems, watchedItems, watchingItems } = useWatchlist();
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (query: string) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);

    // Debounce search to prevent rate limits (500ms delay)
    debounceTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        router.push(`/watchlist?search=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/watchlist');
      }
      setIsSearching(false);
    }, 500);
  };

  const handleClearSearch = () => {
    router.push('/watchlist');
  };

  const isActive = (path: string) => {
    if (path === '/watchlist') {
      return pathname === '/watchlist' && !searchQuery;
    }
    return pathname === path;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex gap-2">
        <PrefetchLink href="/watchlist/watching" prefetchDelay={50}>
          <Button
            variant={isActive('/watchlist/watching') ? 'default' : 'outline'}
            className="h-10"
          >
            <Eye className="h-4 w-4 mr-2" />
            Watching ({watchingItems.length})
          </Button>
        </PrefetchLink>
        <PrefetchLink href="/watchlist" prefetchDelay={50}>
          <Button
            variant={isActive('/watchlist') ? 'default' : 'outline'}
            className="h-10"
          >
            <ListVideo className="h-4 w-4 mr-2" />
            Watchlist ({watchlistItems.length})
          </Button>
        </PrefetchLink>
        <PrefetchLink href="/watchlist/watched" prefetchDelay={50}>
          <Button
            variant={isActive('/watchlist/watched') ? 'default' : 'outline'}
            className="h-10"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Watched ({watchedItems.length})
          </Button>
        </PrefetchLink>
        <PrefetchLink href="/watchlist/top" prefetchDelay={50}>
          <Button
            variant={isActive('/watchlist/top') ? 'default' : 'outline'}
            className="h-10"
          >
            <Trophy className="h-4 w-4" />
          </Button>
        </PrefetchLink>
      </div>
      <div className="flex-1 max-w-md">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
          placeholder="Search anime, movies, and shows..."
          isLoading={isSearching}
        />
      </div>
    </div>
  );
}
