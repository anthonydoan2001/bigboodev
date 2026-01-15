'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Gamepad2, ListVideo, Trophy } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex gap-2">
        <Link href="/games/playing">
          <Button
            variant={isActive('/games/playing') ? 'default' : 'outline'}
            className="h-10"
          >
            <Gamepad2 className="h-4 w-4 mr-2" />
            Playing ({playingGames.length})
          </Button>
        </Link>
        <Link href="/games">
          <Button
            variant={isActive('/games') ? 'default' : 'outline'}
            className="h-10"
          >
            <ListVideo className="h-4 w-4 mr-2" />
            Plan to Play ({planToPlayGames.length})
          </Button>
        </Link>
        <Link href="/games/played">
          <Button
            variant={isActive('/games/played') ? 'default' : 'outline'}
            className="h-10"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Played ({playedGames.length})
          </Button>
        </Link>
        <Link href="/games/top">
          <Button
            variant={isActive('/games/top') ? 'default' : 'outline'}
            className="h-10"
          >
            <Trophy className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="flex-1 max-w-md">
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
