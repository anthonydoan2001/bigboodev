'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchCommodityQuotesFromDB } from '@/lib/api/commodities';
import { fetchCryptoQuotesFromDB } from '@/lib/api/crypto';
import { fetchGasPrice } from '@/lib/api/gas';
import { fetchStockQuotes } from '@/lib/api/stocks';
import { cn } from '@/lib/utils';
import { CommodityQuote } from '@/types/commodities';
import { CryptoQuote } from '@/types/crypto';
import { GasPriceData } from '@/types/gas';
import { StockQuote } from '@/types/stocks';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Fuel, Coins, Gem, Crown, type LucideIcon } from 'lucide-react';
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

const StockCard = memo(function StockCard({ quote }: { quote: StockQuote }) {
  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';

  return (
    <div className="flex items-center justify-between py-2 px-2.5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      {/* Left side: Logo & Ticker */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Logo */}
        <div className="relative w-6 h-6 flex-shrink-0 rounded-full bg-background/50 flex items-center justify-center overflow-hidden ring-1 ring-border/10">
          {quote.logoUrl ? (
            <Image
              src={quote.logoUrl}
              alt={quote.symbol}
              fill
              className="object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-[9px] font-semibold text-muted-foreground">{quote.symbol.charAt(0)}</span>
          )}
        </div>

        {/* Ticker */}
        <span className="font-semibold font-mono text-xs leading-none">{quote.symbol}</span>
      </div>

      {/* Middle: Price */}
      <div className="flex-shrink-0 mx-3">
        <span className="font-mono text-xs font-medium tabular-nums">{formatPrice(quote.currentPrice)}</span>
      </div>

      {/* Right: Change */}
      <div className="flex items-center gap-0.5 flex-shrink-0 min-w-[70px] justify-end">
        <span className={cn("text-[10px] font-mono font-medium flex items-center gap-0.5 tabular-nums", changeColor)}>
          {isPositive ? (
            <ArrowUp className="h-2.5 w-2.5" />
          ) : (
            <ArrowDown className="h-2.5 w-2.5" />
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
  const changeColor = isPositive ? 'text-success' : 'text-destructive';

  return (
    <div className="flex items-center justify-between py-2 px-2.5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      {/* Left side: Logo & Symbol */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Logo */}
        <div className="relative w-6 h-6 flex-shrink-0 rounded-full bg-background/50 flex items-center justify-center overflow-hidden ring-1 ring-border/10">
          {crypto.logoUrl ? (
            <Image
              src={crypto.logoUrl}
              alt={crypto.symbol}
              fill
              className="object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-[9px] font-semibold text-muted-foreground">{crypto.symbol.charAt(0)}</span>
          )}
        </div>

        {/* Symbol */}
        <span className="font-semibold font-mono text-xs leading-none">{crypto.symbol}</span>
      </div>

      {/* Middle: Price */}
      <div className="flex-shrink-0 mx-3">
        <span className="font-mono text-xs font-medium tabular-nums">{formatPrice(crypto.price)}</span>
      </div>

      {/* Right: Change */}
      <div className="flex items-center gap-0.5 flex-shrink-0 min-w-[70px] justify-end">
        <span className={cn("text-[10px] font-mono font-medium flex items-center gap-0.5 tabular-nums", changeColor)}>
          {isPositive ? (
            <ArrowUp className="h-2.5 w-2.5" />
          ) : (
            <ArrowDown className="h-2.5 w-2.5" />
          )}
          {formatPercentChange(crypto.percentChange24h)}
        </span>
      </div>
    </div>
  );
});

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

const GasPriceCard = memo(function GasPriceCard({ gas }: { gas: GasPriceData }) {
  return (
    <div className="flex items-center justify-between py-2 px-2.5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      {/* Left side: Icon & Label */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="relative w-6 h-6 flex-shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/20">
          <Fuel className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold font-mono text-xs leading-none">GAS</span>
          <span className="text-[9px] text-muted-foreground truncate leading-none mt-0.5">{gas.station}</span>
        </div>
      </div>

      {/* Middle: Price */}
      <div className="flex-shrink-0 mx-3">
        <span className="font-mono text-xs font-medium tabular-nums">${gas.regular.toFixed(2)}</span>
      </div>

      {/* Right: Last updated */}
      <div className="flex items-center gap-0.5 flex-shrink-0 min-w-[70px] justify-end">
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {formatRelativeTime(gas.scrapedAt)}
        </span>
      </div>
    </div>
  );
});

const COMMODITY_DISPLAY: Record<string, { label: string; Icon: LucideIcon; bg: string; ring: string; iconColor: string }> = {
  XAU: { label: 'GOLD', Icon: Coins, bg: 'bg-amber-500/15', ring: 'ring-amber-500/20', iconColor: 'text-amber-500' },
  XAG: { label: 'SILVER', Icon: Gem, bg: 'bg-slate-400/15', ring: 'ring-slate-400/20', iconColor: 'text-slate-400' },
  XPT: { label: 'PLATINUM', Icon: Crown, bg: 'bg-indigo-400/15', ring: 'ring-indigo-400/20', iconColor: 'text-indigo-400' },
};

const COMMODITY_SORT_ORDER = ['XAU', 'XAG', 'XPT'];

const CommodityCard = memo(function CommodityCard({ commodity }: { commodity: CommodityQuote }) {
  const percentChange = commodity.percentChange ?? 0;
  const isPositive = percentChange >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';
  const display = COMMODITY_DISPLAY[commodity.symbol] || { label: commodity.symbol, Icon: Coins, bg: 'bg-amber-500/15', ring: 'ring-amber-500/20', iconColor: 'text-amber-500' };
  const { Icon } = display;

  return (
    <div className="flex items-center justify-between py-2 px-2.5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
      {/* Left side: Icon & Name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={cn("relative w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center ring-1", display.bg, display.ring)}>
          <Icon className={cn("h-3.5 w-3.5", display.iconColor)} />
        </div>
        <span className="font-semibold font-mono text-xs leading-none">{display.label}</span>
      </div>

      {/* Middle: Price */}
      <div className="flex-shrink-0 mx-3">
        <span className="font-mono text-xs font-medium tabular-nums">{formatPrice(commodity.price)}</span>
      </div>

      {/* Right: Change */}
      <div className="flex items-center gap-0.5 flex-shrink-0 min-w-[70px] justify-end">
        {commodity.percentChange !== null ? (
          <span className={cn("text-[10px] font-mono font-medium flex items-center gap-0.5 tabular-nums", changeColor)}>
            {isPositive ? (
              <ArrowUp className="h-2.5 w-2.5" />
            ) : (
              <ArrowDown className="h-2.5 w-2.5" />
            )}
            {formatPercentChange(commodity.percentChange)}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            {formatRelativeTime(commodity.lastUpdated)}
          </span>
        )}
      </div>
    </div>
  );
});

export function PricesWidget() {
  const { data: gasData, isLoading: gasLoading } = useQuery({
    queryKey: ['gasPrice'],
    queryFn: fetchGasPrice,
    staleTime: 1800000, // 30 minutes
    refetchInterval: 1800000,
    refetchOnMount: 'always' as const,
  });

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

  const { data: commodityData, isLoading: commodityLoading, error: commodityError } = useQuery({
    queryKey: ['commodityQuotes'],
    queryFn: fetchCommodityQuotesFromDB,
    staleTime: 3600000, // Consider stale after 1 hour
    refetchInterval: 3600000, // Auto-refresh every 1 hour
    refetchOnMount: 'always',
  });

  const isLoading = stocksLoading || cryptoLoading || gasLoading || commodityLoading;
  const hasError = stocksError || cryptoError || commodityError;
  const hasStocks = stocksData && stocksData.quotes.length > 0;
  const hasCrypto = cryptoData && cryptoData.quotes.length > 0;
  const hasCommodities = commodityData && commodityData.quotes.length > 0;
  const hasData = hasStocks || hasCrypto || hasCommodities;

  if (isLoading) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm h-full py-0 gap-0">
        <CardContent className="p-0">
          <div className="divide-y divide-border/40 py-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 px-2.5" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="w-6 h-6" rounded="full" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-14 mx-3" />
                <Skeleton className="h-3 w-14" />
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
        <CardContent className="p-0">
          <div className="py-8 px-4">
            <p className="text-xs text-muted-foreground text-center">
              {hasError ? 'Failed to load market data' : 'No market data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-background/40 backdrop-blur-md border-white/10 shadow-sm py-0 gap-0 transition-all hover:shadow-md flex flex-col">
      <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="py-1">
          <div className="divide-y divide-border/40">
            {/* Gas Price */}
            {gasData?.gasPrice && (
              <GasPriceCard gas={gasData.gasPrice} />
            )}

            {/* Stocks */}
            {hasStocks && stocksData.quotes.map((quote) => (
              <StockCard key={quote.symbol} quote={quote} />
            ))}

            {/* Crypto */}
            {hasCrypto && cryptoData.quotes.map((crypto: CryptoQuote) => (
              <CryptoCard key={crypto.symbol} crypto={crypto} />
            ))}

            {/* Commodities */}
            {hasCommodities && [...commodityData.quotes]
              .sort((a, b) => COMMODITY_SORT_ORDER.indexOf(a.symbol) - COMMODITY_SORT_ORDER.indexOf(b.symbol))
              .map((commodity: CommodityQuote) => (
                <CommodityCard key={commodity.symbol} commodity={commodity} />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
