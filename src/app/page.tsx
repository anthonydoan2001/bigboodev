'use client';

import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { StocksCryptoWidget } from "@/components/dashboard/StocksCryptoWidget";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { fetchQuote } from "@/lib/api/quote";
import { fetchWeather } from "@/lib/api/weather";
import { fetchStockQuotes } from "@/lib/api/stocks";
import { fetchCryptoQuotesFromDB } from "@/lib/api/crypto";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function getGreeting(): string {
  // Get current time in Houston, TX (America/Chicago timezone)
  const now = new Date();
  const houstonTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hour = houstonTime.getHours();

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

// Get today's date string (YYYY-MM-DD) for daily quote refresh
function getTodayDateString(): string {
  const now = new Date();
  // Format date in Houston timezone (America/Chicago)
  const houstonDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const year = houstonDate.getFullYear();
  const month = String(houstonDate.getMonth() + 1).padStart(2, '0');
  const day = String(houstonDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format time with AM/PM and seconds
function formatTime(date: Date): { time: string; period: string } {
  const houstonTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  let hours = houstonTime.getHours();
  const minutes = houstonTime.getMinutes();
  const seconds = houstonTime.getSeconds();
  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { time: formattedTime, period };
}

export default function Home() {
  const [greeting, setGreeting] = useState("Good Morning");
  const [todayDate] = useState(() => getTodayDateString());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch quote with daily refresh - query key includes date so it refreshes daily
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', todayDate],
    queryFn: () => fetchQuote(todayDate),
    staleTime: Infinity, // Don't refetch on same day
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
  });

  // Fetch crypto data
  const { isLoading: cryptoLoading } = useQuery({
    queryKey: ['cryptoQuotes'],
    queryFn: fetchCryptoQuotesFromDB,
    staleTime: 3600000,
    refetchInterval: 3600000,
  });

  // Check if all widgets are loading
  const isLoading = quoteLoading || weatherLoading || stocksLoading || cryptoLoading;

  useEffect(() => {
    setGreeting(getGreeting());
    setCurrentTime(new Date());

    // Update greeting every minute
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(greetingInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Show loading state until all widgets are ready
  if (isLoading) {
    return (
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { time, period } = formatTime(currentTime);

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Header Section with Weather */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Left: Weather Widget */}
        <div className="lg:w-80 flex-shrink-0">
          <WeatherWidget />
        </div>

        {/* Right: Greeting & Quote */}
        <div className="space-y-3 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-display-lg">{greeting}, Big Boo</h1>

            {/* Time Display */}
            <div className="flex items-baseline gap-1.5 font-mono flex-shrink-0">
              <span className="text-3xl md:text-4xl font-bold tabular-nums">{time}</span>
              <span className="text-lg md:text-xl font-semibold text-muted-foreground">{period}</span>
            </div>
          </div>

          {quoteLoading ? (
            <div className="h-8 w-3/4 max-w-2xl bg-muted/20 animate-pulse rounded-md" />
          ) : quote ? (
            <p className="text-muted-foreground text-title-lg italic font-normal">
              "{quote.content}" — {quote.author}
            </p>
          ) : (
            <p className="text-muted-foreground text-title-lg font-normal">
              Here's what's happening today
            </p>
          )}
        </div>
      </div>

      {/* Bento-style Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-auto gap-4 md:gap-6">
        {/* Calendar Widget */}
        <div className="col-span-1">
          <CalendarWidget />
        </div>

        {/* Stocks & Crypto Widget */}
        <div className="col-span-1">
          <StocksCryptoWidget />
        </div>
      </div>
    </div>
  );
}
