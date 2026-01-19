import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

const KOMGA_API_URL = process.env.KOMGA_API_URL || 'https://komga.bigboo.dev/api/v1';
const KOMGA_USERNAME = process.env.KOMGA_USERNAME;
const KOMGA_PASSWORD = process.env.KOMGA_PASSWORD;

function getAuthHeaders(): HeadersInit {
  if (!KOMGA_USERNAME || !KOMGA_PASSWORD) {
    throw new Error('Komga credentials not configured');
  }
  
  const credentials = Buffer.from(`${KOMGA_USERNAME}:${KOMGA_PASSWORD}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

interface SeriesBookEntry {
  series: string;
  issues: string[]; // e.g., ["1", "1-3", "4"]
}

interface PhaseData {
  phase: string;
  entries: SeriesBookEntry[];
}

// Secret Wars reading order based on the screenshot
const SECRET_WARS_READING_ORDER: PhaseData[] = [
  {
    phase: 'Avengers World',
    entries: [
      { series: 'Astonishing Tales', issues: ['1', '2', '3', '4', '5', '6'] },
      { series: 'Shang-Chi Master of Kung Fu Super Issue', issues: ['1'] },
      { series: 'New Avengers', issues: ['1', '2', '3'] },
      { series: 'Avengers', issues: ['1', '2', '3', '4'] },
      { series: 'New Avengers', issues: ['4'] },
      { series: 'Avengers', issues: ['5'] },
      { series: 'New Avengers', issues: ['5', '6'] },
      { series: 'Avengers', issues: ['6', '7', '8', '9', '10', '11', '12', '13'] },
      { series: 'New Avengers', issues: ['7'] },
    ],
  },
  {
    phase: 'Infinity',
    entries: [
      { series: 'Avengers', issues: ['14', '15', '16', '17'] },
      { series: 'New Avengers', issues: ['8'] },
      { series: 'Infinity', issues: ['1'] },
      { series: 'Avengers', issues: ['18'] },
      { series: 'New Avengers', issues: ['9'] },
      { series: 'Infinity', issues: ['2'] },
      { series: 'Avengers', issues: ['19'] },
      { series: 'New Avengers', issues: ['10'] },
      { series: 'Infinity', issues: ['3'] },
      { series: 'Avengers', issues: ['20'] },
      { series: 'Infinity', issues: ['4'] },
      { series: 'Avengers', issues: ['21'] },
      { series: 'New Avengers', issues: ['11'] },
      { series: 'Infinity', issues: ['5'] },
      { series: 'Avengers', issues: ['22', '23'] },
      { series: 'Infinity', issues: ['6'] },
      { series: 'New Avengers', issues: ['12', '13'] },
    ],
  },
  {
    phase: 'The Incursions',
    entries: [
      { series: 'New Avengers', issues: ['14', '15'] },
      { series: 'Avengers', issues: ['24', '25', '26', '27', '28'] },
      { series: 'New Avengers', issues: ['16', '17'] },
      { series: 'Avengers', issues: ['29', '30', '31', '32', '33', '34'] },
      { series: 'New Avengers', issues: ['18', '19', '20', '21', '22', '23'] },
    ],
  },
  {
    phase: 'Time Runs Out',
    entries: [
      { series: 'Avengers', issues: ['35'] },
      { series: 'New Avengers', issues: ['24'] },
      { series: 'Avengers', issues: ['36'] },
      { series: 'New Avengers', issues: ['25'] },
      { series: 'Avengers', issues: ['37'] },
      { series: 'New Avengers', issues: ['26'] },
      { series: 'Avengers', issues: ['38'] },
      { series: 'New Avengers', issues: ['27'] },
      { series: 'Avengers', issues: ['39'] },
      { series: 'New Avengers', issues: ['28'] },
      { series: 'Avengers', issues: ['40'] },
      { series: 'New Avengers', issues: ['29'] },
      { series: 'Avengers', issues: ['41'] },
      { series: 'New Avengers', issues: ['30'] },
      { series: 'Avengers', issues: ['42'] },
      { series: 'New Avengers', issues: ['31', '32'] },
      { series: 'Avengers', issues: ['43'] },
      { series: 'New Avengers', issues: ['33'] },
      { series: 'Avengers', issues: ['44'] },
    ],
  },
];

async function findSeriesByName(seriesName: string): Promise<string | null> {
  try {
    // Search for series
    const url = `${KOMGA_API_URL}/series?search=${encodeURIComponent(seriesName)}&size=100`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error(`Failed to search for series: ${seriesName}`);
      return null;
    }

    const data = await response.json();
    const series = data.content || [];

    // Try to find exact match first
    const exactMatch = series.find((s: any) => 
      s.name?.toLowerCase() === seriesName.toLowerCase() ||
      s.metadata?.title?.toLowerCase() === seriesName.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch.id;
    }

    // Try partial match
    const partialMatch = series.find((s: any) => 
      s.name?.toLowerCase().includes(seriesName.toLowerCase()) ||
      s.metadata?.title?.toLowerCase().includes(seriesName.toLowerCase())
    );

    return partialMatch?.id || null;
  } catch (error) {
    console.error(`Error searching for series ${seriesName}:`, error);
    return null;
  }
}

async function findBookByIssue(seriesId: string, issueNumber: string): Promise<string | null> {
  try {
    // Get all books for the series
    const url = `${KOMGA_API_URL}/series/${seriesId}/books?size=1000&sort=numberSort,asc`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error(`Failed to fetch books for series ${seriesId}`);
      return null;
    }

    const data = await response.json();
    const books = data.content || [];

    // Parse issue number (handle ranges like "1-3")
    const issueNum = parseInt(issueNumber.split('-')[0], 10);

    // Find book by issue number
    const book = books.find((b: any) => {
      const bookNumber = parseInt(b.metadata?.number || '0', 10);
      return bookNumber === issueNum;
    });

    return book?.id || null;
  } catch (error) {
    console.error(`Error finding book ${issueNumber} in series ${seriesId}:`, error);
    return null;
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    if (!KOMGA_API_URL || !KOMGA_USERNAME || !KOMGA_PASSWORD) {
      return NextResponse.json(
        { error: 'Komga API not configured' },
        { status: 500 }
      );
    }

    // Check if collection already exists
    const existingCollection = await db.collection.findFirst({
      where: { name: 'Secret Wars' },
    });

    if (existingCollection) {
      return NextResponse.json(
        { error: 'Secret Wars collection already exists', collectionId: existingCollection.id },
        { status: 400 }
      );
    }

    // Create the collection
    const collection = await db.collection.create({
      data: {
        name: 'Secret Wars',
        description: 'Jonathan Hickman\'s Secret Wars reading order',
      },
    });

    const items: Array<{ seriesId?: string; bookId?: string; phase: string; order: number }> = [];
    let globalOrder = 0;

    // Process each phase
    for (const phaseData of SECRET_WARS_READING_ORDER) {
      for (const entry of phaseData.entries) {
        // Find the series
        const seriesId = await findSeriesByName(entry.series);
        
        if (!seriesId) {
          console.warn(`Series not found: ${entry.series}`);
          continue;
        }

        // For each issue, find the book
        for (const issue of entry.issues) {
          const bookId = await findBookByIssue(seriesId, issue);
          
          if (bookId) {
            items.push({
              bookId,
              phase: phaseData.phase,
              order: globalOrder++,
            });
          } else {
            console.warn(`Book not found: ${entry.series} #${issue}`);
            // If book not found, add series reference instead
            items.push({
              seriesId,
              phase: phaseData.phase,
              order: globalOrder++,
            });
          }
        }
      }
    }

    // Add all items to the collection
    if (items.length > 0) {
      await db.collectionItem.createMany({
        data: items.map(item => ({
          collectionId: collection.id,
          seriesId: item.seriesId || null,
          bookId: item.bookId || null,
          phase: item.phase,
          order: item.order,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      collectionId: collection.id,
      itemsAdded: items.length,
      message: `Secret Wars collection created with ${items.length} items`,
    });
  } catch (error) {
    console.error('Error seeding Secret Wars collection:', error);
    return NextResponse.json(
      { error: 'Failed to seed Secret Wars collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
