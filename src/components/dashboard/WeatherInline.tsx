'use client';

import { fetchWeather } from '@/lib/api/weather';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { WeatherIcon } from './WeatherIcon';
import { Cloud } from 'lucide-react';

export function WeatherInline() {
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-between gap-6 px-[var(--dash-px)] py-[var(--dash-py)] rounded-lg bg-background/40 backdrop-blur-md border border-white/10 h-full">
        <div className="flex flex-col items-start gap-[var(--dash-gap-sm)]">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
        <Skeleton className="h-[var(--dash-logo-lg)] w-[var(--dash-logo-lg)]" rounded="full" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex items-center justify-between gap-6 px-[var(--dash-px)] py-[var(--dash-py)] rounded-lg bg-background/40 backdrop-blur-md border border-white/10 h-full">
        <div className="flex flex-col items-start gap-[var(--dash-gap-sm)]">
          <span className="text-[length:var(--dash-text-5xl)] font-bold text-foreground tabular-nums leading-none">--°</span>
          <span className="text-[length:var(--dash-text-sm)] text-muted-foreground">Unavailable</span>
        </div>
        <Cloud className="h-[var(--dash-logo-lg)] w-[var(--dash-logo-lg)] text-muted-foreground/50" />
      </div>
    );
  }

  const { current } = weather;

  return (
    <div className="flex items-center justify-between gap-6 px-[var(--dash-px)] py-[var(--dash-py)] rounded-lg bg-background/40 backdrop-blur-md border border-white/10 h-full">
      <div className="flex flex-col items-start gap-[var(--dash-gap-sm)]">
        <span className="text-[length:var(--dash-text-5xl)] font-bold text-foreground tabular-nums leading-none">
          {current.temperature}°
        </span>
        <span className="text-[length:var(--dash-text-sm)] text-muted-foreground capitalize">
          {current.condition}
        </span>
        <div className="flex items-center gap-3 text-[length:var(--dash-text-sm)] text-muted-foreground mt-1">
          <span className="font-medium">H: {current.high}°</span>
          <span>•</span>
          <span className="font-medium">L: {current.low}°</span>
        </div>
      </div>
      <div className="relative w-[var(--dash-logo-lg)] h-[var(--dash-logo-lg)] flex-shrink-0">
        <WeatherIcon iconCode={current.icon} />
      </div>
    </div>
  );
}
