'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useDashboardSettings } from '@/lib/hooks/useDashboardSettings';

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

function parseTargetDate(dateStr: string): Date {
  // Parse ISO date string (e.g. '2026-04-05')
  const [year, month, day] = dateStr.split('-').map(Number);
  let targetDate = new Date(year, month - 1, day);

  // If the date has passed this year, use next year
  const today = getHoustonDate();
  if (targetDate < today) {
    targetDate = new Date(targetDate.getFullYear() + 1, targetDate.getMonth(), targetDate.getDate());
  }

  return targetDate;
}

export function CountdownWidget() {
  const { settings } = useDashboardSettings();
  const [days, setDays] = useState<number | null>(null);
  const [label, setLabel] = useState('April 5th');

  useEffect(() => {
    const dateStr = settings?.countdown?.date;
    const countdownLabel = settings?.countdown?.label || 'April 5th';
    setLabel(countdownLabel);

    const updateCountdown = () => {
      if (dateStr) {
        const target = parseTargetDate(dateStr);
        setDays(calculateDaysUntil(target));
      } else {
        // Fallback: April 5th
        const currentYear = getHoustonDate().getFullYear();
        let target = new Date(currentYear, 3, 5);
        const today = getHoustonDate();
        if (target < today) {
          target = new Date(currentYear + 1, 3, 5);
        }
        setDays(calculateDaysUntil(target));
      }
    };

    updateCountdown();

    // Update every hour to catch day changes
    const interval = setInterval(updateCountdown, 3600000);
    return () => clearInterval(interval);
  }, [settings]);

  return (
    <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 transition-all hover:shadow-md">
      <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] h-full flex flex-col items-center justify-center">
        <span className="text-2xl md:text-[length:var(--dash-text-3xl)] font-bold tabular-nums leading-none">{days ?? '—'}</span>
        <span className="text-[10px] md:text-[length:var(--dash-text-xxs)] text-muted-foreground tracking-wide mt-0.5">days until {label}</span>
      </CardContent>
    </Card>
  );
}
