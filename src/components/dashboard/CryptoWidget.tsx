'use client';

import { Card, CardContent } from '@/components/ui/card';
import { fetchCryptoQuotesFromDB } from '@/lib/api/crypto';
import { cn } from '@/lib/utils';
import { CryptoQuote } from '@/types/crypto';
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

function CryptoCard({ crypto }: { crypto: CryptoQuote }) {
  const percentChange = crypto.percentChange24h ?? 0;
  const isPositive = percentChange >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';

  return (
    <div className="flex items-center justify-between py-1.5 px-1.5 md:px-2 hover:bg-muted/50 transition-colors rounded-md gap-2 md:gap-3">
      {/* Left side: Logo, Symbol, Name */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-shrink">
        {/* Logo */}
        <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border/50">
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
          <span className="font-bold text-lg md:text-xl leading-none mb-0.5">{crypto.symbol}</span>
          {crypto.name && (
            <span className="text-xs md:text-sm text-muted-foreground truncate leading-none opacity-80">
              {crypto.name}
            </span>
          )}
        </div>
      </div>

      {/* Right side: Price and Change */}
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
        <span className="font-bold text-lg md:text-xl leading-none whitespace-nowrap">{formatPrice(crypto.price)}</span>
        <span className={cn("text-xs md:text-sm font-semibold flex items-center gap-0.5 leading-none whitespace-nowrap", changeColor)}>
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

export function CryptoWidget() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cryptoQuotes'],
    queryFn: fetchCryptoQuotesFromDB,
    staleTime: 30000, // Consider stale after 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
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
              <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
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
            Failed to load crypto quotes
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
            No crypto data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 w-full max-w-full !py-0 bg-background/40 backdrop-blur-md border-white/10 shadow-none">
      <CardContent className="!px-3 !py-3">
        <div className="space-y-0.5">
          {data.quotes.map((crypto: CryptoQuote) => (
            <CryptoCard key={crypto.symbol} crypto={crypto} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
