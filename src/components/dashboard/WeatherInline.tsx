'use client';

import { fetchWeather } from '@/lib/api/weather';
import { useQuery } from '@tanstack/react-query';
import { WeatherIcon } from './WeatherIcon';
import { Cloud, Loader2 } from 'lucide-react';

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
      <div className="flex items-center justify-between gap-8 px-6 py-4 rounded-lg bg-background/40 backdrop-blur-md border border-white/10 min-w-[360px] h-full">
        <div className="flex flex-col items-start gap-2">
          <span className="text-5xl font-bold text-foreground tabular-nums leading-none">--°</span>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
        <Loader2 className="h-20 w-20 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex items-center justify-between gap-8 px-6 py-4 rounded-lg bg-background/40 backdrop-blur-md border border-white/10 min-w-[360px] h-full">
        <div className="flex flex-col items-start gap-2">
          <span className="text-5xl font-bold text-foreground tabular-nums leading-none">--°</span>
          <span className="text-sm text-muted-foreground">Unavailable</span>
        </div>
        <Cloud className="h-20 w-20 text-muted-foreground/50" />
      </div>
    );
  }

  const { current } = weather;

  return (
    <div className="flex items-center justify-between gap-8 px-6 py-4 rounded-lg bg-background/40 backdrop-blur-md border border-white/10 min-w-[360px] h-full">
      <div className="flex flex-col items-start gap-2">
        <span className="text-5xl font-bold text-foreground tabular-nums leading-none">
          {current.temperature}°
        </span>
        <span className="text-sm text-muted-foreground capitalize">
          {current.condition}
        </span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span className="font-medium">H: {current.high}°</span>
          <span>•</span>
          <span className="font-medium">L: {current.low}°</span>
        </div>
      </div>
      <div className="relative w-20 h-20 flex-shrink-0">
        <WeatherIcon iconCode={current.icon} />
      </div>
    </div>
  );
}
