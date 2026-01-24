'use client';

import { Button } from '@/components/ui/button';
import { useGames } from '@/lib/hooks/useGames';
import { Gamepad2, Trophy, ListPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { SearchBar } from './SearchBar';

export function GamesNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get('search') || '';
  const { playingGames, playedGames, playlistGames } = useGames();
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        router.push(`/games/playlist?search=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/games/playlist');
      }
      setIsSearching(false);
    }, 500);
  };

  const handleClearSearch = () => {
    router.push('/games/playlist');
  };

  const isActive = (path: string) => {
    if (path === '/games/playlist') {
      return pathname === '/games/playlist' && !searchQuery;
    }
    return pathname === path;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex gap-2 flex-wrap">
        <Link href="/games/playing">
          <Button
            variant={isActive('/games/playing') ? 'default' : 'outline'}
            className="h-10"
          >
            <Gamepad2 className="h-4 w-4 mr-2" />
            Playing ({playingGames.length})
          </Button>
        </Link>
        <Link href="/games/playlist">
          <Button
            variant={isActive('/games/playlist') ? 'default' : 'outline'}
            className="h-10"
          >
            <ListPlus className="h-4 w-4 mr-2" />
            Playlist ({playlistGames.length})
          </Button>
        </Link>
        <Link href="/games/played">
          <Button
            variant={isActive('/games/played') ? 'default' : 'outline'}
            className="h-10"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Played ({playedGames.length})
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
