'use client';

import { Card, CardContent } from '@/components/ui/card';
import { fetchCryptoQuotesFromDB } from '@/lib/api/crypto';
import { fetchStockQuotes } from '@/lib/api/stocks';
import { cn } from '@/lib/utils';
import { CryptoQuote } from '@/types/crypto';
import { StockQuote } from '@/types/stocks';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useEffect } from 'react';
import Image from 'next/image';

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

function StockCard({ quote }: { quote: StockQuote }) {
  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center justify-between py-1.5 px-1.5 md:px-2 rounded-md gap-2 md:gap-3">
      {/* Left side: Logo, Ticker, Company Name */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-shrink">
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
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5 ml-2">
        <span className="font-bold font-mono text-lg md:text-xl leading-none whitespace-nowrap">{formatPrice(quote.currentPrice)}</span>
        <span className={cn("text-xs md:text-sm font-mono font-medium flex items-center gap-0.5 leading-none whitespace-nowrap", changeColor)}>
          {isPositive ? (
            <ArrowUp className="h-3 w-3 md:h-4 md:w-4" />
          ) : (
            <ArrowDown className="h-3 w-3 md:h-4 md:w-4" />
          )}
          {formatPercentChange(quote.percentChange)}
        </span>
      </div>
    </div>
  );
}

function CryptoCard({ crypto }: { crypto: CryptoQuote }) {
  const percentChange = crypto.percentChange24h ?? 0;
  const isPositive = percentChange >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center justify-between py-1.5 px-1.5 md:px-2 rounded-md gap-2 md:gap-3">
      {/* Left side: Logo, Symbol, Name */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-shrink">
        {/* Logo */}
        <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-background/50 flex items-center justify-center overflow-hidden ring-1 ring-border/20">
          {crypto.logoUrl ? (
            <Image
              src={crypto.logoUrl}
              alt={crypto.symbol}
              fill
              className="object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">{crypto.symbol.charAt(0)}</span>
          )}
        </div>
        
        {/* Symbol and Name */}
        <div className="flex flex-col min-w-0">
          <span className="font-bold font-mono text-lg md:text-xl leading-none mb-0.5">{crypto.symbol}</span>
          {crypto.name && (
            <span className="text-xs md:text-sm text-muted-foreground truncate leading-none opacity-80">
              {crypto.name}
            </span>
          )}
        </div>
      </div>

      {/* Right side: Price and Change */}
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5 ml-2">
        <span className="font-bold font-mono text-lg md:text-xl leading-none whitespace-nowrap">{formatPrice(crypto.price)}</span>
        <span className={cn("text-xs md:text-sm font-mono font-medium flex items-center gap-0.5 leading-none whitespace-nowrap", changeColor)}>
          {isPositive ? (
            <ArrowUp className="h-3 w-3 md:h-4 md:w-4" />
          ) : (
            <ArrowDown className="h-3 w-3 md:h-4 md:w-4" />
          )}
          {formatPercentChange(crypto.percentChange24h)}
        </span>
      </div>
    </div>
  );
}

export function StocksCryptoWidget() {
  const { data: stocksData, isLoading: stocksLoading, error: stocksError, refetch: refetchStocks } = useQuery({
    queryKey: ['stockQuotes'],
    queryFn: fetchStockQuotes,
    staleTime: 60000, // Consider stale after 1 minute
    refetchInterval: 60000, // Auto-refresh every 1 minute
  });

  const { data: cryptoData, isLoading: cryptoLoading, error: cryptoError, refetch: refetchCrypto } = useQuery({
    queryKey: ['cryptoQuotes'],
    queryFn: fetchCryptoQuotesFromDB,
    staleTime: 30000, // Consider stale after 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Refetch on mount and window focus
  useEffect(() => {
    refetchStocks();
    refetchCrypto();
  }, [refetchStocks, refetchCrypto]);

  const isLoading = stocksLoading || cryptoLoading;
  const hasError = stocksError || cryptoError;
  const hasStocks = stocksData && stocksData.quotes.length > 0;
  const hasCrypto = cryptoData && cryptoData.quotes.length > 0;
  const hasData = hasStocks || hasCrypto;

  if (isLoading) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-muted/20 animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError || !hasData) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {hasError ? 'Failed to load market data' : 'No market data available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
