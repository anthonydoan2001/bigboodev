/**
 * Enhanced API Tracking Middleware
 *
 * Usage:
 *
 * const tracker = new ApiTracker({ apiName: 'finnhub', endpoint: '/quote' });
 * try {
 *   const data = await fetchSomething();
 *   await tracker.trackSuccess();
 *   return data;
 * } catch (error) {
 *   await tracker.trackError({ ... });
 *   throw error;
 * }
 *
 * Or use the helper:
 *
 * const data = await withTracking(
 *   { apiName: 'finnhub', endpoint: '/quote' },
 *   async (tracker) => {
 *     const data = await fetchSomething();
 *     await tracker.trackSuccess();
 *     return data;
 *   }
 * );
 */

import { db } from './db';
import { ApiName } from './api-usage';

export interface TrackingOptions {
  apiName: ApiName;
  endpoint?: string;
  method?: string;
  costCredits?: number;
  userId?: string;
}

export interface ErrorDetails {
  statusCode?: number;
  errorType?: 'RATE_LIMIT' | 'TIMEOUT' | 'SERVER_ERROR' | 'CLIENT_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  errorMessage?: string;
}

export class ApiTracker {
  private startTime: number;
  private options: TrackingOptions;
  private requestSize?: number;

  constructor(options: TrackingOptions) {
    this.startTime = Date.now();
    this.options = options;
  }

  /**
   * Set the request size in bytes (optional)
   */
  setRequestSize(size: number) {
    this.requestSize = size;
  }

  /**
   * Track a successful API call
   */
  async trackSuccess(responseSize?: number, cached: boolean = false) {
    const responseTime = Date.now() - this.startTime;

    await this.track({
      success: true,
      statusCode: 200,
      responseTime,
      responseSize,
      cached,
    });
  }

  /**
   * Track a failed API call
   */
  async trackError(error: ErrorDetails) {
    const responseTime = Date.now() - this.startTime;

    await this.track({
      success: false,
      statusCode: error.statusCode,
      errorType: error.errorType,
      errorMessage: error.errorMessage?.substring(0, 5000), // Limit to 5000 chars
      responseTime,
    });
  }

  /**
   * Internal tracking method
   */
  private async track(data: {
    success: boolean;
    statusCode?: number;
    errorType?: string;
    errorMessage?: string;
    responseTime?: number;
    responseSize?: number;
    cached?: boolean;
  }) {
    try {
      // Check if apiUsage model exists
      if (!('apiUsage' in db) || !db.apiUsage) {
        return; // Silently fail if model doesn't exist
      }

      await db.apiUsage.create({
        data: {
          apiName: this.options.apiName,
          endpoint: this.options.endpoint,
          method: this.options.method || 'GET',
          success: data.success,
          statusCode: data.statusCode,
          errorType: data.errorType,
          errorMessage: data.errorMessage,
          responseTime: data.responseTime,
          requestSize: this.requestSize,
          responseSize: data.responseSize,
          costCredits: this.options.costCredits,
          cached: data.cached || false,
          userId: this.options.userId,
        },
      });

      // Check alerts asynchronously (don't block)
      if (!data.success || data.errorType === 'RATE_LIMIT') {
        this.checkAlerts().catch(err =>
          console.error('Alert check failed:', err)
        );
      }
    } catch (error) {
      // Don't throw - tracking failures shouldn't break the app
      if (error instanceof Error && !error.message.includes('undefined')) {
        console.error(`Failed to track API usage:`, error);
      }
    }
  }

  /**
   * Check if any alerts should be triggered
   * This can be expanded to send notifications, webhooks, etc.
   */
  private async checkAlerts() {
    try {
      if (!('apiAlert' in db) || !db.apiAlert) {
        return;
      }

      // Get active alerts for this API
      const alerts = await db.apiAlert.findMany({
        where: {
          apiName: this.options.apiName,
          enabled: true,
        },
      });

      const now = new Date();

      for (const alert of alerts) {
        // Calculate time window based on period
        const timeWindow = this.getTimeWindow(alert.period);
        const startTime = new Date(now.getTime() - timeWindow);

        // Count recent requests
        const count = await db.apiUsage.count({
          where: {
            apiName: this.options.apiName,
            timestamp: { gte: startTime },
          },
        });

        // Get the limit for this period
        const limit = this.getLimit(this.options.apiName, alert.period);

        if (!limit) continue;

        // Check if threshold is exceeded
        const percentage = (count / limit) * 100;

        if (percentage >= alert.threshold) {
          // Trigger alert (only once per hour to avoid spam)
          const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

          if (!alert.lastTriggered || alert.lastTriggered < hourAgo) {
            await this.triggerAlert(alert, count, limit, percentage);

            // Update last triggered time
            await db.apiAlert.update({
              where: { id: alert.id },
              data: { lastTriggered: now },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  private getTimeWindow(period: string): number {
    switch (period) {
      case 'SECOND': return 1000;
      case 'MINUTE': return 60 * 1000;
      case 'HOUR': return 60 * 60 * 1000;
      case 'DAY': return 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default to minute
    }
  }

  private getLimit(apiName: string, period: string): number | null {
    // This would fetch from your API_LIMITS config
    // For now, return null - implement based on your needs
    return null;
  }

  private async triggerAlert(alert: any, count: number, limit: number, percentage: number) {
    console.warn(`🚨 API Alert Triggered: ${alert.apiName}`);
    console.warn(`   Type: ${alert.alertType}`);
    console.warn(`   Usage: ${count}/${limit} (${percentage.toFixed(1)}%)`);
    console.warn(`   Threshold: ${alert.threshold}%`);

    // TODO: Implement actual alerting (email, Slack, webhook, etc.)
    // Example:
    // await sendSlackNotification({
    //   channel: '#alerts',
    //   message: `API ${alert.apiName} is at ${percentage}% of ${alert.period} limit`
    // });
  }
}

/**
 * Helper function for wrapping API calls with automatic tracking
 *
 * @example
 * const data = await withTracking(
 *   { apiName: 'finnhub', endpoint: '/quote' },
 *   async (tracker) => {
 *     const response = await fetch(url);
 *     const data = await response.json();
 *     await tracker.trackSuccess();
 *     return data;
 *   }
 * );
 */
export async function withTracking<T>(
  options: TrackingOptions,
  fn: (tracker: ApiTracker) => Promise<T>
): Promise<T> {
  const tracker = new ApiTracker(options);

  try {
    const result = await fn(tracker);
    return result;
  } catch (error) {
    // Auto-track error if not already tracked
    const errorType = error instanceof Error && error.message.includes('429')
      ? 'RATE_LIMIT'
      : error instanceof Error && error.message.toLowerCase().includes('timeout')
      ? 'TIMEOUT'
      : error instanceof Error && error.message.toLowerCase().includes('network')
      ? 'NETWORK_ERROR'
      : 'UNKNOWN';

    const statusCode = error instanceof Error && error.message.includes('429')
      ? 429
      : error instanceof Error && error.message.includes('500')
      ? 500
      : undefined;

    await tracker.trackError({
      statusCode,
      errorType,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
