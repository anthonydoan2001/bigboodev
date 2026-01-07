'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/api/weather';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Droplets, Wind, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';

export function WeatherWidget() {
  const { data: weather, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="w-full aspect-video min-h-[300px] flex items-center justify-center border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="w-full aspect-video min-h-[300px] flex items-center justify-center bg-destructive/5 border-destructive/20">
        <button
          onClick={() => refetch()}
          className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
        >
          Retry
        </button>
      </Card>
    );
  }

  const { current, hourly } = weather;

  return (
    <Card className="w-full overflow-hidden border-none shadow-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 relative text-white group">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute top-0 right-0 p-4 z-20">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isFetching ? 'animate-spin' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <RefreshCw className="h-4 w-4 text-white/80" />
        </button>
      </div>

      <div className="p-6 relative z-10 flex flex-col h-full justify-between gap-6">
        {/* Top Section: Location & Main Temp */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">{current.location}</h2>
            <p className="text-white/80 text-sm font-medium capitalize flex items-center gap-2">
              {current.condition}
              <span className="w-1 h-1 rounded-full bg-white/60" />
              Feels {current.feelsLike}°
            </p>
          </div>
          <div className="text-right">
            <span className="text-6xl font-bold tracking-tighter leading-none">
              {current.temperature}°
            </span>
          </div>
        </div>

        {/* Middle Section: Key Stats (Compact) */}
        <div className="flex gap-6 items-center text-sm font-medium">
          <div className="flex items-center gap-2 text-white/90">
            <div className="flex gap-0.5">
              <ArrowUp className="h-4 w-4" />
              <span>{current.high}°</span>
            </div>
            <div className="flex gap-0.5 text-white/60">
              <ArrowDown className="h-4 w-4" />
              <span>{current.low}°</span>
            </div>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-1.5 text-white/90">
            <Wind className="h-4 w-4" />
            <span>{current.windSpeed} mph</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-1.5 text-white/90">
            <Droplets className="h-4 w-4" />
            <span>{current.humidity}%</span>
          </div>
        </div>

        {/* Bottom Section: Hourly Forecast */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-none">
            {hourly.slice(0, 5).map((hour, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
                <span className="text-[10px] text-white/70 font-medium uppercase whitespace-nowrap">{hour.time}</span>
                <Image
                  src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                  alt={hour.condition}
                  width={32}
                  height={32}
                  className="w-8 h-8 opacity-90"
                />
                <span className="text-sm font-bold">{hour.temperature}°</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}



