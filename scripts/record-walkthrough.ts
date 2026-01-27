/* eslint-disable no-console -- CLI script requires console output */
import 'dotenv/config';
import puppeteer, { Page, Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const WEBSITE_URL = process.env.WEBSITE_URL || 'http://localhost:3000';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || '';
const OUTPUT_DIR = './out';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'walkthrough.webm');
const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cursor element that will be injected into the page
const CURSOR_STYLES = `
  #fake-cursor {
    position: fixed;
    width: 24px;
    height: 24px;
    pointer-events: none;
    z-index: 999999;
    transition: left 0.5s ease-out, top 0.5s ease-out;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  html {
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center center;
  }
`;

const CURSOR_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="#fff" stroke="#000" stroke-width="1.5" d="M5.5 3.21V20.8l5.67-5.43h8.55L5.5 3.21z"/>
  </svg>
`;

interface WalkthroughStep {
  name: string;
  path: string;
  actions: (page: Page) => Promise<void>;
  duration: number; // ms to spend on this step
  waitFor?: string; // CSS selector to wait for before starting
}

// Wait for page to be fully ready (no loading states)
async function waitForPageReady(page: Page, waitForSelector?: string) {
  // Wait for network to be idle
  await page.waitForNetworkIdle({ timeout: 30000 }).catch(() => {});

  // Wait for specific selector if provided
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 15000 }).catch(() => {});
  }

  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '[class*="loading"]',
    '[class*="skeleton"]',
    '[class*="spinner"]',
    '[class*="Skeleton"]',
    '[class*="Loading"]',
    '[data-loading="true"]',
  ];

  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { hidden: true, timeout: 5000 });
    } catch {
      // Selector might not exist, that's fine
    }
  }

  // Extra buffer for animations to complete
  await sleep(1000);
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    name: 'Dashboard',
    path: '/',
    duration: 5000,
    waitFor: 'main', // Wait for main content
    actions: async (page) => {
      // Start wide, then zoom into clock/greeting
      await moveCursor(page, 960, 200);
      await sleep(500);
      await zoomIn(page, 1.4, 960, 250); // Zoom into clock area
      await moveCursor(page, 960, 300);
      await sleep(800);
      await zoomOut(page);
      await sleep(400);

      // Move to widgets and zoom
      await moveCursor(page, 400, 450);
      await sleep(400);
      await zoomIn(page, 1.3, 400, 450); // Zoom into widget
      await sleep(800);
      await zoomOut(page);
      await sleep(400);

      await smoothScroll(page, 200);
      await sleep(400);
    },
  },
  {
    name: 'Manga Library',
    path: '/manga',
    duration: 4000,
    waitFor: '[class*="grid"], [class*="Grid"], main',
    actions: async (page) => {
      await moveCursor(page, 350, 350); // First manga card
      await sleep(400);
      await zoomIn(page, 1.5, 350, 350); // Zoom into first card
      await sleep(800);
      await zoomOut(page);
      await sleep(300);

      await moveCursor(page, 700, 350); // Second card
      await sleep(400);
      await moveCursor(page, 1050, 350); // Third card
      await sleep(400);
      await zoomIn(page, 1.3, 700, 400); // Zoom to show row
      await sleep(600);
      await zoomOut(page);
      await sleep(300);
    },
  },
  {
    name: 'Watchlist',
    path: '/watchlist',
    duration: 4000,
    waitFor: '[class*="carousel"], [class*="Carousel"], main',
    actions: async (page) => {
      await moveCursor(page, 400, 350); // Carousel item
      await sleep(400);
      await zoomIn(page, 1.4, 400, 350); // Zoom into card
      await sleep(800);
      await zoomOut(page);
      await sleep(300);

      // Pan across carousel
      await moveCursor(page, 800, 350);
      await sleep(400);
      await moveCursor(page, 1200, 350);
      await sleep(400);

      await smoothScroll(page, 300);
      await sleep(400);
      await zoomIn(page, 1.3, 600, 500); // Zoom into another section
      await sleep(600);
      await zoomOut(page);
      await sleep(300);
    },
  },
  {
    name: 'Sports',
    path: '/sports',
    duration: 3500,
    waitFor: '[class*="score"], [class*="Score"], main',
    actions: async (page) => {
      await moveCursor(page, 500, 300); // Score card
      await sleep(400);
      await zoomIn(page, 1.5, 500, 300); // Zoom into score
      await sleep(800);
      await zoomOut(page);
      await sleep(300);

      await moveCursor(page, 900, 300); // Another score
      await sleep(400);
      await moveCursor(page, 700, 550); // Standings
      await sleep(400);
      await zoomIn(page, 1.3, 700, 550); // Zoom into standings
      await sleep(600);
      await zoomOut(page);
      await sleep(300);
    },
  },
  {
    name: 'Notes',
    path: '/notes',
    duration: 3500,
    waitFor: '[class*="editor"], [class*="Editor"], [class*="note"], main',
    actions: async (page) => {
      await moveCursor(page, 250, 300); // Sidebar/folder area
      await sleep(400);
      await zoomIn(page, 1.4, 250, 300); // Zoom into sidebar
      await sleep(800);
      await zoomOut(page);
      await sleep(300);

      await moveCursor(page, 700, 400); // Editor area
      await sleep(400);
      await zoomIn(page, 1.3, 700, 400); // Zoom into editor
      await sleep(800);
      await zoomOut(page);
      await sleep(300);

      await moveCursor(page, 900, 350);
      await sleep(400);
      await smoothScroll(page, 150);
      await sleep(400);
    },
  },
];

async function injectCursor(page: Page) {
  await page.evaluate((styles, svg) => {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Add cursor element
    const cursor = document.createElement('div');
    cursor.id = 'fake-cursor';
    cursor.innerHTML = svg;
    cursor.style.left = '-50px';
    cursor.style.top = '-50px';
    document.body.appendChild(cursor);
  }, CURSOR_STYLES, CURSOR_SVG);
}

async function moveCursor(page: Page, x: number, y: number) {
  await page.evaluate((x, y) => {
    const cursor = document.getElementById('fake-cursor');
    if (cursor) {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    }
  }, x, y);
  await sleep(100); // Small delay for transition to start
}

async function _simulateClick(page: Page) {
  await page.evaluate(() => {
    const cursor = document.getElementById('fake-cursor');
    if (cursor) {
      cursor.style.transform = 'scale(0.9)';
      setTimeout(() => {
        cursor.style.transform = 'scale(1)';
      }, 100);
    }
  });
  await sleep(150);
}

async function smoothScroll(page: Page, amount: number) {
  await page.evaluate((scrollAmount) => {
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  }, amount);
  await sleep(500);
}

async function zoomIn(page: Page, scale: number, originX: number, originY: number) {
  await page.evaluate((s, ox, oy) => {
    document.documentElement.style.transformOrigin = `${ox}px ${oy}px`;
    document.documentElement.style.transform = `scale(${s})`;
  }, scale, originX, originY);
  await sleep(800); // Wait for zoom animation
}

async function zoomOut(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.transform = 'scale(1)';
  });
  await sleep(800); // Wait for zoom animation
}

async function _zoomToElement(page: Page, selector: string, scale: number = 1.5) {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      await zoomIn(page, scale, centerX, centerY);
    }
  }
}

async function login(browser: Browser): Promise<string> {
  console.log('\nAuthenticating...');

  if (!DASHBOARD_PASSWORD) {
    console.log('  No DASHBOARD_PASSWORD set, skipping authentication');
    return '';
  }

  const page = await browser.newPage();

  try {
    // Navigate to login page first
    await page.goto(`${WEBSITE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });

    const response = await page.evaluate(async (url, password) => {
      const res = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return res.json();
    }, WEBSITE_URL, DASHBOARD_PASSWORD);

    if (response.token) {
      console.log('  Authentication successful!');
      await page.close();
      return response.token;
    } else {
      console.error('  Authentication failed:', response.error);
      await page.close();
      return '';
    }
  } catch (error) {
    console.error('  Authentication error:', error);
    await page.close();
    return '';
  }
}

async function recordWalkthrough() {
  console.log('='.repeat(60));
  console.log('Website Walkthrough Video Recording');
  console.log('='.repeat(60));
  console.log(`Website URL: ${WEBSITE_URL}`);
  console.log(`Output: ${OUTPUT_FILE}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false, // Need headed mode for screencast
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${VIEWPORT_WIDTH},${VIEWPORT_HEIGHT}`,
      '--start-maximized',
    ],
  });

  try {
    const sessionToken = await login(browser);
    const page = await browser.newPage();
    await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

    // Set session cookie
    if (sessionToken) {
      await page.setCookie({
        name: 'dashboard_session_token',
        value: sessionToken,
        domain: new URL(WEBSITE_URL).hostname,
        path: '/',
      });
    }

    // Start recording using CDP screencast
    const client = await page.createCDPSession();

    // Use Page.screencastFrame for recording
    const frames: Buffer[] = [];
    let frameCount = 0;

    client.on('Page.screencastFrame', async (event) => {
      const buffer = Buffer.from(event.data, 'base64');
      frames.push(buffer);
      frameCount++;
      await client.send('Page.screencastFrameAck', { sessionId: event.sessionId });
    });

    console.log('\nStarting walkthrough...\n');

    // Execute walkthrough - pause recording during navigation
    let isRecording = false;

    for (const step of walkthroughSteps) {
      console.log(`Loading: ${step.name}...`);

      // Pause recording during navigation
      if (isRecording) {
        await client.send('Page.stopScreencast');
        isRecording = false;
      }

      // Navigate and wait for page to fully load
      await page.goto(`${WEBSITE_URL}${step.path}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Wait for page to be fully ready (no loading states)
      console.log(`  Waiting for content to load...`);
      await waitForPageReady(page, step.waitFor);

      // Inject cursor and prepare
      await injectCursor(page);

      // Resume recording AFTER page is ready
      if (!isRecording) {
        await client.send('Page.startScreencast', {
          format: 'jpeg',
          quality: 90,
          maxWidth: VIEWPORT_WIDTH,
          maxHeight: VIEWPORT_HEIGHT,
          everyNthFrame: 1,
        });
        isRecording = true;
      }

      console.log(`  Recording: ${step.name}...`);

      // Move cursor into view smoothly
      await moveCursor(page, 100, 100);
      await sleep(300);

      // Execute step actions
      await step.actions(page);
    }

    // Stop recording
    await client.send('Page.stopScreencast');
    console.log(`\nRecording stopped. Captured ${frameCount} frames.`);

    // Save frames and convert to video using ffmpeg
    const framesDir = path.join(OUTPUT_DIR, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    console.log('Saving frames...');
    for (let i = 0; i < frames.length; i++) {
      const framePath = path.join(framesDir, `frame-${String(i).padStart(5, '0')}.jpg`);
      fs.writeFileSync(framePath, frames[i]);
    }

    console.log('Converting to video with ffmpeg...');

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y',
        '-framerate', '30',
        '-i', path.join(framesDir, 'frame-%05d.jpg'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '23',
        path.join(OUTPUT_DIR, 'walkthrough.mp4'),
      ]);

      ffmpeg.stderr.on('data', (_data) => {
        // ffmpeg outputs to stderr
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });

    // Cleanup frames
    fs.rmSync(framesDir, { recursive: true });

    console.log('\n' + '='.repeat(60));
    console.log('Recording Complete!');
    console.log('='.repeat(60));
    console.log(`\nVideo saved to: ${path.join(OUTPUT_DIR, 'walkthrough.mp4')}`);

  } finally {
    await browser.close();
  }
}

recordWalkthrough().catch((error) => {
  console.error('Error recording walkthrough:', error);
  process.exit(1);
});
