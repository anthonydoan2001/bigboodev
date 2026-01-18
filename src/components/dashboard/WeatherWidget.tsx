'use client';

import { Card, CardContent } from '@/components/ui/card';
import { fetchWeather } from '@/lib/api/weather';
import { useQuery } from '@tanstack/react-query';
import { WeatherIcon } from './WeatherIcon';

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
      <Card className="w-full h-[180px] bg-background/40 backdrop-blur-md border-white/10 shadow-sm overflow-hidden py-0 gap-0">
        <CardContent className="p-6 h-full flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-12 w-20 bg-muted/30 animate-pulse rounded-md" />
            <div className="h-5 w-24 bg-muted/20 animate-pulse rounded-md" />
            <div className="flex gap-3">
              <div className="h-4 w-12 bg-muted/20 animate-pulse rounded-md" />
              <div className="h-4 w-12 bg-muted/20 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="w-24 h-24 bg-muted/20 animate-pulse rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="w-full h-[180px] bg-background/40 backdrop-blur-md border-white/10 shadow-sm flex items-center justify-center py-0 gap-0">
        <p className="text-body-sm text-muted-foreground">Failed to load weather</p>
      </Card>
    );
  }

  const { current } = weather;

  return (
    <Card className="w-full h-[180px] bg-background/40 backdrop-blur-md border-white/10 shadow-sm overflow-hidden py-0 gap-0">
      <CardContent className="p-6 h-full flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-display font-light text-foreground">
              {current.temperature}°
            </span>
          </div>
          <span className="text-body text-muted-foreground capitalize mt-1">
            {current.condition}
          </span>
          <div className="flex gap-3 text-body-sm text-muted-foreground mt-2">
            <span className="font-medium">H: {current.high}°</span>
            <span className="font-medium">L: {current.low}°</span>
          </div>
        </div>
        <div className="relative w-28 h-28 flex-shrink-0">
          <WeatherIcon iconCode={current.icon} />
        </div>
      </CardContent>
    </Card>
  );
}
