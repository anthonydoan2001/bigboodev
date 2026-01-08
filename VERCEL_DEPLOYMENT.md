# Vercel Deployment Guide

## Quick Steps to Deploy

1. **Push your code to GitHub** (if not already done)
2. **Import project to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Set Environment Variables** (see below)

4. **Deploy!** Vercel will automatically build and deploy your app.

## Required Environment Variables

Add these in your Vercel project settings under **Settings → Environment Variables**:

### Required Variables

#### 1. `DATABASE_URL`
- **Description**: PostgreSQL connection string for your database
- **Format**: `postgresql://user:password@host:port/database?sslmode=require`
- **Where to get it**: 
  - If using Supabase: Go to your Supabase project → Settings → Database → Connection string (URI mode)
  - Example: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`

#### 2. `OPENWEATHER_API_KEY`
- **Description**: API key for OpenWeatherMap weather service
- **Where to get it**: 
  - Sign up at [openweathermap.org/api](https://openweathermap.org/api)
  - Free tier: 1,000 calls/day
  - Copy your API key from the dashboard

### Optional Variables (Recommended)

#### 3. `TMDB_API_KEY`
- **Description**: API key for The Movie Database (movies/TV shows)
- **Where to get it**: 
  - Sign up at [themoviedb.org](https://www.themoviedb.org/settings/api)
  - Free tier available
  - Copy your API key

#### 4. `DASHBOARD_PASSWORD`
- **Description**: Password for dashboard authentication
- **Format**: Any string (e.g., `mySecurePassword123`)
- **Note**: This is for simple password authentication as mentioned in your project rules

## Database Setup (Supabase)

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project**
3. **Get your connection string** from Settings → Database
4. **Run Prisma migrations**:
   ```bash
   # In your local project
   npx prisma migrate deploy
   ```
   Or use Vercel's build command to run migrations automatically.

## Vercel Build Settings

Vercel should auto-detect these, but verify in **Settings → General**:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (or `prisma generate && next build` if you need Prisma)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

### Recommended Build Command

If you need Prisma to generate the client during build, update your build command in **Settings → General → Build & Development Settings**:

```bash
prisma generate && next build
```

**Note**: Your current `package.json` has `"build": "next build"`. You can either:
1. Update it to `"build": "prisma generate && next build"` in your repo, OR
2. Override it in Vercel settings with the command above

## Post-Deployment Steps

1. **Run database migrations**:
   ```bash
   # Via Vercel CLI (if installed)
   vercel env pull .env.local
   npx prisma migrate deploy
   
   # Or use Supabase SQL editor to run migrations manually
   ```

2. **Verify environment variables** are set correctly in Vercel dashboard

3. **Test your deployment**:
   - Weather widget should work with `OPENWEATHER_API_KEY`
   - Watchlist search should work with `TMDB_API_KEY`
   - Database features should work with `DATABASE_URL`

## Environment Variable Summary

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection | Supabase project settings |
| `OPENWEATHER_API_KEY` | ✅ Yes | Weather data | openweathermap.org |
| `TMDB_API_KEY` | ⚠️ Optional | Movies/TV search | themoviedb.org |
| `DASHBOARD_PASSWORD` | ⚠️ Optional | Auth password | Your choice |

## Notes

- **ESPN API**: No API key needed (public endpoints)
- **Jikan API**: No API key needed (public endpoints)
- **RAWG API**: Not currently implemented, but would need `RAWG_API_KEY` if added

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format is correct
- Check Supabase project is active
- Ensure SSL mode is set: `?sslmode=require`

### Build Failures
- Check all required environment variables are set
- Verify Prisma schema is correct
- Check build logs in Vercel dashboard

### API Errors
- Verify API keys are correct
- Check API rate limits (especially OpenWeatherMap free tier)
- Review Vercel function logs for errors

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
