import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || '',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
      },
      {
        protocol: 'https',
        hostname: 's.espncdn.com',
      },
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'static.finnhub.io',
      },
      {
        protocol: 'https',
        hostname: 'static2.finnhub.io',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 's2.coinmarketcap.com',
      },
      {
        protocol: 'https',
        hostname: 's3.coinmarketcap.com',
      },
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
      },
      {
        protocol: 'https',
        hostname: '*.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign-va.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign.tiktokcdn-us.com',
      },
      {
        protocol: 'https',
        hostname: 'p77-sign.tiktokcdn-us.com',
      },
    ],
  },
};

export default nextConfig;
