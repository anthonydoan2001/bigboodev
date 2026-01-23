import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const formatDate = (date: Date) => {
    const today = new Date();

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevDay}
        className="h-8 w-8 hover:bg-transparent hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <span className="text-xl font-semibold min-w-[140px] text-center tracking-tight" suppressHydrationWarning>
        {isHydrated ? formatDate(selectedDate) : '\u00A0'}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        className="h-8 w-8 hover:bg-transparent hover:text-primary transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

