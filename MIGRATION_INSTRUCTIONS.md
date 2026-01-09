# Database Migration Instructions

## Quick Fix for 500 Error on Watchlist API

The 500 error is likely because the database tables don't exist yet. You need to run Prisma migrations.

### Option 1: Run Migrations Locally (Easiest)

1. **Pull environment variables from Vercel** (if you have Vercel CLI):
   ```bash
   vercel env pull .env.local
   ```
   Or manually create `.env.local` with:
   ```
   DATABASE_URL="postgresql://postgres.emeuzhzmencblyxlqmaq:gg6TeEuH8W3tWlw4@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require"
   ```

2. **Create and run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```
   
   This will:
   - Create a migration file
   - Apply it to your Supabase database
   - Generate the Prisma Client

3. **Push the migration file to GitHub**:
   ```bash
   git add prisma/migrations
   git commit -m "Add database migrations"
   git push
   ```

### Option 2: Run Migrations via Supabase SQL Editor

1. Go to your Supabase project → SQL Editor
2. Run this SQL to create the tables:

```sql
-- Create WatchlistItem table
CREATE TABLE IF NOT EXISTS "WatchlistItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLAN_TO_WATCH',
    "externalId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "rating" DOUBLE PRECISION,
    "year" INTEGER,
    "episodes" INTEGER,
    "progress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "WatchlistItem_externalId_type_key" ON "WatchlistItem"("externalId", "type");

-- Create indexes
CREATE INDEX IF NOT EXISTS "WatchlistItem_type_idx" ON "WatchlistItem"("type");
CREATE INDEX IF NOT EXISTS "WatchlistItem_status_idx" ON "WatchlistItem"("status");
CREATE INDEX IF NOT EXISTS "WatchlistItem_createdAt_idx" ON "WatchlistItem"("createdAt");

-- Create GameListItem table
CREATE TABLE IF NOT EXISTS "GameListItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "platform" TEXT,
    "externalId" TEXT,
    "coverImage" TEXT,
    "description" TEXT,
    "rating" INTEGER,
    "hoursPlayed" INTEGER,
    "completionPercent" INTEGER,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameListItem_pkey" PRIMARY KEY ("id")
);

-- Create indexes for GameListItem
CREATE INDEX IF NOT EXISTS "GameListItem_status_idx" ON "GameListItem"("status");
CREATE INDEX IF NOT EXISTS "GameListItem_platform_idx" ON "GameListItem"("platform");
CREATE INDEX IF NOT EXISTS "GameListItem_addedAt_idx" ON "GameListItem"("addedAt");

-- Create SportPreference table
CREATE TABLE IF NOT EXISTS "SportPreference" (
    "id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "teams" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SportPreference_sport_key" ON "SportPreference"("sport");

-- Create UserSettings table
CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_key_key" ON "UserSettings"("key");
```

3. Click "Run" to execute the SQL

### Option 3: Use Prisma Migrate Deploy (Production)

If you want to run migrations as part of your Vercel deployment:

1. Update your Vercel build command to:
   ```bash
   prisma generate && prisma migrate deploy && next build
   ```

2. This will automatically run migrations on each deployment

## Verify It Works

After running migrations:

1. Check Vercel logs again - the 500 error should be gone
2. Try accessing `/api/watchlist` - it should return `{ items: [] }` (empty array if no items)
3. Test adding an item to the watchlist

## Troubleshooting

### Still getting 500 errors?

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments → Latest → Functions
   - Click on the watchlist function → View Function Logs
   - Look for specific error messages

2. **Common errors**:
   - `Can't reach database server` → Check DATABASE_URL is correct
   - `relation "WatchlistItem" does not exist` → Migrations not run
   - `SSL connection required` → Add `?sslmode=require` to DATABASE_URL

3. **Test database connection**:
   ```bash
   npx prisma db pull
   ```
   This should connect and show your schema if the connection works.
