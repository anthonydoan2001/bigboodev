'use client';

import { Card, CardContent } from '@/components/ui/card';
import { fetchLeagueStats } from '@/lib/api/league-of-legends';
import { cn } from '@/lib/utils';
import { RankedEntry } from '@/types/league-of-legends';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import Image from 'next/image';

// Tier colors for visual distinction
const tierColors: Record<string, string> = {
  IRON: 'text-gray-400',
  BRONZE: 'text-amber-700',
  SILVER: 'text-gray-300',
  GOLD: 'text-yellow-500',
  PLATINUM: 'text-cyan-400',
  EMERALD: 'text-emerald-500',
  DIAMOND: 'text-blue-400',
  MASTER: 'text-purple-500',
  GRANDMASTER: 'text-red-500',
  CHALLENGER: 'text-yellow-400',
};

const tierBgColors: Record<string, string> = {
  IRON: 'bg-gray-400/20',
  BRONZE: 'bg-amber-700/20',
  SILVER: 'bg-gray-300/20',
  GOLD: 'bg-yellow-500/20',
  PLATINUM: 'bg-cyan-400/20',
  EMERALD: 'bg-emerald-500/20',
  DIAMOND: 'bg-blue-400/20',
  MASTER: 'bg-purple-500/20',
  GRANDMASTER: 'bg-red-500/20',
  CHALLENGER: 'bg-yellow-400/20',
};

function formatTier(tier: string): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function RankCard({ entry, queueLabel }: { entry: RankedEntry | null; queueLabel: string }) {
  if (!entry) {
    return (
      <div className="flex items-center justify-between py-2 px-2.5 rounded-md bg-muted/30">
        <span className="text-sm text-muted-foreground">{queueLabel}</span>
        <span className="text-sm text-muted-foreground">Unranked</span>
      </div>
    );
  }

  const winRate = Math.round((entry.wins / (entry.wins + entry.losses)) * 100);
  const tierColor = tierColors[entry.tier] || 'text-foreground';
  const tierBg = tierBgColors[entry.tier] || 'bg-muted/30';

  return (
    <div className={cn('flex items-center justify-between py-2.5 px-3 rounded-md', tierBg)}>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{queueLabel}</span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn('font-bold text-lg', tierColor)}>
            {formatTier(entry.tier)} {entry.rank}
          </span>
          <span className="text-sm text-muted-foreground">
            {entry.leaguePoints} LP
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-muted-foreground">
          {entry.wins}W {entry.losses}L
        </span>
        <span className={cn('text-sm font-medium', winRate >= 50 ? 'text-success' : 'text-destructive')}>
          {winRate}% WR
        </span>
      </div>
    </div>
  );
}

export function LeagueOfLegendsWidget() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leagueStats'],
    queryFn: fetchLeagueStats,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });

  // Refetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Card className="col-span-1 !py-0 bg-background/40 backdrop-blur-md border-white/10 shadow-none">
        <CardContent className="!px-3 !py-3">
          <div className="space-y-2">
            <div className="h-6 w-1/2 bg-muted/50 animate-pulse rounded" />
            <div className="h-16 bg-muted/50 animate-pulse rounded-md" />
            <div className="h-16 bg-muted/50 animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load League stats';
    const isApiKeyError = errorMessage.includes('API_KEY') || errorMessage.includes('403') || errorMessage.includes('expired');

    return (
      <Card className="col-span-1 !py-0 bg-background/40 backdrop-blur-md border-white/10 shadow-none">
        <CardContent className="!px-3 !py-3">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {isApiKeyError ? 'Riot API key invalid or expired' : 'Failed to load League stats'}
            </p>
            {isApiKeyError && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Dev keys expire every 24h
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 !py-0 bg-background/40 backdrop-blur-md border-white/10 shadow-none">
      <CardContent className="!px-3 !py-3">
        <div className="space-y-3">
          {/* Header with summoner name and icon */}
          <div className="flex items-center gap-2.5 pb-1">
            <div className="relative w-10 h-10 flex-shrink-0 rounded-full bg-background/50 overflow-hidden ring-1 ring-border/20">
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${data.profileIconId}.png`}
                alt="Profile Icon"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg leading-tight truncate">{data.summonerName}</span>
              <span className="text-xs text-muted-foreground">Level {data.summonerLevel}</span>
            </div>
          </div>

          {/* Ranked entries */}
          <div className="space-y-2">
            <RankCard entry={data.soloQueue} queueLabel="Solo/Duo" />
            <RankCard entry={data.flexQueue} queueLabel="Flex" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
