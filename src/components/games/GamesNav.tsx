'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Gamepad2, ListVideo } from 'lucide-react';
import { SearchBar } from '../watchlist/SearchBar';
import { useGames } from '@/lib/hooks/useGames';
import { useState, useRef } from 'react';

export function GamesNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get('search') || '';
  const { planToPlayGames, playedGames, playingGames } = useGames();
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
        router.push(`/games?search=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/games');
      }
      setIsSearching(false);
    }, 500);
  };

  const handleClearSearch = () => {
    router.push('/games');
  };

  const isActive = (path: string) => {
    if (path === '/games') {
      return pathname === '/games' && !searchQuery;
    }
    return pathname === path;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
        <Link href="/games/playing">
          <Button
            variant={isActive('/games/playing') ? 'default' : 'outline'}
            className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
          >
            <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Playing</span>
            <span className="sm:hidden">Play</span>
            <span className="ml-1">({playingGames.length})</span>
          </Button>
        </Link>
        <Link href="/games">
          <Button
            variant={isActive('/games') ? 'default' : 'outline'}
            className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
          >
            <ListVideo className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Plan to Play</span>
            <span className="sm:hidden">Plan</span>
            <span className="ml-1">({planToPlayGames.length})</span>
          </Button>
        </Link>
        <Link href="/games/played">
          <Button
            variant={isActive('/games/played') ? 'default' : 'outline'}
            className="h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
          >
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Played</span>
            <span className="sm:hidden">Done</span>
            <span className="ml-1">({playedGames.length})</span>
          </Button>
        </Link>
      </div>
      <div className="flex-1 w-full sm:max-w-md">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
          placeholder="Search games..."
          isLoading={isSearching}
        />
      </div>
    </div>
  );
}
