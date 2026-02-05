# bigboo.dev

A personal dashboard that aggregates sports, entertainment, finance, productivity, and gaming data into a single interface.

## Features

### Dashboard

Customizable home screen with widgets for weather, calendar, stocks/crypto/gas prices, email (Gmail), manga progress, event countdowns, pinned notes, and live game tracking (Rockets, League of Legends).

### Sports

Multi-sport scoreboard (NBA, NFL, MLB, NHL, MLS) with live scores, standings, playoff brackets, top performers, and date-based schedule navigation. Data refreshes every minute during games via cron.

### Watchlist

Track anime (MyAnimeList/Jikan), movies, and TV shows (TMDB) across statuses — Plan to Watch, Watching, Watched. Includes top-rated content discovery and image galleries with virtualized rendering.

### Manga

Komga server integration with library browsing, series/readlist management, a full-screen reader with keyboard navigation, and continue-reading support.

### Games

RAWG-powered game library with status tracking (Playlist, Playing, Played), cover art, ratings, and search.

### Notes

Rich text editor (TipTap with Markdown support), folder organization with nesting, color-coded tags, pinning, task linking, file attachments (Supabase storage), and soft-delete trash management.

### Tasks

Kanban board with TODO/In Progress/Done columns, priority levels, due dates, categories, and drag-and-drop reordering. Tasks can link to notes.

### Bookmarks

URL bookmarking with auto-fetched favicons, folder organization, pinning, and search.

### Other

- **TikTok** — Import liked videos from Excel export with thumbnails
- **Settings** — Theme picker (8 themes), API usage monitoring with cost tracking and performance metrics

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | Tailwind CSS 4, shadcn/ui (Radix), Lucide icons |
| State | TanStack Query 5 (server), Zustand 5 (client) |
| Database | PostgreSQL (Supabase) via Prisma 5 |
| Auth | Password-based dashboard access, Gmail OAuth |
| Monitoring | Web Vitals (LCP, CLS, INP, TTFB, FCP), API usage tracking |
| Video | Remotion + Puppeteer for automated walkthroughs |
| Deploy | Vercel with 6 cron jobs |

### External APIs

ESPN (sports), OpenWeather, TMDB (movies/TV), Jikan (anime), Finnhub (stocks), CoinMarketCap (crypto), RAWG (games), Google Gmail, Riot Games (League of Legends), Komga (manga), gas price scraping.


## Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/             # 65+ REST API routes
│   ├── sports/          # Sports scores, standings, playoffs
│   ├── watchlist/       # Anime, movies, TV shows
│   ├── manga/           # Reader, library, series
│   ├── games/           # Game library with status tracking
│   ├── notes/           # Rich text notes with folders
│   ├── tasks/           # Kanban task board
│   ├── bookmarks/       # URL bookmarks
│   ├── tiktok/          # TikTok liked videos
│   └── settings/        # Themes, API monitoring
├── components/          # React components organized by feature
├── lib/                 # Utilities, API clients, hooks, stores
└── types/               # TypeScript type definitions
prisma/
├── schema.prisma        # Database schema (23 models)
└── migrations/          # 19 migrations
```

## Deployment

Deployed on [Vercel](https://vercel.com) with automated cron jobs:

| Job | Schedule |
|---|---|
| Stock quotes refresh | Every 5 minutes |
| Crypto prices refresh | Every 15 minutes |
| Watchlist top items | Daily at midnight |
| Sports scores | Every minute |
| Sports top performers | Every 10 minutes |
| Gas prices | Every 30 minutes |


