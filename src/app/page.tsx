'use client';

import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { ContinueReadingWidget } from "@/components/dashboard/ContinueReadingWidget";
import { CountdownWidget } from "@/components/dashboard/CountdownWidget";
import { GmailWidget } from "@/components/dashboard/GmailWidget";
import { PinnedNotesWidget } from "@/components/dashboard/PinnedNotesWidget";
import { RocketsGameWidget } from "@/components/dashboard/RocketsGameWidget";
import { StocksCryptoWidget } from "@/components/dashboard/StocksCryptoWidget";
import { WeatherInline } from "@/components/dashboard/WeatherInline";
import { fetchQuote } from "@/lib/api/quote";
import { fetchWeather } from "@/lib/api/weather";
import { fetchStockQuotes } from "@/lib/api/stocks";
import { fetchCryptoQuotesFromDB } from "@/lib/api/crypto";
import { useQuery } from "@tanstack/react-query";
import { memo, useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";

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
    return <div className="h-6 w-1/2 max-w-lg bg-muted/20 animate-pulse rounded-md" />;
  }

  if (quote) {
    return (
      <p className="text-muted-foreground text-base md:text-lg italic font-normal truncate max-w-3xl">
        "{quote.content}" — {quote.author}
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-base md:text-lg font-normal">
      Here's what's happening today
    </p>
  );
});

// Memoized Clock component - isolated re-renders for time updates
const Clock = memo(function Clock() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date()); // Sync time on mount

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
  const { isLoading: weatherLoading } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch stocks data
  const { isLoading: stocksLoading } = useQuery({
    queryKey: ['stockQuotes'],
    queryFn: fetchStockQuotes,
    staleTime: 3600000,
    refetchInterval: 3600000,
    refetchOnMount: 'always',
  });

  // Fetch crypto data
  const { isLoading: cryptoLoading } = useQuery({
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
    <div className="w-full h-screen overflow-hidden flex flex-col py-6 px-4 sm:px-6 lg:px-8">
      {/* Compact Header Section */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex gap-6">
          {/* Left: Weather Widget - stretches to match height */}
          <div className="flex-shrink-0 flex">
            <WeatherInline />
          </div>

          {/* Right: Greeting, Quote, and Clock */}
          <div className="flex-1 flex flex-col justify-center gap-4">
            {/* Top: Greeting and Clock */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">{greeting}, Big Boo</h1>
              <Clock />
            </div>
            {/* Bottom: Quote */}
            <QuoteDisplay quote={quote} isLoading={quoteLoading} />
          </div>
        </div>
      </div>

      {/* Optimized Dashboard Grid - Viewport Aware */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-min gap-4 h-full content-start overflow-y-auto scrollbar-hide pb-4">
          {/* Mobile: Stacked (scroll allowed) */}
          {/* Tablet (768px): 2 columns */}
          {/* Laptop (1024px): 3 columns */}

          {/* Calendar Widget with Countdown and Continue Reading in a row below */}
          <div className="col-span-1 flex flex-col gap-4">
            <CalendarWidget />
            <div className="grid grid-cols-2 gap-4">
              <ContinueReadingWidget />
              <CountdownWidget />
            </div>
          </div>

          {/* Gmail Widget with Pinned Notes stacked below */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col gap-4">
            <GmailWidget />
            <PinnedNotesWidget />
          </div>

          {/* Rockets Game Widget with Stocks stacked below */}
          <div className="col-span-1 flex flex-col gap-4">
            <RocketsGameWidget />
            <StocksCryptoWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
