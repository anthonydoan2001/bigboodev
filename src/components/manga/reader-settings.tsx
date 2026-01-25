'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMangaStore } from '@/lib/stores/manga-store';
import { ReadingMode } from '@/types/komga';
import {
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Square,
  Columns,
} from 'lucide-react';

interface ReaderSettingsProps {
  open: boolean;
  onClose: () => void;
}

const readingModes: {
  value: ReadingMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'vertical-scroll',
    label: 'Vertical Scroll',
    description: 'Scroll down to read (webtoon style)',
    icon: <ArrowDown className="h-4 w-4" />,
  },
  {
    value: 'horizontal-scroll-ltr',
    label: 'Horizontal Scroll (L→R)',
    description: 'Scroll right to read',
    icon: <ArrowRight className="h-4 w-4" />,
  },
  {
    value: 'horizontal-scroll-rtl',
    label: 'Horizontal Scroll (R→L)',
    description: 'Scroll left to read',
    icon: <ArrowLeft className="h-4 w-4" />,
  },
  {
    value: 'page-ltr',
    label: 'Page-by-Page (L→R)',
    description: 'Single page, tap right for next',
    icon: <Square className="h-4 w-4" />,
  },
  {
    value: 'page-rtl',
    label: 'Page-by-Page (R→L)',
    description: 'Single page, tap left for next (manga)',
    icon: <Columns className="h-4 w-4" />,
  },
];

export function ReaderSettings({ open, onClose }: ReaderSettingsProps) {
  const readingMode = useMangaStore((state) => state.readingMode);
  const setReadingMode = useMangaStore((state) => state.setReadingMode);

  const handleModeChange = (value: string) => {
    setReadingMode(value as ReadingMode);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reader Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Reading Mode</Label>
            <RadioGroup
              value={readingMode}
              onValueChange={handleModeChange}
              className="space-y-3"
            >
              {readingModes.map((mode) => (
                <div
                  key={mode.value}
                  className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleModeChange(mode.value)}
                >
                  <RadioGroupItem value={mode.value} id={mode.value} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={mode.value}
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      {mode.icon}
                      {mode.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {mode.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
