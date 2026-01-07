'use client';

import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { useState, useEffect } from "react";

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

export default function Home() {
  const [greeting, setGreeting] = useState("Good Morning");

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
        {/* Welcome Section */}
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening today
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weather Widget */}
          <div className="col-span-1">
            <WeatherWidget />
          </div>

          {/* Placeholder for other widgets */}
          <div className="col-span-1 md:col-span-2 p-6 rounded-xl border bg-card/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground">
            <p>More widgets coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
