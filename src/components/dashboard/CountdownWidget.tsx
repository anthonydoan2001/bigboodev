'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

function getHoustonDate(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
}

function calculateDaysUntil(targetDate: Date): number {
  const today = getHoustonDate();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffTime = targetStart.getTime() - todayStart.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function CountdownWidget() {
  const [daysUntil, setDaysUntil] = useState(() => {
    const currentYear = getHoustonDate().getFullYear();
    const targetDate = new Date(currentYear, 3, 5); // April 5th (month is 0-indexed)

    // If April 5th has passed this year, use next year
    const today = getHoustonDate();
    if (targetDate < today) {
      return new Date(currentYear + 1, 3, 5);
    }
    return targetDate;
  });

  const [days, setDays] = useState(() => calculateDaysUntil(daysUntil));

  useEffect(() => {
    // Update countdown daily
    const updateCountdown = () => {
      const currentYear = getHoustonDate().getFullYear();
      let targetDate = new Date(currentYear, 3, 5); // April 5th

      const today = getHoustonDate();
      if (targetDate < today) {
        targetDate = new Date(currentYear + 1, 3, 5);
      }

      setDaysUntil(targetDate);
      setDays(calculateDaysUntil(targetDate));
    };

    updateCountdown();

    // Update every hour to catch day changes
    const interval = setInterval(updateCountdown, 3600000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 transition-all hover:shadow-md">
      <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] flex items-center gap-2 md:gap-[var(--dash-gap-sm)]">
        <span className="text-2xl md:text-[length:var(--dash-text-3xl)] font-bold tabular-nums">{days}</span>
        <span className="text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground tracking-wide">days until April 5th</span>
      </CardContent>
    </Card>
  );
}
