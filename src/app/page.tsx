'use client';

import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { ContinueReadingWidget } from "@/components/dashboard/ContinueReadingWidget";
import { CountdownWidget } from "@/components/dashboard/CountdownWidget";
import { GmailWidget } from "@/components/dashboard/GmailWidget";
import { ImagePlaceholderWidget } from "@/components/dashboard/ImagePlaceholderWidget";
import { LeagueOfLegendsWidget } from "@/components/dashboard/LeagueOfLegendsWidget";
import { PinnedNotesWidget } from "@/components/dashboard/PinnedNotesWidget";
import { RocketsGameWidget } from "@/components/dashboard/RocketsGameWidget";
import { StocksCryptoWidget } from "@/components/dashboard/StocksCryptoWidget";
import { WeatherInline } from "@/components/dashboard/WeatherInline";
import { fetchQuote } from "@/lib/api/quote";
import { fetchWeather } from "@/lib/api/weather";
import { fetchStockQuotes } from "@/lib/api/stocks";
import { fetchCryptoQuotesFromDB } from "@/lib/api/crypto";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useEffect, useState, useMemo, useRef } from "react";

// Memoized greeting calculation - only recalculates when hour changes
function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
}

// Get Houston hour for greeting updates
function getHoustonHour(): number {
  const now = new Date();
  const houstonTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return houstonTime.getHours();
}

// Get today's date string (YYYY-MM-DD) for daily quote refresh - computed once
function getTodayDateString(): string {
  const now = new Date();
  const houstonDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const year = houstonDate.getFullYear();
  const month = String(houstonDate.getMonth() + 1).padStart(2, '0');
  const day = String(houstonDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format time with AM/PM and seconds - optimized to avoid object allocation
function formatTime(date: Date): { time: string; period: string } {
  const houstonTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  let hours = houstonTime.getHours();
  const minutes = houstonTime.getMinutes();
  const seconds = houstonTime.getSeconds();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { time: formattedTime, period };
}

// Memoized Quote Display component to prevent unnecessary re-renders from clock
const QuoteDisplay = memo(function QuoteDisplay({
  quote,
  isLoading
}: {
  quote: { content: string; author: string } | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-6 w-1/2 max-w-lg" />;
  }

  if (quote) {
    return (
      <p className="text-muted-foreground text-base md:text-lg italic font-normal truncate max-w-3xl">
        &ldquo;{quote.content}&rdquo; — {quote.author}
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-base md:text-lg font-normal">
      Here&apos;s what&apos;s happening today
    </p>
  );
});

// Memoized Clock component - isolated re-renders for time updates
const Clock = memo(function Clock() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Use setTimeout to avoid synchronous setState in effect
      const mountTimer = setTimeout(() => {
        setMounted(true);
        setCurrentTime(new Date()); // Sync time on mount
      }, 0);

      const timeInterval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => {
        clearTimeout(mountTimer);
        clearInterval(timeInterval);
      };
    }

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const { time, period } = useMemo(() => formatTime(currentTime), [currentTime]);

  // Show placeholder on server/initial render to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-baseline gap-1 font-mono flex-shrink-0">
        <span className="text-2xl md:text-3xl font-bold tabular-nums opacity-0">00:00:00</span>
        <span className="text-base md:text-lg font-semibold text-muted-foreground opacity-0">AM</span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-1 font-mono flex-shrink-0">
      <span className="text-2xl md:text-3xl font-bold tabular-nums">{time}</span>
      <span className="text-base md:text-lg font-semibold text-muted-foreground">{period}</span>
    </div>
  );
});

export default function Home() {
  const [greeting, setGreeting] = useState(() => getGreeting(getHoustonHour()));
  const [todayDate] = useState(() => getTodayDateString());

  // Fetch quote with daily refresh - query key includes date so it refreshes daily
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', todayDate],
    queryFn: () => fetchQuote(todayDate),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch weather data
  useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch stocks data
  useQuery({
    queryKey: ['stockQuotes'],
    queryFn: fetchStockQuotes,
    staleTime: 3600000,
    refetchInterval: 3600000,
    refetchOnMount: 'always',
  });

  // Fetch crypto data
  useQuery({
    queryKey: ['cryptoQuotes'],
    queryFn: fetchCryptoQuotesFromDB,
    staleTime: 3600000,
    refetchInterval: 3600000,
    refetchOnMount: 'always',
  });

  // Update greeting only when hour changes (check every minute)
  useEffect(() => {
    let lastHour = getHoustonHour();

    const greetingInterval = setInterval(() => {
      const currentHour = getHoustonHour();
      if (currentHour !== lastHour) {
        lastHour = currentHour;
        setGreeting(getGreeting(currentHour));
      }
    }, 60000);

    return () => clearInterval(greetingInterval);
  }, []);

  // Render immediately - don't block on widget loading for better LCP
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col py-4 px-4 sm:px-6 lg:px-8 lg:py-5">
      {/* Compact Header Section */}
      <div className="mb-4 lg:mb-5 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Left: Weather Widget - hidden on mobile, visible md+ */}
          <div className="hidden md:flex flex-shrink-0">
            <WeatherInline />
          </div>

          {/* Right: Greeting, Quote, and Clock */}
          <div className="flex-1 flex flex-col justify-center gap-2 md:gap-4">
            {/* Top: Greeting and Clock */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">{greeting}, Big Boo</h1>
              <Clock />
            </div>
            {/* Bottom: Quote */}
            <QuoteDisplay quote={quote} isLoading={quoteLoading} />
          </div>
        </div>
      </div>

      {/* Dashboard Grid - One page on lg+, scrollable below */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-min lg:auto-rows-fr gap-3 lg:gap-4 h-full content-start lg:content-stretch pb-4 lg:pb-0">
          {/* Column 1: Calendar, Continue Reading + Countdown, Gmail */}
          <div className="col-span-1 flex flex-col gap-3 lg:gap-3 min-h-0">
            <CalendarWidget />
            <div className="grid grid-cols-2 gap-3">
              <ContinueReadingWidget />
              <CountdownWidget />
            </div>
            <div className="flex-1 min-h-0">
              <GmailWidget />
            </div>
          </div>

          {/* Column 2: Image, Pinned Notes, League, Rockets */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col gap-3 lg:gap-3 min-h-0">
            <ImagePlaceholderWidget />
            <div className="pt-1">
              <PinnedNotesWidget />
            </div>
            <div className="flex-1 min-h-0">
              <LeagueOfLegendsWidget />
            </div>
            <RocketsGameWidget />
          </div>

          {/* Column 3: Stocks/Crypto (full column) */}
          <div className="col-span-1 flex flex-col min-h-0">
            <StocksCryptoWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
