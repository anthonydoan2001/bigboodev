import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const QUOTABLE_API = 'https://api.quotable.io';

// Fallback quotes - curated list for daily rotation
const FALLBACK_QUOTES = [
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { content: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
  { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { content: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { content: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { content: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { content: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { content: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { content: "You learn more from failure than from success.", author: "Unknown" },
  { content: "If you are working on something exciting that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs" },
  { content: "People who are crazy enough to think they can change the world, are the ones who do.", author: "Rob Siltanen" },
  { content: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou" },
  { content: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { content: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
  { content: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { content: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { content: "The person who says it cannot be done should not interrupt the person who is doing it.", author: "Chinese Proverb" },
  { content: "There are no traffic jams along the extra mile.", author: "Roger Staubach" },
  { content: "It is never too late to be what you might have been.", author: "George Eliot" },
  { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { content: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { content: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { content: "The only way to achieve the impossible is to believe it is possible.", author: "Charles Kingsleigh" },
  { content: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { content: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { content: "Your limitation—it's only your imagination.", author: "Unknown" },
  { content: "Great things never come from comfort zones.", author: "Unknown" },
  { content: "Dream it. Wish it. Do it.", author: "Unknown" },
  { content: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
];

// Simple hash function to get consistent daily quote
function getDailyQuoteIndex(dateString: string): number {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % FALLBACK_QUOTES.length;
}

export async function GET(request: Request) {
  try {
    // Get date parameter or use today's date
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Check if we already have a quote for this date in the database
    const existingQuote = await db.dailyQuote.findUnique({
      where: { date: dateParam },
    });

    if (existingQuote) {
      // Return cached quote from database
      return NextResponse.json({
        _id: `quote-${dateParam}`,
        content: existingQuote.content,
        author: existingQuote.author,
        authorSlug: existingQuote.author.toLowerCase().replace(/\s+/g, '-'),
        length: existingQuote.content.length,
        tags: [],
      });
    }

    // No cached quote found, fetch from API
    let quoteData: {
      _id: string;
      content: string;
      author: string;
      authorSlug: string;
      length: number;
      tags: string[];
      source: string;
    } | null = null;

    // Try to fetch from Quotable API first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${QUOTABLE_API}/quotes/random`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const quotes = await response.json();
        const quote = Array.isArray(quotes) ? quotes[0] : quotes;
        quoteData = {
          _id: quote._id || `quotable-${Date.now()}`,
          content: quote.content,
          author: quote.author,
          authorSlug: quote.authorSlug || quote.author.toLowerCase().replace(/\s+/g, '-'),
          length: quote.length || quote.content.length,
          tags: quote.tags || [],
          source: 'quotable',
        };
      }
    } catch (apiError) {
      // API failed, will use fallback
      console.log('Quotable API unavailable, using fallback quotes');
    }

    // If API failed, use fallback quotes
    if (!quoteData) {
      const quoteIndex = getDailyQuoteIndex(dateParam);
      const fallbackQuote = FALLBACK_QUOTES[quoteIndex];
      quoteData = {
        _id: `fallback-${dateParam}-${quoteIndex}`,
        content: fallbackQuote.content,
        author: fallbackQuote.author,
        authorSlug: fallbackQuote.author.toLowerCase().replace(/\s+/g, '-'),
        length: fallbackQuote.content.length,
        tags: ['inspirational', 'daily'],
        source: 'fallback',
      };
    }

        // Save quote to database for future requests
        try {
          await db.dailyQuote.upsert({
            where: { date: dateParam },
            update: {
              content: quoteData.content,
              author: quoteData.author,
            },
            create: {
              date: dateParam,
              content: quoteData.content,
              author: quoteData.author,
            },
          });
        } catch (dbError) {
          // If database save fails, still return the quote
          // This could happen if two requests try to create the same quote simultaneously
          console.error('Failed to save quote to database:', dbError);
        }

    // Return the quote
    return NextResponse.json({
      _id: quoteData._id || `quote-${dateParam}`,
      content: quoteData.content,
      author: quoteData.author,
      authorSlug: quoteData.authorSlug || quoteData.author.toLowerCase().replace(/\s+/g, '-'),
      length: quoteData.length || quoteData.content.length,
      tags: quoteData.tags || [],
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    
    // Last resort fallback
    const today = new Date().toISOString().split('T')[0];
    const quoteIndex = getDailyQuoteIndex(today);
    const fallbackQuote = FALLBACK_QUOTES[quoteIndex];
    
    return NextResponse.json({
      _id: `fallback-${today}-${quoteIndex}`,
      content: fallbackQuote.content,
      author: fallbackQuote.author,
      authorSlug: fallbackQuote.author.toLowerCase().replace(/\s+/g, '-'),
      length: fallbackQuote.content.length,
      tags: ['inspirational', 'daily'],
    });
  }
});
