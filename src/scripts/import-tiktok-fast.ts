/* eslint-disable no-console -- CLI script requires console output */
/**
 * TikTok Likes Fast Import Script (No Metadata)
 *
 * Quickly imports TikTok likes from Excel file without fetching oEmbed metadata.
 * Metadata can be fetched later via a separate refresh script if needed.
 *
 * Usage: npx tsx src/scripts/import-tiktok-fast.ts
 */

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { extractVideoId } from '../lib/tiktok-utils';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExcelRow {
  Date: string | number;
  Link: string;
}

interface VideoData {
  videoId: string;
  url: string;
  likedAt: Date;
}

/**
 * Parse Excel serial date to JavaScript Date
 */
function parseExcelDate(value: string | number): Date {
  if (typeof value === 'number') {
    // Excel serial date (days since 1900-01-01)
    const excelEpoch = new Date(1900, 0, 1);
    const days = value - 2; // Excel has a bug where it thinks 1900 was a leap year
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  }
  // Try parsing as string date
  return new Date(value);
}

/**
 * Read and parse the Excel file
 */
function readExcelFile(filePath: string): VideoData[] {
  console.log(`Reading Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with header row
  const rawData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { header: ['Date', 'Link'] });

  // Skip header row if it exists
  const data = rawData.filter(row =>
    row.Link &&
    typeof row.Link === 'string' &&
    row.Link.includes('tiktok')
  );

  console.log(`Found ${data.length} TikTok links in Excel file`);

  const videos: VideoData[] = [];
  let skipped = 0;

  for (const row of data) {
    const videoId = extractVideoId(row.Link);
    if (!videoId) {
      skipped++;
      continue;
    }

    const likedAt = parseExcelDate(row.Date);
    if (isNaN(likedAt.getTime())) {
      console.warn(`Invalid date for video ${videoId}: ${row.Date}`);
      continue;
    }

    videos.push({
      videoId,
      url: row.Link,
      likedAt,
    });
  }

  if (skipped > 0) {
    console.log(`Skipped ${skipped} rows without valid video IDs`);
  }

  return videos;
}

/**
 * Main import function
 */
async function main() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('TikTok Likes Fast Import Script (No Metadata)');
  console.log('='.repeat(60));

  // Read Excel file
  const excelPath = path.join(process.cwd(), 'public', 'TikTok_Likes.xlsx');
  const videos = readExcelFile(excelPath);

  if (videos.length === 0) {
    console.log('No videos to import');
    return;
  }

  console.log(`\nStarting import of ${videos.length} videos...`);
  console.log('-'.repeat(60));

  // Batch upsert for efficiency
  const BATCH_SIZE = 500;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);

    // Use transaction for batch
    const results = await Promise.allSettled(
      batch.map(video =>
        prisma.tikTokVideo.upsert({
          where: { videoId: video.videoId },
          update: {
            url: video.url,
            likedAt: video.likedAt,
          },
          create: {
            videoId: video.videoId,
            url: video.url,
            likedAt: video.likedAt,
          },
        })
      )
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        imported++;
      } else {
        errors++;
        console.error(`Failed to import video ${batch[idx].videoId}:`, result.reason);
      }
    });

    const progress = Math.min(100, Math.round(((i + batch.length) / videos.length) * 100));
    console.log(`Progress: ${progress}% (${imported} imported, ${errors} errors)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('-'.repeat(60));
  console.log('\nImport Summary:');
  console.log(`  Total videos in Excel: ${videos.length}`);
  console.log(`  Successfully imported: ${imported}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Time elapsed: ${elapsed}s`);
  console.log('='.repeat(60));

  // Verify database count
  const dbCount = await prisma.tikTokVideo.count();
  console.log(`\nTotal videos in database: ${dbCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
