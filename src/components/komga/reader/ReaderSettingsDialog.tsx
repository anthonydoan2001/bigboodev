'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { ReadingMode, getReaderSettings, saveReadingMode } from '@/lib/reader-settings';

interface ReaderSettingsDialogProps {
  seriesId: string;
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: () => void;
}

export function ReaderSettingsDialog({ seriesId, isOpen, onClose, onSettingsChange }: ReaderSettingsDialogProps) {
  const [readingMode, setReadingMode] = useState<ReadingMode>('paged-ltr');

  // Load settings when dialog opens
  useEffect(() => {
    if (isOpen && seriesId) {
      const settings = getReaderSettings(seriesId);
      setReadingMode(settings.readingMode);
    }
  }, [isOpen, seriesId]);

  const handleModeChange = (mode: ReadingMode) => {
    setReadingMode(mode);
    saveReadingMode(seriesId, mode);
    // Notify parent that settings changed
    if (onSettingsChange) {
      onSettingsChange();
    }
    // Also dispatch a custom event for same-tab updates
    window.dispatchEvent(new Event('komga-settings-changed'));
  };

  const readingModes: { value: ReadingMode; label: string; description: string }[] = [
    { value: 'paged-ltr', label: 'Paged (Left to Right)', description: 'One page at a time, navigate left to right' },
    { value: 'paged-rtl', label: 'Paged (Right to Left)', description: 'One page at a time, navigate right to left' },
    { value: 'continuous-ltr', label: 'Continuous (Left to Right)', description: 'Scroll horizontally left to right' },
    { value: 'continuous-rtl', label: 'Continuous (Right to Left)', description: 'Scroll horizontally right to left' },
    { value: 'continuous-vertical', label: 'Continuous (Vertical)', description: 'Scroll vertically' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reader Settings</DialogTitle>
          <DialogDescription>
            Settings are saved per series and apply to all books in this series.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Reading Mode</Label>
            <RadioGroup value={readingMode} onValueChange={(value) => handleModeChange(value as ReadingMode)}>
              <div className="space-y-2">
                {readingModes.map((mode) => (
                  <div
                    key={mode.value}
                    className={cn(
                      "flex items-start space-x-3 space-y-0 rounded-md border p-3 transition-colors",
                      readingMode === mode.value ? "border-primary bg-accent" : "hover:bg-accent/50"
                    )}
                    onClick={() => handleModeChange(mode.value)}
                  >
                    <RadioGroupItem value={mode.value} id={mode.value} className="mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={mode.value} className="cursor-pointer font-normal">
                        {mode.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
