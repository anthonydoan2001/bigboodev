'use client';

import { fetchWeather } from '@/lib/api/weather';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import Image from 'next/image';

export function WeatherWidget() {
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 0, // Always consider stale to refetch on mount
    refetchOnMount: true, // Refetch when component mounts (visiting home page)
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Failed to load weather</p>
      </div>
    );
  }

  const { current } = weather;

  return (
    <div className="flex items-center gap-4 md:gap-5">
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
        <Image
          src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
          alt={current.condition}
          fill
          className="object-contain"
          unoptimized
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
            {current.temperature}°
          </span>
        </div>
        <span className="text-sm md:text-base text-muted-foreground capitalize mt-0.5">
          {current.condition}
        </span>
        <div className="flex gap-3 text-sm text-muted-foreground mt-1">
          <span>H: {current.high}°</span>
          <span>L: {current.low}°</span>
        </div>
      </div>
    </div>
  );
}
