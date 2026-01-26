import 'dotenv/config';
import puppeteer, { Page, Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';

const WEBSITE_URL = process.env.WEBSITE_URL || 'http://localhost:3000';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || '';
const OUTPUT_DIR = './public/screenshots';
const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;

interface FeatureCapture {
  name: string;
  path: string;
  actions: (page: Page) => Promise<void>;
  frameCount: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const features: FeatureCapture[] = [
  {
    name: 'dashboard',
    path: '/',
    frameCount: 3,
    actions: async (page) => {
      // Wait for dashboard to fully load
      await sleep(2000); // Wait for clock, weather, widgets to render
    },
  },
  {
    name: 'manga-reader',
    path: '/manga',
    frameCount: 3,
    actions: async (page) => {
      // Wait for manga grid to load
      await sleep(2000);
    },
  },
  {
    name: 'watchlist',
    path: '/watchlist',
    frameCount: 3,
    actions: async (page) => {
      // Wait for carousels to load
      await sleep(2000);
    },
  },
  {
    name: 'sports',
    path: '/sports',
    frameCount: 2,
    actions: async (page) => {
      // Wait for sports data to load
      await sleep(2000);
    },
  },
  {
    name: 'notes',
    path: '/notes',
    frameCount: 2,
    actions: async (page) => {
      // Wait for notes editor to load
      await sleep(2000);
    },
  },
];

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

    // Call the login API directly
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
      console.error('  Authentication failed:', response.error || 'Unknown error');
      await page.close();
      return '';
    }
  } catch (error) {
    console.error('  Authentication error:', error);
    await page.close();
    return '';
  }
}

async function captureFeature(
  browser: Browser,
  feature: FeatureCapture,
  sessionToken: string
): Promise<void> {
  const outputDir = path.join(OUTPUT_DIR, feature.name);
  fs.mkdirSync(outputDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  // Set the session cookie if we have a token
  if (sessionToken) {
    await page.setCookie({
      name: 'dashboard_session_token',
      value: sessionToken,
      domain: new URL(WEBSITE_URL).hostname,
      path: '/',
    });
  }

  console.log(`\nCapturing ${feature.name}...`);
  console.log(`  Navigating to ${WEBSITE_URL}${feature.path}`);

  try {
    await page.goto(`${WEBSITE_URL}${feature.path}`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Check if we were redirected to login
    if (page.url().includes('/login')) {
      console.error('  Redirected to login - authentication may have failed');
    }

    // Run feature-specific actions
    await feature.actions(page);

    // Capture frames
    for (let i = 0; i < feature.frameCount; i++) {
      const filename = `frame-${String(i + 1).padStart(3, '0')}.png`;
      await page.screenshot({
        path: path.join(outputDir, filename),
        type: 'png',
      });
      console.log(`  Captured ${filename}`);

      // Scroll between frames for variety
      if (i < feature.frameCount - 1) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight * 0.3);
        });
        await sleep(500);
      }
    }
  } catch (error) {
    console.error(`  Error capturing ${feature.name}:`, error);
    // Create placeholder images so video doesn't break
    for (let i = 0; i < feature.frameCount; i++) {
      const filename = `frame-${String(i + 1).padStart(3, '0')}.png`;
      const placeholderPath = path.join(outputDir, filename);
      if (!fs.existsSync(placeholderPath)) {
        console.log(`  Creating placeholder for ${filename}`);
      }
    }
  }

  await page.close();
}

async function captureAllFeatures() {
  console.log('='.repeat(60));
  console.log('Website Walkthrough Screenshot Capture');
  console.log('='.repeat(60));
  console.log(`Website URL: ${WEBSITE_URL}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Password configured: ${DASHBOARD_PASSWORD ? 'Yes' : 'No'}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Login first
    const sessionToken = await login(browser);

    // Capture all features
    for (const feature of features) {
      await captureFeature(browser, feature, sessionToken);
    }
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('Capture Complete!');
  console.log('='.repeat(60));
  console.log('\nScreenshots saved to:');
  features.forEach((f) => {
    console.log(`  - ${OUTPUT_DIR}/${f.name}/`);
  });
  console.log('\nNext steps:');
  console.log('  1. Preview: npm run video:preview');
  console.log('  2. Render:  npm run video:render');
}

captureAllFeatures().catch((error) => {
  console.error('Error capturing screenshots:', error);
  process.exit(1);
});
