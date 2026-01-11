'use client';

import { CryptoWidget } from "@/components/dashboard/CryptoWidget";
import { StocksWidget } from "@/components/dashboard/StocksWidget";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { fetchQuote } from "@/lib/api/quote";
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

export default function Home() {
  const [greeting, setGreeting] = useState("Good Morning");
  const [todayDate] = useState(() => getTodayDateString());

  // Fetch quote with daily refresh - query key includes date so it refreshes daily
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', todayDate],
    queryFn: () => fetchQuote(todayDate),
    staleTime: Infinity, // Don't refetch on same day
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setGreeting(getGreeting());
    // Update greeting every minute
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto py-8 px-8 min-h-screen max-w-full">
      <div className="w-full space-y-8">
        {/* Welcome Section with Weather Inline */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{greeting}</h1>
            {quoteLoading ? (
              <p className="text-muted-foreground text-xl sm:text-2xl md:text-3xl animate-pulse">
                Loading quote...
              </p>
            ) : quote ? (
              <p className="text-muted-foreground text-xl sm:text-2xl md:text-3xl italic">
                "{quote.content}" — {quote.author}
              </p>
            ) : (
              <p className="text-muted-foreground text-xl sm:text-2xl md:text-3xl">
                Here's what's happening today
              </p>
            )}
          </div>
          
          {/* Weather Widget Inline */}
          <div className="flex-shrink-0">
            <WeatherWidget />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stocks Widget */}
          <StocksWidget />

          {/* Crypto Widget */}
          <CryptoWidget />
        </div>
      </div>
    </div>
  );
}
