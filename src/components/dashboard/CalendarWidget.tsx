'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function getHoustonDate(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
}

export function CalendarWidget() {
  const [currentDate] = useState(() => getHoustonDate());
  const [today] = useState(() => getHoustonDate());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check if a date is today
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };
  
  // Generate calendar days
  const days: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Format current date as M/D/YYYY
  const formatCurrentDate = () => {
    const month = today.getMonth() + 1; // getMonth() returns 0-11
    const day = today.getDate();
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  return (
    <Card className="w-full border-white/10 shadow-sm bg-background/40 backdrop-blur-md py-0 gap-0">
      <CardHeader className="pt-4 pb-2 px-4">
        <div className="flex items-center justify-between px-2">
          <CardTitle className="text-title">
            {monthNames[month]}
          </CardTitle>
          <span className="text-body-sm text-muted-foreground bg-accent/50 px-2 py-1 rounded-md">
            {year}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-caption-sm text-muted-foreground text-center py-1"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={day}
                className={cn(
                  "aspect-square flex items-center justify-center text-body-sm rounded-full",
                  isTodayDate
                    ? "bg-primary text-primary-foreground font-bold shadow-md scale-105"
                    : "text-muted-foreground font-medium"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
