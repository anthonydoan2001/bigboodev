'use client';

import { Card, CardContent } from '@/components/ui/card';
import { fetchStockQuotes } from '@/lib/api/stocks';
import { cn } from '@/lib/utils';
import { StockQuote } from '@/types/stocks';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useEffect } from 'react';
import Image from 'next/image';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatPercentChange(percent: number): string {
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

function StockCard({ quote }: { quote: StockQuote }) {
  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';

  return (
    <div className="flex items-center justify-between py-2.5 px-2.5 md:px-3 hover:bg-white/5 dark:hover:bg-white/10 transition-colors rounded-md gap-3 md:gap-4">
      {/* Left side: Logo, Ticker, Company Name */}
      <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-shrink">
        {/* Logo */}
        <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-background/50 flex items-center justify-center overflow-hidden ring-1 ring-border/20">
          {quote.logoUrl ? (
            <Image
              src={quote.logoUrl}
              alt={quote.symbol}
              fill
              className="object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">{quote.symbol.charAt(0)}</span>
          )}
        </div>

        {/* Ticker and Company Name */}
        <div className="flex flex-col min-w-0">
          <span className="font-bold font-mono text-lg md:text-xl leading-none mb-0.5">{quote.symbol}</span>
          {quote.companyName && (
            <span className="text-xs md:text-sm text-muted-foreground truncate leading-none opacity-80">
              {cleanCompanyName(quote.companyName)}
            </span>
          )}
        </div>
      </div>

      {/* Right side: Price and Change */}
      <div className="flex flex-col items-end flex-shrink-0 gap-1">
        <span className="font-bold font-mono text-lg md:text-xl leading-none whitespace-nowrap">{formatPrice(quote.currentPrice)}</span>
        <span className={cn("text-[11px] md:text-xs font-mono font-medium flex items-center gap-0.5 leading-none whitespace-nowrap", changeColor)}>
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
}

export function StocksWidget() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockQuotes'],
    queryFn: fetchStockQuotes,
    staleTime: 60000, // Consider stale after 1 minute
    refetchInterval: 60000, // Auto-refresh every 1 minute
  });

  // Refetch on mount and window focus
  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Card className="col-span-1 !py-0">
        <CardContent className="!px-3 !py-3">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1 !py-0">
        <CardContent className="!px-3 !py-3">
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load stock quotes
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.quotes.length === 0) {
    return (
      <Card className="col-span-1 !py-0">
        <CardContent className="!px-3 !py-3">
          <p className="text-sm text-muted-foreground text-center py-4">
            No stock data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 w-full max-w-full !py-0 bg-background/40 backdrop-blur-md border-white/10 shadow-none">
      <CardContent className="!px-3 !py-3">
        <div className="space-y-1">
          {data.quotes.map((quote) => (
            <StockCard key={quote.symbol} quote={quote} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
