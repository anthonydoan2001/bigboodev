# Personal Dashboard - Product Requirements Document

## Overview

A comprehensive personal dashboard web application designed to centralize daily information and tracking needs in a single, unified interface. The dashboard provides real-time sports updates, entertainment watchlist management, gaming progress tracking, and weather information, with plans to expand into personal finance, habits, and productivity tools.

## Goals & Objectives

### Primary Goals
- Create a centralized hub for personal information tracking and consumption
- Reduce context switching between multiple apps and websites
- Provide real-time updates for sports and weather
- Enable efficient tracking of entertainment and gaming progress

### Success Metrics
- Daily active usage
- Reduction in time spent navigating between different services
- Complete data integrity for tracked items
- Fast page load times (<2s initial load, <500ms navigation)

## Target User

**Single User - Personal Use Only**: This is a personal dashboard built for individual use. No multi-user support needed.

**User Profile**:
- Follows multiple sports (NBA, NFL, UFC, college sports)
- Actively watches anime, movies, TV shows, K-dramas
- Reads manga and books
- Plays video games across multiple platforms
- Wants a personalized, consolidated information hub

## Phase 1: Core Features

### 1. Main Dashboard (Home Page)

#### Weather Widget
- **Display**: Current temperature, conditions, location
- **Data**: Hourly forecast (next 12 hours), daily forecast (next 5 days)
- **Features**:
  - Weather icon/animation representing conditions
  - High/low temperatures
  - Precipitation probability
  - Wind speed and humidity
- **API**: OpenWeatherMap
- **Refresh**: Automatic refresh every 30 minutes

#### Quick Links
- Navigation cards to Sports, Watchlist, Games, Settings
- Quick stats overview (e.g., "3 games today", "5 anime watching")

### 2. Sports Section

#### Features
- **Multi-Sport Support**: NBA (priority), NFL, UFC, College Football (NCAAF), College Basketball (NCAAB)
- **Daily Scores**:
  - Live scores with real-time updates for active games
  - Game status indicators (scheduled, live, final)
  - Quarter/period information and time remaining
  - Final scores for completed games
- **Top Performers**:
  - Player statistics from recent games
  - Points, rebounds, assists for basketball
  - Passing/rushing/receiving yards for football
- **Schedule View**:
  - Upcoming games for next 7 days
  - Filterable by sport
  - Time, teams, broadcast information
- **Manual Refresh**: User-initiated refresh button (no auto-refresh)

#### Data Source
- **API**: ESPN API (unofficial/public endpoints)
- **Caching**: React Query with 5-minute stale time
- **Storage**: No database persistence needed (ephemeral data)

#### UI Components
- Sport filter tabs (NBA, NFL, UFC, NCAAF, NCAAB)
- Score cards with team logos/colors
- Expandable game details
- Top performers carousel/grid
- Refresh button with loading state

### 3. Watchlist Section

#### Content Types
- Anime (priority)
- Movies
- TV Shows
- K-Dramas
- Manga
- Books

#### Status Tracking
- **Statuses**: To Watch, Watching, Completed, On Hold, Dropped
- **Progress**: Episode/chapter numbers, percentage completion
- **Ratings**: Personal rating (1-10 scale)
- **Notes**: Free-form text notes per item

#### Features
- **Search & Add**:
  - Integration with TMDB API (movies, TV shows, K-dramas)
  - Integration with Jikan API (anime, manga)
  - Manual entry for books
  - Search results with cover images and descriptions
- **List Management**:
  - Filter by type and status
  - Sort by rating, date added, alphabetical
  - Quick status change dropdown
  - Progress tracking with +1 button for episodes/chapters
- **Detail View**:
  - Cover image
  - Description/synopsis
  - Personal notes
  - Rating
  - Dates (added, updated)
  - External links to source

#### Data Storage
- Stored in PostgreSQL via Prisma
- Full CRUD operations
- Timestamps for creation and updates

### 4. Games Section

#### Features
- Similar to watchlist but gaming-focused
- **Platforms**: PC, PS5, Xbox, Switch, Mobile
- **Status**: To Play, Playing, Completed, Dropped
- **Tracking**:
  - Hours played
  - Completion percentage
  - Personal rating (1-10)
  - Notes
- **Search Integration**: RAWG API for game data
- **List Management**: Filter by platform/status, sort options

#### Data Storage
- PostgreSQL via Prisma
- Full CRUD operations

### 5. Settings Page

#### Configuration Options
- **Sports Preferences**:
  - Favorite teams (persistent highlighting)
  - Default sport to display
  - Enable/disable specific sports
- **Display Settings**:
  - Theme (dark mode default, light mode option)
  - Timezone
- **API Keys** (optional override):
  - OpenWeatherMap API key
  - TMDB API key
- **Authentication**:
  - Password change functionality
  - Simple session management (localStorage)

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**:
  - React Query for server state (caching, fetching)
  - Zustand for client state (if needed for complex UI state)
- **Forms**: React Hook Form + Zod validation

### Backend Stack
- **API Routes**: Next.js API routes (app/api/*)
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Authentication**: Simple password-based (localStorage session) - Single user only, no account system needed

### External APIs

| API | Purpose | Rate Limits | Caching Strategy |
|-----|---------|--------------|------------------|
| ESPN API | Sports scores, schedules | Unknown | 5-minute stale time |
| Jikan API | Anime/manga data | 3 req/sec, 60 req/min | 24-hour stale time |
| TMDB API | Movie/TV data | 40 req/10sec | 24-hour stale time |
| RAWG API | Game data | 20,000 req/month | 24-hour stale time |
| OpenWeatherMap | Weather | 1,000 req/day (free) | 30-minute stale time |

### Deployment
- **Platform**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Environment Variables**: Managed via Vercel/local .env

## Database Schema

### WatchlistItem
```prisma
model WatchlistItem {
  id          String          @id @default(cuid())
  type        WatchlistType   // ANIME, MOVIE, SHOW, KDRAMA, MANGA, BOOK
  title       String
  status      WatchlistStatus // TO_WATCH, WATCHING, COMPLETED, ON_HOLD, DROPPED
  externalId  String?         // ID from TMDB or Jikan
  coverImage  String?         // URL to cover image
  description String?         @db.Text
  rating      Int?            // 1-10 scale
  progress    String?         // e.g., "Episode 12/24", "Chapter 45/100"
  notes       String?         @db.Text
  addedAt     DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([type])
  @@index([status])
}
```

### GameListItem
```prisma
model GameListItem {
  id                String       @id @default(cuid())
  title             String
  status            GameStatus   // TO_PLAY, PLAYING, COMPLETED, DROPPED
  platform          Platform     // PC, PS5, XBOX, SWITCH, MOBILE
  externalId        String?      // RAWG game ID
  coverImage        String?
  description       String?      @db.Text
  rating            Int?         // 1-10 scale
  hoursPlayed       Float?
  completionPercent Int?         // 0-100
  notes             String?      @db.Text
  addedAt           DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@index([platform])
  @@index([status])
}
```

### SportPreference
```prisma
model SportPreference {
  id           String   @id @default(cuid())
  sport        SportType // NBA, NFL, UFC, NCAAF, NCAAB
  favoriteTeam String?
  enabled      Boolean  @default(true)
  priority     Int      @default(0) // Display order
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([sport])
}
```

### UserSettings
```prisma
model UserSettings {
  id                String   @id @default(cuid())
  theme             String   @default("dark") // "dark" or "light"
  timezone          String   @default("America/New_York")
  weatherLocation   String?  // City name or coordinates
  defaultSport      String?  // Default sport to show
  openWeatherApiKey String?  // Optional user API key
  tmdbApiKey        String?  // Optional user API key
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Note: Single row table for personal use only
}
```

## File Organization

```
src/
├── app/
│   ├── api/
│   │   ├── sports/
│   │   │   ├── scores/route.ts
│   │   │   └── schedule/route.ts
│   │   ├── watchlist/
│   │   │   ├── route.ts          // GET, POST
│   │   │   ├── [id]/route.ts     // PUT, DELETE
│   │   │   └── search/route.ts
│   │   ├── games/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── search/route.ts
│   │   ├── weather/route.ts
│   │   └── settings/route.ts
│   ├── sports/
│   │   └── page.tsx
│   ├── watchlist/
│   │   └── page.tsx
│   ├── games/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx                  // Main dashboard
├── components/
│   ├── sports/
│   │   ├── ScoreCard.tsx
│   │   ├── SportFilter.tsx
│   │   ├── TopPerformers.tsx
│   │   └── ScheduleView.tsx
│   ├── watchlist/
│   │   ├── WatchlistGrid.tsx
│   │   ├── WatchlistItem.tsx
│   │   ├── AddWatchlistItem.tsx
│   │   ├── SearchDialog.tsx
│   │   └── StatusBadge.tsx
│   ├── games/
│   │   ├── GameGrid.tsx
│   │   ├── GameCard.tsx
│   │   ├── AddGameDialog.tsx
│   │   └── PlatformBadge.tsx
│   ├── weather/
│   │   └── WeatherWidget.tsx
│   └── ui/                       // shadcn components
├── lib/
│   ├── api/
│   │   ├── sports.ts             // ESPN API client
│   │   ├── jikan.ts              // Jikan API client
│   │   ├── tmdb.ts               // TMDB API client
│   │   ├── rawg.ts               // RAWG API client
│   │   └── weather.ts            // OpenWeatherMap client
│   ├── providers/
│   │   └── QueryProvider.tsx
│   ├── prisma.ts                 // Prisma client singleton
│   └── utils.ts
├── types/
│   ├── watchlist.ts
│   ├── sports.ts
│   ├── games.ts
│   └── weather.ts
└── prisma/
    └── schema.prisma
```

## Implementation Plan

### Sprint 1: Foundation (Week 1)
- [x] Project setup (Next.js, TypeScript, Tailwind, shadcn/ui)
- [x] Basic routing structure
- [x] QueryProvider setup
- [x] Type definitions
- [ ] Database schema and Prisma setup
- [ ] Authentication system (simple password)
- [ ] Layout with navigation

### Sprint 2: Sports Section (Week 2)
- [ ] ESPN API client implementation
- [ ] Sports API routes (scores, schedule)
- [ ] ScoreCard component
- [ ] SportFilter tabs
- [ ] TopPerformers component
- [ ] Manual refresh functionality
- [ ] Sports page integration

### Sprint 3: Watchlist Section (Week 3)
- [ ] Prisma models and migrations
- [ ] Watchlist CRUD API routes
- [ ] Jikan API client
- [ ] TMDB API client
- [ ] Search functionality
- [ ] WatchlistGrid and WatchlistItem components
- [ ] Add/Edit/Delete functionality
- [ ] Status and progress tracking

### Sprint 4: Games & Weather (Week 4)
- [ ] Games CRUD API routes
- [ ] RAWG API client
- [ ] GameGrid and GameCard components
- [ ] Platform filtering
- [ ] OpenWeatherMap API client
- [ ] WeatherWidget component
- [ ] Main dashboard integration

### Sprint 5: Settings & Polish (Week 5)
- [ ] Settings page and API
- [ ] Sport preferences management
- [ ] Theme toggle (dark/light)
- [ ] Error handling and loading states
- [ ] Responsive design refinement
- [ ] Performance optimization
- [ ] Testing and bug fixes

## Future Phases

### Phase 2: Finance Tracker
- **Features**:
  - Expense tracking
  - Income tracking
  - Budget categories
  - Monthly reports
  - Spending trends visualization
- **Database**: Transaction, Category, Budget models
- **UI**: Charts with Recharts or Chart.js

### Phase 3: Habit Tracker
- **Features**:
  - Daily habit checkboxes
  - Streak tracking
  - Habit categories
  - Calendar view
  - Statistics and insights
- **Database**: Habit, HabitLog models
- **UI**: Calendar heatmap, progress charts

### Phase 4: Notes System
- **Features**:
  - Markdown editor
  - Categories/tags
  - Search functionality
  - Code syntax highlighting
  - Quick notes widget on dashboard
- **Database**: Note, Tag models
- **Tech**: MDX or react-markdown

### Phase 5: Homelab Dashboard
- **Features**:
  - Server status monitoring
  - Container status (Docker)
  - Resource usage (CPU, RAM, disk)
  - Service uptime
  - Network statistics
- **Integration**: APIs from Portainer, Proxmox, or custom scripts

### Phase 6: Music Statistics
- **Features**:
  - Recently played tracks
  - Top artists/songs/genres
  - Listening trends
  - Now playing widget
- **Integration**: Spotify API or Last.fm API

## Design Principles

### UI/UX
- **Dark mode first**: Primary theme with optional light mode
- **Minimal and clean**: Focus on information density without clutter
- **Fast and responsive**: Optimized loading, smooth transitions
- **Mobile-friendly**: Responsive design for all screen sizes
- **Accessible**: WCAG 2.1 AA compliance

### Code Quality
- **TypeScript strict mode**: Type safety throughout
- **Component modularity**: Small, focused, reusable components
- **API separation**: Clear separation between API clients and UI
- **Error boundaries**: Graceful error handling
- **Loading states**: Clear feedback for async operations

### Performance
- **React Query caching**: Minimize unnecessary API calls
- **Image optimization**: Next.js Image component
- **Code splitting**: Dynamic imports for heavy components
- **Database indexing**: Optimized queries with proper indexes

## Security Considerations

**Note**: This is a personal, single-user application. Security measures are simplified accordingly.

- Simple password authentication (environment variable)
- Environment variables for API keys (not exposed to client)
- Input validation with Zod for data integrity
- SQL injection protection via Prisma
- XSS prevention (React escaping + sanitization)
- No need for rate limiting (single user)
- No need for user account management or multi-tenancy

## Success Criteria

### Phase 1 Launch
- [ ] All core features functional
- [ ] Sub-2 second page load
- [ ] Mobile responsive
- [ ] No critical bugs
- [ ] Data persistence working
- [ ] API integrations stable

### Personal Satisfaction
- Daily active use for at least 2 weeks
- Replaces need for multiple separate apps/websites
- No major usability issues
- Improves daily workflow efficiency

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ESPN API changes/deprecation | High | Monitor API, build fallback scrapers, consider alternative APIs |
| API rate limits exceeded | Medium | Implement aggressive caching, user-provided API keys |
| Database costs scaling | Low | Start with Supabase free tier, optimize queries, monitor usage |
| Feature creep | Medium | Stick to phased approach, complete Phase 1 before expanding |
| Performance issues | Medium | Regular performance audits, React Query optimization, lazy loading |

## Conclusion

This personal dashboard aims to consolidate multiple information sources and tracking needs into a single, efficient interface. Phase 1 focuses on core features (sports, watchlist, games, weather) with a solid technical foundation to support future expansion into finance, habits, notes, and homelab monitoring.

The project prioritizes user experience, performance, and maintainability while leveraging modern web technologies and best practices.

