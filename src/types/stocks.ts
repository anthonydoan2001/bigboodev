export interface FinnhubQuoteResponse {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

export interface StockQuote {
  id: string;
  symbol: string;
  companyName: string | null;
  logoUrl: string | null;
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinnhubCompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  name: string;
  ticker: string;
  logo: string;
  weburl: string;
  finnhubIndustry: string;
}

export interface StockQuotesResponse {
  quotes: StockQuote[];
  lastUpdated: string;
}
