'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDashboardSettings, useDashboardSettingsMutation } from '@/lib/hooks/useDashboardSettings';
import { Timer, Loader2, CheckCircle } from 'lucide-react';

export function CountdownSettings() {
  const { settings, isLoading } = useDashboardSettings();
  const { save, isSaving } = useDashboardSettingsMutation();

  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');
  const [saveResult, setSaveResult] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.countdown) {
      setDate(settings.countdown.date);
      setLabel(settings.countdown.label);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaveResult(null);
    if (!date || !label) return;
    try {
      await save({ countdown: { date, label } });
      setSaveResult('Saved');
      setTimeout(() => setSaveResult(null), 2000);
    } catch {
      setSaveResult('Failed to save');
    }
  };

  const daysUntil = (() => {
    if (!date) return null;
    const target = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  })();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <CardTitle>Countdown</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          <CardTitle>Countdown</CardTitle>
        </div>
        <CardDescription>
          Set the target date for the countdown widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="countdown-date">Target Date</Label>
          <Input
            id="countdown-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="countdown-label">Label</Label>
          <Input
            id="countdown-label"
            placeholder="e.g. April 5th"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>

        {daysUntil !== null && label && (
          <div className="text-sm text-muted-foreground">
            Preview: <span className="font-medium text-foreground">{daysUntil}</span> days until {label}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isSaving || !date || !label}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
          {saveResult && (
            <span className="text-sm text-success flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {saveResult}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
