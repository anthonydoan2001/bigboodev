'use client';

import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { StocksCryptoWidget } from "@/components/dashboard/StocksCryptoWidget";
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
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area - Shows first on mobile */}
        <div className="order-1 lg:order-2 lg:col-span-3 flex flex-col gap-6">
          {/* Header Section */}
          <div className="space-y-2 py-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{greeting}</h1>
            {quoteLoading ? (
              <p className="text-muted-foreground text-xl md:text-2xl animate-pulse">
                Loading quote...
              </p>
            ) : quote ? (
              <p className="text-muted-foreground text-xl md:text-2xl italic">
                "{quote.content}" — {quote.author}
              </p>
            ) : (
              <p className="text-muted-foreground text-xl md:text-2xl">
                Here's what's happening today
              </p>
            )}
          </div>

          {/* Stocks & Crypto Widget */}
          <div className="flex-1">
            <StocksCryptoWidget />
          </div>
        </div>

        {/* Left Sidebar Column - Shows second on mobile */}
        <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
          <WeatherWidget />
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}
