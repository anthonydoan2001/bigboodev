'use client';

import { useEffect, useCallback } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

interface WebVitalsProps {
  /**
   * Custom analytics endpoint to send metrics to
   * If not provided, metrics are logged to console in development
   */
  analyticsEndpoint?: string;

  /**
   * Enable console logging of metrics (useful for development)
   */
  debug?: boolean;

  /**
   * Custom callback for handling metrics
   */
  onMetric?: (metric: WebVitalsMetric) => void;
}

// Thresholds for Core Web Vitals (in milliseconds for LCP, INP, TTFB; unitless for CLS)
// Note: FID has been deprecated in favor of INP as of March 2024
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * WebVitals - Real User Monitoring (RUM) for Core Web Vitals
 *
 * Tracks:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - INP (Interaction to Next Paint) - Responsiveness (replaced FID in 2024)
 * - TTFB (Time to First Byte) - Server response time
 * - FCP (First Contentful Paint) - Initial render time
 *
 * Thresholds (per Google):
 * - LCP: Good < 2.5s, Poor > 4s
 * - CLS: Good < 0.1, Poor > 0.25
 * - INP: Good < 200ms, Poor > 500ms
 *
 * Add this component to your root layout for automatic tracking.
 */
export function WebVitals({
  analyticsEndpoint,
  debug = process.env.NODE_ENV === 'development',
  onMetric,
}: WebVitalsProps) {

  const sendToAnalytics = useCallback((metric: Metric) => {
    const webVitalsMetric: WebVitalsMetric = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating || getRating(metric.name, metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType || 'unknown',
    };

    // Debug logging
    if (debug) {
      const color = webVitalsMetric.rating === 'good'
        ? '#0f0'
        : webVitalsMetric.rating === 'needs-improvement'
          ? '#ff0'
          : '#f00';

      console.log(
        `%c[Web Vitals] ${metric.name}: ${formatMetricValue(metric.name, metric.value)} (${webVitalsMetric.rating})`,
        `color: ${color}; font-weight: bold;`
      );
    }

    // Custom callback
    if (onMetric) {
      onMetric(webVitalsMetric);
    }

    // Send to analytics endpoint
    if (analyticsEndpoint) {
      // Use sendBeacon for reliability (survives page unload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          analyticsEndpoint,
          JSON.stringify(webVitalsMetric)
        );
      } else {
        // Fallback to fetch
        fetch(analyticsEndpoint, {
          method: 'POST',
          body: JSON.stringify(webVitalsMetric),
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Silently fail - don't impact user experience
        });
      }
    }
  }, [analyticsEndpoint, debug, onMetric]);

  useEffect(() => {
    // Register all web vitals observers
    // Note: FID was deprecated in March 2024, replaced by INP
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onINP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, [sendToAnalytics]);

  // This component doesn't render anything
  return null;
}

export default WebVitals;
