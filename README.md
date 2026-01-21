# Personal Dashboard

A personal dashboard application that aggregates data from multiple sources into a single interface. Tracks sports scores, entertainment watchlists, games, stocks, crypto, and weather.

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS and shadcn/ui components
- React Query for data fetching
- Prisma with PostgreSQL (Supabase)
- Zustand for client state

## Setup

Install dependencies:

```bash
npm install
```

Set up environment variables:

```bash
cp .env.example .env
```

Required environment variables:
- DATABASE_URL - PostgreSQL connection string
- DIRECT_URL - Direct database connection for migrations
- DASHBOARD_PASSWORD - Password for authentication
- FINNHUB_API_KEY - Stock market data
- COINMARKETCAP_API_KEY - Cryptocurrency data
- TMDB_API_KEY - Movie and TV data
- RAWG_API_KEY - Game data
- OPENWEATHER_API_KEY - Weather data

Run database migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

## Features

- Sports scores and schedules (NBA, NFL, UFC, college sports)
- Watchlist tracking for anime, movies, TV shows
- Game library and progress tracking
- Stock and cryptocurrency quotes
- Weather information
- API usage monitoring

## Deployment

The project is configured for deployment on Vercel. Cron jobs are set up to refresh stock and crypto data every 5 minutes, and top items daily.

Build command:

```bash
npm run build
```

## Database

Uses Prisma as the ORM. Schema changes require creating a new migration:

```bash
npx prisma migrate dev --name migration_name
```
