import { fetchStockQuote } from '@/lib/api/stocks';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

/**
 * Test endpoint to debug Finnhub API issues
 * Call this to see detailed error information
 */
export const GET = withAuth(async () => {
  const testSymbol = 'AAPL'; // Test with Apple stock
  
  try {
    void 0; //('Testing Finnhub API with symbol:', testSymbol);
    void 0; //('API Key present:', !!process.env.FINNHUB_API_KEY);
    
    const quote = await fetchStockQuote(testSymbol);
    
    return NextResponse.json({
      success: true,
      symbol: testSymbol,
      quote,
      message: 'Finnhub API is working correctly',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      success: false,
      symbol: testSymbol,
      error: errorMessage,
      details: errorStack,
      troubleshooting: {
        checkApiKey: 'Verify FINNHUB_API_KEY is set in .env',
        checkNetwork: 'Check if Finnhub API is accessible',
        checkMarketHours: 'Note: API may return zeros when market is closed',
        apiDocs: 'https://finnhub.io/docs/api/quote',
      },
    }, { status: 500 });
  }
});
