'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDashboardSettings, useDashboardSettingsMutation } from '@/lib/hooks/useDashboardSettings';
import { geocodeLocation, type GeocodingResult } from '@/lib/hooks/useDashboardSettings';
import { Cloud, Loader2, CheckCircle, Search, MapPin } from 'lucide-react';

export function WeatherSettings() {
  const { settings, isLoading } = useDashboardSettings();
  const { save, isSaving } = useDashboardSettingsMutation();

  const [cityQuery, setCityQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [saveResult, setSaveResult] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.weather) {
      setCurrentLocation(settings.weather.name);
    }
  }, [settings]);

  const handleLookup = async () => {
    if (!cityQuery.trim()) return;
    setIsSearching(true);
    setResults([]);
    try {
      const data = await geocodeLocation(cityQuery.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (result: GeocodingResult) => {
    setSaveResult(null);
    const name = result.state
      ? `${result.name}, ${result.state}`
      : `${result.name}, ${result.country}`;
    try {
      await save({
        weather: { lat: result.lat, lon: result.lon, name },
      });
      setCurrentLocation(name);
      setResults([]);
      setCityQuery('');
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
            <Cloud className="h-5 w-5" />
            <CardTitle>Weather Location</CardTitle>
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
          <Cloud className="h-5 w-5" />
          <CardTitle>Weather Location</CardTitle>
        </div>
        <CardDescription>
          Set the location for your weather widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Location</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {currentLocation || 'Not set'}
            {saveResult && (
              <span className="text-success flex items-center gap-1 ml-2">
                <CheckCircle className="h-3.5 w-3.5" />
                {saveResult}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city-search">Search City</Label>
          <div className="flex gap-2">
            <Input
              id="city-search"
              placeholder="e.g. Houston, TX"
              value={cityQuery}
              onChange={e => setCityQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLookup();
                }
              }}
            />
            <Button
              variant="outline"
              onClick={handleLookup}
              disabled={isSearching || !cityQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-1.5">
            <Label>Select a result</Label>
            <div className="space-y-1">
              {results.map((r, i) => {
                const label = r.state
                  ? `${r.name}, ${r.state}, ${r.country}`
                  : `${r.name}, ${r.country}`;
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full justify-start text-sm h-auto py-2"
                    onClick={() => handleSelect(r)}
                    disabled={isSaving}
                  >
                    <MapPin className="h-3.5 w-3.5 mr-2 shrink-0" />
                    {label}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {r.lat}, {r.lon}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
