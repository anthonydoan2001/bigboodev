/**
 * TikTok Metadata Refresh Script
 *
 * Fetches thumbnails and titles for videos that don't have them.
 * Follows redirects from tiktokv.com to get the real TikTok URL,
 * then uses oEmbed API to get metadata.
 *
 * Usage: npx tsx src/scripts/refresh-tiktok-metadata.ts
 *
 * Options:
 *   --limit=N     Only process N videos (default: all)
 *   --batch=N     Process N videos at a time (default: 10)
 *   --delay=N     Delay N ms between batches (default: 3000)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const batchArg = args.find(a => a.startsWith('--batch='));
const delayArg = args.find(a => a.startsWith('--delay='));

const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
const BATCH_SIZE = batchArg ? parseInt(batchArg.split('=')[1], 10) : 10;
const BATCH_DELAY = delayArg ? parseInt(delayArg.split('=')[1], 10) : 3000;

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

/**
 * Follow redirects to get the final URL
 */
async function getRedirectedUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    // The final URL after redirects
    return response.url;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch oEmbed data from TikTok
 */
async function fetchOEmbed(url: string): Promise<OEmbedResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Process a single video
 */
async function processVideo(video: { id: string; videoId: string; url: string }): Promise<{
  success: boolean;
  thumbnail?: string;
  title?: string;
  authorName?: string;
}> {
  // Step 1: Follow redirects to get the real TikTok URL
  const realUrl = await getRedirectedUrl(video.url);

  if (!realUrl || !realUrl.includes('tiktok.com')) {
    return { success: false };
  }

  // Step 2: Fetch oEmbed data using the real URL
  const oembedData = await fetchOEmbed(realUrl);

  if (!oembedData || !oembedData.thumbnail_url) {
    return { success: false };
  }

  return {
    success: true,
    thumbnail: oembedData.thumbnail_url,
    title: oembedData.title,
    authorName: oembedData.author_name,
  };
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('TikTok Metadata Refresh Script');
  console.log('='.repeat(60));
  console.log(`Batch size: ${BATCH_SIZE}, Delay: ${BATCH_DELAY}ms`);
  if (LIMIT) {
    console.log(`Limit: ${LIMIT} videos`);
  }
  console.log('-'.repeat(60));

  // Get videos without thumbnails
  const videos = await prisma.tikTokVideo.findMany({
    where: {
      thumbnail: null,
    },
    select: {
      id: true,
      videoId: true,
      url: true,
    },
    take: LIMIT,
    orderBy: { likedAt: 'desc' },
  });

  console.log(`Found ${videos.length} videos without thumbnails`);

  if (videos.length === 0) {
    console.log('Nothing to process!');
    return;
  }

  console.log('-'.repeat(60));

  let successCount = 0;
  let failCount = 0;
  const totalBatches = Math.ceil(videos.length / BATCH_SIZE);

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = videos.slice(i, i + BATCH_SIZE);

    console.log(`\nProcessing batch ${batchNumber}/${totalBatches}...`);

    // Process batch sequentially to avoid rate limiting
    for (const video of batch) {
      const result = await processVideo(video);

      if (result.success) {
        // Update database
        await prisma.tikTokVideo.update({
          where: { id: video.id },
          data: {
            thumbnail: result.thumbnail,
            title: result.title,
            authorName: result.authorName,
          },
        });
        successCount++;
        console.log(`  ✓ ${video.videoId} - Got thumbnail`);
      } else {
        failCount++;
        console.log(`  ✗ ${video.videoId} - Failed`);
      }

      // Small delay between individual requests
      await sleep(500);
    }

    // Delay between batches
    if (i + BATCH_SIZE < videos.length) {
      console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
      await sleep(BATCH_DELAY);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '-'.repeat(60));
  console.log('Summary:');
  console.log(`  Processed: ${videos.length}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Time: ${elapsed}s`);
  console.log('='.repeat(60));

  // Show current stats
  const withThumbnails = await prisma.tikTokVideo.count({ where: { thumbnail: { not: null } } });
  const total = await prisma.tikTokVideo.count();
  console.log(`\nDatabase: ${withThumbnails}/${total} videos have thumbnails`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
