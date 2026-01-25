'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface MonthOption {
  value: string;
  label: string;
  month: number;
  year: number;
}

interface MonthYearFilterProps {
  options: MonthOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function MonthYearFilter({ options, value, onChange }: MonthYearFilterProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={(newValue) => onChange(newValue === 'all' ? null : newValue)}
    >
      <SelectTrigger className="w-[180px]">
        <Calendar className="h-4 w-4 mr-2 opacity-50" />
        <SelectValue placeholder="All Time" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Time</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
