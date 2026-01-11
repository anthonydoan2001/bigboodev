import { fetchStockQuote } from '@/lib/api/stocks';
import { NextResponse } from 'next/server';

/**
 * Test endpoint to debug Finnhub API issues
 * Call this to see detailed error information
 */
export async function GET() {
  const testSymbol = 'AAPL'; // Test with Apple stock
  
  try {
    console.log('Testing Finnhub API with symbol:', testSymbol);
    console.log('API Key present:', !!process.env.FINNHUB_API_KEY);
    
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
    
    console.error('Finnhub API test failed:', {
      error: errorMessage,
      stack: errorStack,
    });
    
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
}
