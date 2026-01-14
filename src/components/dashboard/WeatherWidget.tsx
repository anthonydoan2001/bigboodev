'use client';

import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm h-full flex items-center justify-center min-h-[140px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm h-full flex items-center justify-center min-h-[140px]">
        <p className="text-sm text-muted-foreground">Failed to load weather</p>
      </Card>
    );
  }

  const { current } = weather;

  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm overflow-hidden">
      <CardContent className="p-6 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
              {current.temperature}°
            </span>
          </div>
          <span className="text-base text-muted-foreground capitalize mt-1 font-medium">
            {current.condition}
          </span>
          <div className="flex gap-3 text-sm text-muted-foreground mt-2">
            <span className="font-medium">H: {current.high}°</span>
            <span className="font-medium">L: {current.low}°</span>
          </div>
        </div>
        <div className="relative w-24 h-24 flex-shrink-0 -mr-2">
          <Image
            src={`https://openweathermap.org/img/wn/${current.icon}@4x.png`}
            alt={current.condition}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </CardContent>
    </Card>
  );
}
