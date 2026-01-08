'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/api/weather';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { getWeatherBackground } from '@/lib/weather-utils';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect, useCallback } from 'react';

export function WeatherWidget() {
  const { data: weather, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const hourlyScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const checkScrollPosition = useCallback(() => {
    if (hourlyScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = hourlyScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    if (weather?.hourly) {
      checkScrollPosition();
      const scrollElement = hourlyScrollRef.current;
      if (scrollElement) {
        scrollElement.addEventListener('scroll', checkScrollPosition);
        return () => scrollElement.removeEventListener('scroll', checkScrollPosition);
      }
    }
  }, [weather?.hourly, checkScrollPosition]);

  if (isLoading) {
    return (
      <Card className="w-full min-h-[600px] md:min-h-[700px] flex items-center justify-center border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="w-full min-h-[600px] md:min-h-[700px] flex items-center justify-center bg-destructive/5 border-destructive/20">
        <button
          onClick={() => refetch()}
          className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
        >
          Retry
        </button>
      </Card>
    );
  }

  const { current, hourly, daily } = weather;
  const bgConfig = getWeatherBackground(current.condition);

  const scrollHourly = (direction: 'left' | 'right') => {
    if (hourlyScrollRef.current) {
      const scrollAmount = 200;
      hourlyScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Format date for daily forecast
  const formatDayLabel = (index: number) => {
    if (index === 0) return 'Today';
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Calculate temperature range for visual bar
  const getTempBarStyle = (day: { high: number; low: number }) => {
    if (daily.length === 0) return { left: '0%', width: '100%' };
    
    const minTemp = Math.min(...daily.map(d => d.low));
    const maxTemp = Math.max(...daily.map(d => d.high));
    const totalRange = maxTemp - minTemp;
    
    if (totalRange === 0) return { left: '0%', width: '100%' };
    
    const barLeft = ((day.low - minTemp) / totalRange) * 100;
    const barWidth = ((day.high - day.low) / totalRange) * 100;
    
    return { left: `${barLeft}%`, width: `${barWidth}%` };
  };

  return (
    <Card className={cn(
      "w-full overflow-hidden border-none shadow-2xl relative transition-all duration-300",
      "h-auto min-h-[200px] md:min-h-[700px]",
      `bg-gradient-to-br ${bgConfig.gradient}`,
      bgConfig.textColor
    )}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000" />
        {current.condition.toLowerCase().includes('snow') && (
          <>
            {[...Array(20)].map((_, i) => {
              // Deterministic values based on index to avoid hydration issues
              const seed = i * 0.618; // Golden ratio for better distribution
              const left = (i * 5) % 100;
              const top = -(seed % 20);
              const delay = (seed % 5);
              const duration = 3 + (seed % 2);
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/60 rounded-full animate-weather-fall"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                />
              );
            })}
          </>
        )}
        {current.condition.toLowerCase().includes('rain') && (
          <>
            {[...Array(30)].map((_, i) => {
              // Deterministic values based on index to avoid hydration issues
              const seed = i * 0.618; // Golden ratio for better distribution
              const left = (i * 3.33) % 100;
              const top = -(seed % 20);
              const delay = (seed % 2);
              const duration = 0.5 + (seed % 0.5);
              return (
                <div
                  key={i}
                  className="absolute w-0.5 h-8 bg-white/40 animate-weather-rain-drop"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                />
              );
            })}
          </>
        )}
      </div>

      {/* Refresh button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            "p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm",
            isFetching && "animate-spin"
          )}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <CardContent className="p-6 md:p-8 relative z-10 flex flex-col h-full justify-between gap-6 md:gap-8">
        {/* Header: Location & Temperature */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">
            {current.location}
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-7xl md:text-8xl font-light tracking-tighter leading-none">
                {current.temperature}°
              </span>
              <span className="text-lg md:text-2xl font-medium capitalize mt-1 opacity-90">
                {current.condition}
              </span>
              <div className="flex gap-3 text-sm md:text-base font-medium opacity-80 mt-1">
                <span>H: {current.high}°</span>
                <span>L: {current.low}°</span>
              </div>
            </div>
            <div className="relative w-24 h-24 md:w-32 md:h-32 -mr-2">
              <Image
                src={`https://openweathermap.org/img/wn/${current.icon}@4x.png`}
                alt={current.condition}
                fill
                className="object-contain drop-shadow-lg"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="hidden md:block relative -mx-2 px-2 py-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none rounded-l-xl" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent z-10 pointer-events-none rounded-r-xl" />
          
          {/* Left Arrow - Desktop only */}
          {canScrollLeft && (
            <button
              onClick={() => scrollHourly('left')}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all shadow-lg border border-white/10"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
          )}
          
          {/* Right Arrow - Desktop only */}
          {canScrollRight && (
            <button
              onClick={() => scrollHourly('right')}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all shadow-lg border border-white/10"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          )}

          <div
            ref={hourlyScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-4"
          >
            {hourly.slice(0, 12).map((hour, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 min-w-[4.5rem] flex-shrink-0"
              >
                <span className="text-sm font-medium opacity-80 whitespace-nowrap">
                  {hour.time}
                </span>
                <div className="relative w-10 h-10">
                  <Image
                    src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                    alt={hour.condition}
                    fill
                    className="object-contain drop-shadow-sm"
                    unoptimized
                  />
                </div>
                {hour.precipitation > 20 && (
                  <span className="text-xs font-bold text-blue-200">
                    {hour.precipitation}%
                  </span>
                )}
                <span className="text-lg font-semibold tracking-tight">
                  {hour.temperature}°
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Day Forecast */}
        <div className="hidden md:block bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-4">
          <div className="space-y-4">
            {daily.slice(0, 3).map((day, index) => {
              const barStyle = getTempBarStyle(day);

              return (
                <div
                  key={index}
                  className="flex items-center gap-4 text-sm md:text-base"
                >
                  <div className="w-14 font-medium opacity-90">
                    {formatDayLabel(index)}
                  </div>
                  
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <Image
                      src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                      alt={day.condition}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <span className="w-8 text-right opacity-80 tabular-nums">
                      {day.low}°
                    </span>
                    
                    <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden relative">
                      <div
                        className="absolute h-full bg-gradient-to-r from-blue-200 to-yellow-200 rounded-full opacity-80"
                        style={barStyle}
                      />
                    </div>
                    
                    <span className="w-8 text-right font-medium tabular-nums">
                      {day.high}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
