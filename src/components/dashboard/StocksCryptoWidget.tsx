'use client';

import { Card, CardContent } from '@/components/ui/card';
import { fetchCryptoQuotesFromDB } from '@/lib/api/crypto';
import { fetchStockQuotes } from '@/lib/api/stocks';
import { cn } from '@/lib/utils';
import { CryptoQuote } from '@/types/crypto';
import { StockQuote } from '@/types/stocks';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';

function formatPrice(price: number): string {
  // Format crypto prices - show more decimals for smaller values
  if (price < 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price);
  } else if (price < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
}

function formatPercentChange(percent: number | null): string {
  if (percent === null) return 'N/A';
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

function cleanCompanyName(name: string): string {
  // Remove common suffixes: Inc, Inc., Corporation, Corp, Corp., Platforms, Platform, etc.
  return name
    .replace(/\s+Inc\.?$/i, '')
    .replace(/\s+Corporation$/i, '')
    .replace(/\s+Corp\.?$/i, '')
    .replace(/\s+Platforms?$/i, '')
    .replace(/\s+LLC\.?$/i, '')
    .replace(/\s+Ltd\.?$/i, '')
    .trim();
}

const StockCard = memo(function StockCard({ quote }: { quote: StockQuote }) {
  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center justify-between py-3 px-3.5 border-b border-border/40 last:border-0">
      {/* Left side: Logo & Ticker */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Logo */}
        <div className="relative w-7 h-7 flex-shrink-0 rounded-full bg-background/50 flex items-center justify-center overflow-hidden ring-1 ring-border/10">
          {quote.logoUrl ? (
            <Image
              src={quote.logoUrl}
              alt={quote.symbol}
              fill
              className="object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-[10px] font-semibold text-muted-foreground">{quote.symbol.charAt(0)}</span>
          )}
        </div>

        {/* Ticker */}
        <span className="font-semibold font-mono text-body-sm leading-none">{quote.symbol}</span>
      </div>

      {/* Middle: Price */}
      <div className="flex-shrink-0 mx-4">
        <span className="font-mono text-body-sm font-medium tabular-nums">{formatPrice(quote.currentPrice)}</span>
      </div>

      {/* Right: Change */}
      <div className="flex items-center gap-1 flex-shrink-0 min-w-[80px] justify-end">
        <span className={cn("text-[11px] md:text-xs font-mono font-medium flex items-center gap-0.5 tabular-nums", changeColor)}>
          {isPositive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {formatPercentChange(quote.percentChange)}
        </span>
      </div>
    </div>
  );
});

const CryptoCard = memo(function CryptoCard({ crypto }: { crypto: CryptoQuote }) {
  const percentChange = crypto.percentChange24h ?? 0;
  const isPositive = percentChange >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center justify-between py-3 px-3.5 border-b border-border/40 last:border-0">
      {/* Left side: Logo & Symbol */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Logo */}
        <div className="relative w-7 h-7 flex-shrink-0 rounded-full bg-background/50 flex items-center justify-center overflow-hidden ring-1 ring-border/10">
          {crypto.logoUrl ? (
            <Image
              src={crypto.logoUrl}
              alt={crypto.symbol}
              fill
              className="object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-[10px] font-semibold text-muted-foreground">{crypto.symbol.charAt(0)}</span>
          )}
        </div>

        {/* Symbol */}
        <span className="font-semibold font-mono text-body-sm leading-none">{crypto.symbol}</span>
      </div>

      {/* Middle: Price */}
      <div className="flex-shrink-0 mx-4">
        <span className="font-mono text-body-sm font-medium tabular-nums">{formatPrice(crypto.price)}</span>
      </div>

      {/* Right: Change */}
      <div className="flex items-center gap-1 flex-shrink-0 min-w-[80px] justify-end">
        <span className={cn("text-[11px] md:text-xs font-mono font-medium flex items-center gap-0.5 tabular-nums", changeColor)}>
          {isPositive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {formatPercentChange(crypto.percentChange24h)}
        </span>
      </div>
    </div>
  );
});

export function StocksCryptoWidget() {
  const { data: stocksData, isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ['stockQuotes'],
    queryFn: fetchStockQuotes,
    staleTime: 3600000, // Consider stale after 1 hour
    refetchInterval: 3600000, // Auto-refresh every 1 hour
    refetchOnMount: 'always', // Refetch on mount if stale
  });

  const { data: cryptoData, isLoading: cryptoLoading, error: cryptoError } = useQuery({
    queryKey: ['cryptoQuotes'],
    queryFn: fetchCryptoQuotesFromDB,
    staleTime: 3600000, // Consider stale after 1 hour
    refetchInterval: 3600000, // Auto-refresh every 1 hour
    refetchOnMount: 'always', // Refetch on mount if stale
  });

  const isLoading = stocksLoading || cryptoLoading;
  const hasError = stocksError || cryptoError;
  const hasStocks = stocksData && stocksData.quotes.length > 0;
  const hasCrypto = cryptoData && cryptoData.quotes.length > 0;
  const hasData = hasStocks || hasCrypto;

  if (isLoading) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm h-full py-0 gap-0">
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3">
                {/* Left side skeleton */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-6 h-6 rounded-full bg-muted/30 animate-pulse" />
                  <div className="h-4 w-12 bg-muted/30 animate-pulse rounded-md" />
                </div>
                {/* Middle skeleton */}
                <div className="h-4 w-16 bg-muted/30 animate-pulse rounded-md mx-4" />
                {/* Right side skeleton */}
                <div className="h-4 w-16 bg-muted/20 animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError || !hasData) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
        <CardContent className="p-4">
          <p className="text-body-sm text-muted-foreground text-center py-4">
            {hasError ? 'Failed to load market data' : 'No market data available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0">
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {/* Stocks */}
          {hasStocks && stocksData.quotes.map((quote) => (
            <StockCard key={quote.symbol} quote={quote} />
          ))}

          {/* Crypto */}
          {hasCrypto && cryptoData.quotes.map((crypto: CryptoQuote) => (
            <CryptoCard key={crypto.symbol} crypto={crypto} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
