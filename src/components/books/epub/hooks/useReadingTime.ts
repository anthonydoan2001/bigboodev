import { useCallback, useEffect, useState } from 'react';

interface UseReadingTimeOptions {
  totalLocations: number;
  progress: number; // 0-100
}

export function useReadingTime({ totalLocations, progress }: UseReadingTimeOptions) {
  const [readingTimeLeft, setReadingTimeLeft] = useState<string>('');

  const updateReadingTime = useCallback((pct: number, totalLocs: number) => {
    if (totalLocs <= 0) return;
    const remaining = totalLocs * (1 - pct);
    // ~250 words per location unit, ~200 words per minute
    const minutesLeft = Math.round((remaining * 250) / 200);
    if (minutesLeft < 60) {
      setReadingTimeLeft(`~${minutesLeft}m left`);
    } else {
      const hours = Math.floor(minutesLeft / 60);
      const mins = minutesLeft % 60;
      setReadingTimeLeft(`~${hours}h ${mins > 0 ? `${mins}m ` : ''}left`);
    }
  }, []);

  useEffect(() => {
    if (totalLocations > 0) {
      updateReadingTime(progress / 100, totalLocations);
    }
  }, [totalLocations, progress, updateReadingTime]);

  return { readingTimeLeft };
}
