# Package.json Scripts for API Monitoring

Add these scripts to your `package.json` for easier management:

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",

    "setup:alerts": "tsx src/scripts/setup-api-alerts.ts",

    "cleanup:api-usage": "curl -X POST http://localhost:3000/api/cron/cleanup-api-usage -H 'Authorization: Bearer ${CRON_SECRET}'",

    "monitoring:stats": "tsx -e \"import { getStorageStats } from './src/lib/api-usage-cleanup'; getStorageStats().then(console.log)\"",

    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## Usage Examples

### Database Operations
```bash
# Apply migrations in development
npm run db:migrate

# Apply migrations in production
npm run db:migrate:deploy

# Regenerate Prisma client
npm run db:generate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Setup & Configuration
```bash
# Setup default API alerts
npm run setup:alerts
```

### Maintenance
```bash
# Trigger cleanup manually (requires dev server running)
npm run cleanup:api-usage

# Check storage statistics
npm run monitoring:stats
```

## Quick Start After Migration

```bash
# 1. Apply migration
npm run db:migrate

# 2. Regenerate client
npm run db:generate

# 3. Setup alerts (optional)
npm run setup:alerts

# 4. Start dev server
npm run dev
```
