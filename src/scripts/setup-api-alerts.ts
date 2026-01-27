/**
 * Setup API Alerts
 *
 * Run this script once to configure default alerts for your APIs
 *
 * Usage:
 *   npx tsx src/scripts/setup-api-alerts.ts
 *
 * Or via package.json:
 *   npm run setup:alerts
 */

import { db } from '../lib/db';
import type { ApiName } from '../lib/api-usage';

interface AlertConfig {
  apiName: ApiName;
  alertType: 'RATE_LIMIT_WARNING' | 'COST_THRESHOLD' | 'ERROR_SPIKE';
  threshold: number;
  period: 'MINUTE' | 'HOUR' | 'DAY';
  enabled?: boolean;
}

const DEFAULT_ALERTS: AlertConfig[] = [
  // Finnhub (Stocks) - Rate Limit Warnings
  {
    apiName: 'finnhub',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 80, // Alert at 80% of limit
    period: 'MINUTE',
  },
  {
    apiName: 'finnhub',
    alertType: 'ERROR_SPIKE',
    threshold: 10, // Alert if >10 errors
    period: 'HOUR',
  },

  // CoinMarketCap (Crypto) - Cost Warnings
  {
    apiName: 'coinmarketcap',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 75,
    period: 'MINUTE',
  },
  {
    apiName: 'coinmarketcap',
    alertType: 'COST_THRESHOLD',
    threshold: 8000, // Alert at 8000 credits (80% of 10k monthly limit)
    period: 'DAY',
  },

  // RAWG (Games) - Very strict rate limits
  {
    apiName: 'rawg',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 60, // Alert early (5 req/sec limit)
    period: 'MINUTE',
  },

  // TMDB (Movies/TV)
  {
    apiName: 'tmdb',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 80,
    period: 'MINUTE',
  },

  // Jikan (Anime) - Has very strict limits
  {
    apiName: 'jikan',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 70, // Alert early
    period: 'MINUTE',
  },

  // ESPN (Sports)
  {
    apiName: 'espn',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 80,
    period: 'MINUTE',
  },

  // OpenWeather
  {
    apiName: 'openweather',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 80,
    period: 'MINUTE',
  },
  {
    apiName: 'openweather',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 90, // Alert at 900/1000 daily limit
    period: 'DAY',
  },
];

async function setupAlerts() {
  console.log('🔔 Setting up API alerts...\n');

  let created = 0;
  let skipped = 0;

  for (const alert of DEFAULT_ALERTS) {
    try {
      // Check if alert already exists
      const existing = await db.apiAlert.findUnique({
        where: {
          apiName_alertType_period: {
            apiName: alert.apiName,
            alertType: alert.alertType,
            period: alert.period,
          },
        },
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${alert.apiName} - ${alert.alertType} (${alert.period}) - already exists`);
        skipped++;
        continue;
      }

      // Create alert
      await db.apiAlert.create({
        data: {
          apiName: alert.apiName,
          alertType: alert.alertType,
          threshold: alert.threshold,
          period: alert.period,
          enabled: alert.enabled ?? true,
        },
      });

      console.log(`✅ Created: ${alert.apiName} - ${alert.alertType} (${alert.period}) @ ${alert.threshold}%`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create alert for ${alert.apiName}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${created + skipped}\n`);

  // Show all configured alerts
  const allAlerts = await db.apiAlert.findMany({
    orderBy: [{ apiName: 'asc' }, { period: 'asc' }],
  });

  console.log(`\n📋 All configured alerts (${allAlerts.length}):\n`);
  allAlerts.forEach(alert => {
    const status = alert.enabled ? '🟢' : '🔴';
    console.log(
      `${status} ${alert.apiName.padEnd(15)} | ${alert.alertType.padEnd(20)} | ${alert.period.padEnd(6)} | ${alert.threshold}${alert.alertType === 'RATE_LIMIT_WARNING' ? '%' : ''}`
    );
  });

  await db.$disconnect();
}

// Run the setup
setupAlerts()
  .then(() => {
    console.log('\n✨ Alert setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Alert setup failed:', error);
    process.exit(1);
  });
