'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchLeagueStats, fetchAramChallenge } from '@/lib/api/league-of-legends';
import { CACHE_MODERATE } from '@/lib/cache-config';
import { cn } from '@/lib/utils';
import { RankedEntry, AramChallengeResponse } from '@/types/league-of-legends';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Swords } from 'lucide-react';

// Tier colors for visual distinction
const tierColors: Record<string, string> = {
  NONE: 'text-gray-500',
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
  NONE: 'bg-gray-500/20',
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

// Progress bar gradient colors based on tier
const tierProgressColors: Record<string, string> = {
  NONE: 'bg-gray-500',
  IRON: 'bg-gradient-to-r from-gray-500 to-gray-400',
  BRONZE: 'bg-gradient-to-r from-amber-800 to-amber-600',
  SILVER: 'bg-gradient-to-r from-gray-400 to-gray-300',
  GOLD: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
  PLATINUM: 'bg-gradient-to-r from-cyan-500 to-cyan-300',
  EMERALD: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  DIAMOND: 'bg-gradient-to-r from-blue-500 to-blue-300',
  MASTER: 'bg-gradient-to-r from-purple-600 to-purple-400',
  GRANDMASTER: 'bg-gradient-to-r from-red-600 to-red-400',
  CHALLENGER: 'bg-gradient-to-r from-yellow-500 to-amber-300',
};

function formatTier(tier: string): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

// Get ranked emblem URL from Community Dragon
function getRankEmblemUrl(tier: string): string {
  const tierLower = tier.toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tierLower}.png`;
}

function RankCard({ entry, queueLabel }: { entry: RankedEntry | null; queueLabel: string }) {
  if (!entry) {
    return (
      <div className="flex items-center justify-between py-1 md:py-[var(--dash-gap-sm)] px-2 md:px-[var(--dash-px)] rounded-md bg-muted/30">
        <span className="text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground">{queueLabel}</span>
        <span className="text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground">Unranked</span>
      </div>
    );
  }

  const winRate = Math.round((entry.wins / (entry.wins + entry.losses)) * 100);
  const tierColor = tierColors[entry.tier] || 'text-foreground';
  const tierBg = tierBgColors[entry.tier] || 'bg-muted/30';

  return (
    <div className={cn('flex items-center gap-2 md:gap-[var(--dash-gap-sm)] py-1 md:py-[var(--dash-gap-sm)] px-2 md:px-[var(--dash-px)] rounded-md overflow-visible', tierBg)}>
      {/* Rank Emblem */}
      <div className="relative w-7 h-7 md:w-[var(--dash-logo-sm)] md:h-[var(--dash-logo-sm)] flex-shrink-0">
        <div className="absolute -inset-[48px] z-10">
          <Image
            src={getRankEmblemUrl(entry.tier)}
            alt={`${entry.tier} emblem`}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </div>

      {/* Rank Info */}
      <div className="flex-1 min-w-0 z-20">
        <span className="text-[10px] md:text-[length:var(--dash-text-xs)] text-muted-foreground leading-none">{queueLabel}</span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn('font-bold text-xs md:text-[length:var(--dash-text-base)]', tierColor)}>
            {formatTier(entry.tier)} {entry.rank}
          </span>
          <span className="text-[10px] md:text-[length:var(--dash-text-xs)] text-muted-foreground">
            {entry.leaguePoints} LP
          </span>
        </div>
      </div>

      {/* Win Rate */}
      <div className="flex items-center gap-1.5 z-20">
        <span className="text-[10px] md:text-[length:var(--dash-text-xs)] text-muted-foreground">
          {entry.wins}W {entry.losses}L
        </span>
        <span className={cn('text-[10px] md:text-[length:var(--dash-text-xs)] font-medium', winRate >= 50 ? 'text-success' : 'text-destructive')}>
          {winRate}%
        </span>
      </div>
    </div>
  );
}

function AramProgressBar({ data }: { data: AramChallengeResponse }) {
  const tierColor = tierColors[data.tier] || 'text-foreground';
  const progressColor = tierProgressColors[data.tier] || 'bg-gray-500';
  const isAramGod = data.currentPoints >= data.targetPoints;

  return (
    <div className="py-1 md:py-[var(--dash-gap-sm)] px-2 md:px-[var(--dash-px)] rounded-md bg-muted/30">
      {/* Header + Progress inline */}
      <div className="flex items-center justify-between mb-1 md:mb-1.5">
        <div className="flex items-center gap-1.5">
          <Swords className="h-3 w-3 md:h-[var(--dash-icon-xs)] md:w-[var(--dash-icon-xs)] text-muted-foreground" />
          <span className="text-[10px] md:text-[length:var(--dash-text-xs)] text-muted-foreground">ARAM God</span>
        </div>
        <span className={cn('text-[10px] md:text-[length:var(--dash-text-xs)] font-medium', tierColor)}>
          {formatTier(data.tier)} · {isAramGod ? 'ARAM GOD!' : `${data.percentage}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 md:h-2.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            progressColor,
            isAramGod && 'animate-pulse'
          )}
          style={{ width: `${Math.min(100, data.percentage)}%` }}
        />
      </div>
    </div>
  );
}

export function LeagueOfLegendsWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leagueStats'],
    queryFn: fetchLeagueStats,
    ...CACHE_MODERATE,
  });

  const { data: aramData } = useQuery({
    queryKey: ['aramChallenge'],
    queryFn: fetchAramChallenge,
    ...CACHE_MODERATE,
  });

  if (isLoading) {
    return (
      <Card className="col-span-1 !py-0 bg-background/40 backdrop-blur-md border-white/10 shadow-none">
        <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)]">
          <div className="space-y-1.5 md:space-y-[var(--dash-gap-sm)]">
            {/* Summoner header */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 md:w-[var(--dash-logo-sm)] md:h-[var(--dash-logo-sm)]" rounded="full" />
              <Skeleton className="h-4 w-24" />
            </div>
            {/* Rank cards */}
            <div className="space-y-1.5 md:space-y-2">
              <Skeleton className="h-9 md:h-10 w-full" rounded="md" />
              <Skeleton className="h-9 md:h-10 w-full" style={{ animationDelay: '100ms' }} rounded="md" />
            </div>
            {/* ARAM bar */}
            <Skeleton className="h-7 md:h-8 w-full" style={{ animationDelay: '200ms' }} rounded="md" />
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
        <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)]">
          <div className="text-center py-3">
            <p className="text-sm md:text-[length:var(--dash-text-base)] text-muted-foreground">
              {isApiKeyError ? 'Riot API key invalid or expired' : 'Failed to load League stats'}
            </p>
            {isApiKeyError && (
              <p className="text-xs md:text-[length:var(--dash-text-xs)] text-muted-foreground/70 mt-1.5">
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
      <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)]">
        <div className="space-y-1.5 md:space-y-[var(--dash-gap-sm)]">
          {/* Header with summoner name and icon */}
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 md:w-[var(--dash-logo-sm)] md:h-[var(--dash-logo-sm)] flex-shrink-0 rounded-full bg-background/50 overflow-hidden ring-1 ring-border/20">
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/${data.ddragonVersion}/img/profileicon/${data.profileIconId}.png`}
                alt="Profile Icon"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-bold text-xs md:text-[length:var(--dash-text-base)] leading-tight truncate">{data.summonerName}</span>
              <span className="text-[10px] md:text-[length:var(--dash-text-xs)] text-muted-foreground">Lv.{data.summonerLevel}</span>
            </div>
          </div>

          {/* Ranked entries */}
          <div className="space-y-1.5 md:space-y-[var(--dash-gap-sm)]">
            <RankCard entry={data.soloQueue} queueLabel="Solo/Duo" />
            <RankCard entry={data.flexQueue} queueLabel="Flex" />
          </div>

          {/* ARAM Progress */}
          {aramData && <AramProgressBar data={aramData} />}
        </div>
      </CardContent>
    </Card>
  );
}
