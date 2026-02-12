'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from './ThemeSelector';
import { WeatherSettings } from './WeatherSettings';
import { PricesSettings } from './PricesSettings';
import { CountdownSettings } from './CountdownSettings';
import { LeagueSettings } from './LeagueSettings';

export function GeneralTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose a theme for your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>
      <WeatherSettings />
      <PricesSettings />
      <CountdownSettings />
      <LeagueSettings />
    </div>
  );
}
