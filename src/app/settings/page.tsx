'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

interface ApiUsageStat {
  apiName: string;
  displayName: string;
  limits: {
    perSecond?: number;
    perMinute?: number;
    perHour?: number;
    perDay?: number;
    perMonth?: number;
  };
  usage: {
    perSecond?: { count: number; limit?: number; percentage: number; unit: string };
    perMinute?: { count: number; limit?: number; percentage: number; unit: string };
    perHour?: { count: number; limit?: number; percentage: number; unit: string };
    perDay?: { count: number; limit?: number; percentage: number; unit: string };
    perMonth?: { count: number; limit?: number; percentage: number; unit: string };
  };
  successCount: number;
  errorCount: number;
}

export default function SettingsPage() {
  const [apiStats, setApiStats] = useState<ApiUsageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiUsage();
    // Refresh every 60 seconds (reduced from 30s for better performance)
    const interval = setInterval(fetchApiUsage, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchApiUsage = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/api-usage');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API usage fetch failed:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch API usage (${response.status})`);
      }
      const data = await response.json();
      setApiStats(data.stats || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching API usage:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load API usage statistics';
      setError(errorMessage);

      // If it's a database error (table doesn't exist), show helpful message
      if (errorMessage.includes('does not exist') || errorMessage.includes('api_usage')) {
        setError('Database table not found. Please run: npx prisma migrate deploy');
      }
    } finally {
      setLoading(false);
    }
  };

  // Memoized helper functions
  const formatLimit = useCallback((limit: number, unit: string): string => {
    const unitMap: Record<string, string> = {
      second: '/sec',
      minute: '/min',
      hour: '/hr',
      day: '/day',
      month: '/mo',
    };
    return `${limit}${unitMap[unit] || ''}`;
  }, []);

  const getUsageColor = useCallback((percentage: number): string => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-muted-foreground';
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your API usage and rate limits
          </p>
        </div>

        {loading && apiStats.length === 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-24 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-destructive font-semibold">{error}</p>
              {error.includes('Database table not found') || error.includes('migration') ? (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    To set up API usage tracking, run:
                  </p>
                  <code className="block p-2 bg-background rounded text-sm">
                    npx prisma migrate deploy
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Or in development: <code>npx prisma migrate dev</code>
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {apiStats.map((stat) => {
              // Get the most relevant limit to display (prioritize shorter time periods)
              const usageEntries = Object.entries(stat.usage).filter(
                ([_, value]) => value.limit !== undefined
              );

              if (usageEntries.length === 0) {
                return (
                  <Card key={stat.apiName}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {stat.displayName}
                        <Badge variant="outline">
                          {stat.successCount} requests
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        No rate limits configured
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Success:</span>
                          <span className="text-green-600 dark:text-green-500">
                            {stat.successCount}
                          </span>
                        </div>
                        {stat.errorCount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Errors:</span>
                            <span className="text-destructive">{stat.errorCount}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={stat.apiName}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {stat.displayName}
                      <Badge variant="outline">
                        {stat.successCount} requests
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Rate limit monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Display all available limits */}
                    {stat.usage.perSecond && stat.usage.perSecond.limit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Per Second
                          </span>
                          <span className={getUsageColor(stat.usage.perSecond.percentage)}>
                            {stat.usage.perSecond.count} / {formatLimit(stat.usage.perSecond.limit, 'second')} ({stat.usage.perSecond.percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={stat.usage.perSecond.count}
                          max={stat.usage.perSecond.limit}
                        />
                      </div>
                    )}

                    {stat.usage.perMinute && stat.usage.perMinute.limit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Per Minute
                          </span>
                          <span className={getUsageColor(stat.usage.perMinute.percentage)}>
                            {stat.usage.perMinute.count} / {formatLimit(stat.usage.perMinute.limit, 'minute')} ({stat.usage.perMinute.percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={stat.usage.perMinute.count}
                          max={stat.usage.perMinute.limit}
                        />
                      </div>
                    )}

                    {stat.usage.perHour && stat.usage.perHour.limit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Per Hour
                          </span>
                          <span className={getUsageColor(stat.usage.perHour.percentage)}>
                            {stat.usage.perHour.count} / {formatLimit(stat.usage.perHour.limit, 'hour')} ({stat.usage.perHour.percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={stat.usage.perHour.count}
                          max={stat.usage.perHour.limit}
                        />
                      </div>
                    )}

                    {stat.usage.perDay && stat.usage.perDay.limit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Per Day
                          </span>
                          <span className={getUsageColor(stat.usage.perDay.percentage)}>
                            {stat.usage.perDay.count} / {formatLimit(stat.usage.perDay.limit, 'day')} ({stat.usage.perDay.percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={stat.usage.perDay.count}
                          max={stat.usage.perDay.limit}
                        />
                      </div>
                    )}

                    {stat.usage.perMonth && stat.usage.perMonth.limit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Per Month
                          </span>
                          <span className={getUsageColor(stat.usage.perMonth.percentage)}>
                            {stat.usage.perMonth.count} / {formatLimit(stat.usage.perMonth.limit, 'month')} ({stat.usage.perMonth.percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={stat.usage.perMonth.count}
                          max={stat.usage.perMonth.limit}
                        />
                      </div>
                    )}

                    {/* Success/Error counts */}
                    <div className="pt-2 border-t space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Success:</span>
                        <span className="text-green-600 dark:text-green-500">
                          {stat.successCount}
                        </span>
                      </div>
                      {stat.errorCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Errors:</span>
                          <span className="text-destructive">{stat.errorCount}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
