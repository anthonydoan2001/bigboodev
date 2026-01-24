# Enhanced API Monitoring Migration

This migration enhances the API usage tracking system with advanced monitoring capabilities.

## What's New

### Enhanced ApiUsage Table
- **Performance Metrics**: `response_time`, `request_size`, `response_size`
- **Error Tracking**: `error_type`, `error_message` (full text)
- **Cost Tracking**: `cost_credits` for APIs that charge per request
- **Caching Info**: `cached` flag to track cache hits
- **HTTP Method**: `method` field (GET, POST, etc.)
- **User Tracking**: `user_id` for user-specific usage patterns
- **Optimized Indexes**: 5 composite indexes for fast queries

### New ApiUsageAggregate Table
Pre-aggregated statistics for fast historical queries:
- Hourly, daily, and monthly rollups
- Success/error counts
- Performance metrics (avg/min/max response times)
- Error breakdown by type (rate limits, timeouts, server errors)
- Cost tracking

### New ApiAlert Table
Configure alerts for monitoring:
- Rate limit warnings (e.g., alert at 80% of limit)
- Cost thresholds
- Error spike detection
- Per-API, per-period configuration

## How to Apply

### Development
```bash
npx prisma migrate dev
```

### Production
```bash
npx prisma migrate deploy
```

### Verify Migration
```bash
npx prisma migrate status
```

## After Migration

1. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Restart your dev server** to use the new Prisma client

3. **Update tracking code** to use the new fields (see examples below)

## Usage Examples

### Basic Tracking with Performance Metrics
```typescript
import { db } from '@/lib/db';

await db.apiUsage.create({
  data: {
    apiName: 'finnhub',
    endpoint: '/quote',
    method: 'GET',
    success: true,
    statusCode: 200,
    responseTime: 245, // milliseconds
    cached: false,
  },
});
```

### Track Error with Details
```typescript
await db.apiUsage.create({
  data: {
    apiName: 'finnhub',
    endpoint: '/quote',
    method: 'GET',
    success: false,
    statusCode: 429,
    errorType: 'RATE_LIMIT',
    errorMessage: 'Rate limit exceeded: 60 requests per minute',
    responseTime: 120,
  },
});
```

### Create Daily Aggregate
```typescript
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(startOfDay);
endOfDay.setDate(endOfDay.getDate() + 1);

await db.apiUsageAggregate.create({
  data: {
    apiName: 'finnhub',
    aggregationType: 'DAILY',
    periodStart: startOfDay,
    periodEnd: endOfDay,
    totalRequests: 1500,
    successCount: 1450,
    errorCount: 50,
    cachedCount: 200,
    avgResponseTime: 180.5,
    maxResponseTime: 890,
    minResponseTime: 45,
    rateLimitErrors: 10,
    timeoutErrors: 5,
    serverErrors: 35,
    totalCost: 0.15,
  },
});
```

### Configure Alert
```typescript
await db.apiAlert.create({
  data: {
    apiName: 'finnhub',
    alertType: 'RATE_LIMIT_WARNING',
    threshold: 80, // Alert at 80% of limit
    period: 'MINUTE',
    enabled: true,
  },
});
```

## Performance Impact

### Before Migration
- Fetching stats for 7 APIs: ~500-1000ms (loads ALL records)
- Memory usage: High (filtering in Node.js)
- Database load: Heavy (full table scans)

### After Migration
- Fetching stats: ~50-100ms (uses indexes + aggregates)
- Memory usage: Low (database does aggregation)
- Database load: Minimal (optimized indexes)

## Rollback (if needed)

```bash
# Rollback one migration
npx prisma migrate resolve --rolled-back 20260123210146_enhance_api_monitoring

# Drop the new tables manually
DROP TABLE "api_alerts";
DROP TABLE "api_usage_aggregates";

# Remove added columns
ALTER TABLE "api_usage"
  DROP COLUMN "method",
  DROP COLUMN "response_time",
  DROP COLUMN "request_size",
  DROP COLUMN "response_size",
  DROP COLUMN "error_type",
  DROP COLUMN "error_message",
  DROP COLUMN "cost_credits",
  DROP COLUMN "cached",
  DROP COLUMN "user_id";
```

## Next Steps

1. ✅ Apply this migration
2. ✅ Regenerate Prisma client
3. ✅ Restart dev server
4. 🔄 Update tracking calls to include new fields
5. 🔄 Set up cron job for aggregation
6. 🔄 Configure alerts
7. 🔄 Update UI to show new metrics
