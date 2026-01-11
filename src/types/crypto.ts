export interface CoinMarketCapMapResponse {
  data: Array<{
    id: number;
    name: string;
    symbol: string;
    slug: string;
  }>;
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

export interface CoinMarketCapInfoResponse {
  data: Record<string, {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    description: string;
    logo: string;
    urls: {
      website: string[];
      technical_doc: string[];
      twitter: string[];
      reddit: string[];
      message_board: string[];
      announcement: string[];
      chat: string[];
      explorer: string[];
      source_code: string[];
    };
  }>;
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

export interface CoinMarketCapQuoteResponse {
  data: Record<string, {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    quote: {
      USD: {
        price: number;
        volume_24h: number;
        market_cap: number;
        percent_change_1h: number;
        percent_change_24h: number;
        percent_change_7d: number;
        last_updated: string;
      };
    };
  }>;
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  logoUrl: string | null;
  price: number;
  percentChange24h: number | null;
  lastUpdated: string;
}

export interface CryptoQuotesResponse {
  quotes: CryptoQuote[];
  lastUpdated: string;
}
