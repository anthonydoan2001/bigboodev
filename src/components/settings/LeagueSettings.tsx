'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDashboardSettings, useDashboardSettingsMutation } from '@/lib/hooks/useDashboardSettings';
import { Swords, Loader2, CheckCircle } from 'lucide-react';

export function LeagueSettings() {
  const { settings, isLoading } = useDashboardSettings();
  const { save, isSaving } = useDashboardSettingsMutation();

  const [summonerName, setSummonerName] = useState('');
  const [tag, setTag] = useState('');
  const [saveResult, setSaveResult] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.lol) {
      setSummonerName(settings.lol.summonerName);
      setTag(settings.lol.tag);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaveResult(null);
    if (!summonerName || !tag) return;
    try {
      await save({ lol: { summonerName, tag } });
      setSaveResult('Saved');
      setTimeout(() => setSaveResult(null), 2000);
    } catch {
      setSaveResult('Failed to save');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            <CardTitle>League of Legends</CardTitle>
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
          <Swords className="h-5 w-5" />
          <CardTitle>League of Legends</CardTitle>
        </div>
        <CardDescription>
          Set the summoner to track on the League widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="summoner-name">Summoner Name</Label>
          <Input
            id="summoner-name"
            placeholder="e.g. ExoticLime"
            value={summonerName}
            onChange={e => setSummonerName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summoner-tag">Tag</Label>
          <Input
            id="summoner-tag"
            placeholder="e.g. NA1"
            value={tag}
            onChange={e => setTag(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isSaving || !summonerName || !tag}>
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
