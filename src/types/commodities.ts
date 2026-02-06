export interface MetalpriceApiResponse {
  success: boolean;
  timestamp: number;
  date: string;
  base: string;
  rates: Record<string, number>;
}

export interface CommodityQuote {
  symbol: string;
  name: string;
  price: number;
  unit: string;
  dailyChange: number | null;
  percentChange: number | null;
  lastUpdated: string;
}

export interface CommodityQuotesResponse {
  quotes: CommodityQuote[];
  lastUpdated: string;
}

export interface CommodityBudgetResponse {
  callsUsed: number;
  callsRemaining: number;
  dailyAverage: number;
  projectedMonthEnd: number;
  lastRefresh: string | null;
  monthlyLimit: number;
}
