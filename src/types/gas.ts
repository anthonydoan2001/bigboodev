export interface GasPriceData {
  station: string;
  stationId: string;
  regular: number;
  scrapedAt: string;
}

export interface GasPriceResponse {
  gasPrice: GasPriceData | null;
  error?: string;
}
