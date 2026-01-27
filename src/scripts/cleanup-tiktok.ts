/* eslint-disable no-console -- CLI script requires console output */
/**
 * TikTok Cleanup Script
 *
 * Checks all TikTok videos in the database and removes ones that are unavailable.
 * Uses HEAD requests to check if videos are accessible without downloading them.
 *
 * Usage: npx tsx src/scripts/cleanup-tiktok.ts
 *
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 *   --batch=N    Process N videos at a time (default: 50)
 *   --delay=N    Delay N ms between batches (default: 1000)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchArg = args.find(a => a.startsWith('--batch='));
const delayArg = args.find(a => a.startsWith('--delay='));

const BATCH_SIZE = batchArg ? parseInt(batchArg.split('=')[1], 10) : 50;
const BATCH_DELAY = delayArg ? parseInt(delayArg.split('=')[1], 10) : 1000;

interface CheckResult {
  id: string;
  videoId: string;
  url: string;
  available: boolean;
  status?: number;
  error?: string;
}

/**
 * Check if a TikTok video is available
 * Returns true if accessible, false if unavailable/deleted
 */
async function checkVideoAvailability(url: string): Promise<{ available: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // Use HEAD request to check availability without downloading content
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    // TikTok returns 200 for available videos
    // Deleted/unavailable videos typically return 404 or redirect to error pages
    if (response.ok) {
      return { available: true, status: response.status };
    }

    // 404 = definitely deleted
    if (response.status === 404) {
      return { available: false, status: response.status };
    }

    // Other errors might be temporary, mark as available to be safe
    return { available: true, status: response.status };
  } catch (error) {
    // Network errors, timeouts, etc - treat as potentially temporary
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Abort errors are timeouts - could be rate limiting, treat as available
    if (errorMessage.includes('abort')) {
      return { available: true, error: 'Timeout' };
    }

    return { available: true, error: errorMessage };
  }
}

/**
 * Process a batch of videos
 */
async function processBatch(
  videos: Array<{ id: string; videoId: string; url: string }>,
  batchNumber: number,
  totalBatches: number
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Check all videos in parallel (within batch)
  const checks = await Promise.all(
    videos.map(async (video) => {
      const result = await checkVideoAvailability(video.url);
      return {
        id: video.id,
        videoId: video.videoId,
        url: video.url,
        ...result,
      };
    })
  );

  results.push(...checks);

  const unavailable = checks.filter(c => !c.available).length;
  console.log(`Batch ${batchNumber}/${totalBatches}: ${checks.length} checked, ${unavailable} unavailable`);

  return results;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main cleanup function
 */
async function main() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('TikTok Cleanup Script');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('*** DRY RUN MODE - No videos will be deleted ***');
  }

  console.log(`Batch size: ${BATCH_SIZE}, Delay: ${BATCH_DELAY}ms`);
  console.log('-'.repeat(60));

  // Get all videos
  const videos = await prisma.tikTokVideo.findMany({
    select: {
      id: true,
      videoId: true,
      url: true,
    },
    orderBy: { likedAt: 'desc' },
  });

  console.log(`Total videos to check: ${videos.length}`);
  console.log('-'.repeat(60));

  const totalBatches = Math.ceil(videos.length / BATCH_SIZE);
  const unavailableVideos: CheckResult[] = [];
  let totalChecked = 0;

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = videos.slice(i, i + BATCH_SIZE);

    const results = await processBatch(batch, batchNumber, totalBatches);
    totalChecked += results.length;

    // Collect unavailable videos
    unavailableVideos.push(...results.filter(r => !r.available));

    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < videos.length) {
      await sleep(BATCH_DELAY);
    }
  }

  console.log('-'.repeat(60));
  console.log(`\nCheck Summary:`);
  console.log(`  Total checked: ${totalChecked}`);
  console.log(`  Available: ${totalChecked - unavailableVideos.length}`);
  console.log(`  Unavailable: ${unavailableVideos.length}`);

  if (unavailableVideos.length > 0) {
    console.log('\nUnavailable videos:');
    unavailableVideos.forEach(v => {
      console.log(`  - ${v.videoId} (status: ${v.status || v.error})`);
    });

    if (!dryRun) {
      console.log(`\nDeleting ${unavailableVideos.length} unavailable videos...`);

      const deleteResult = await prisma.tikTokVideo.deleteMany({
        where: {
          id: {
            in: unavailableVideos.map(v => v.id),
          },
        },
      });

      console.log(`Deleted ${deleteResult.count} videos`);
    } else {
      console.log(`\n[DRY RUN] Would delete ${unavailableVideos.length} videos`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('-'.repeat(60));
  console.log(`Time elapsed: ${elapsed}s`);
  console.log('='.repeat(60));

  // Final count
  const finalCount = await prisma.tikTokVideo.count();
  console.log(`\nTotal videos in database: ${finalCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
