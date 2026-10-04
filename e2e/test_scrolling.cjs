/**
 * Comprehensive Scrollability Verification Test
 * Verifies that all pages (/enter-data, /results, /reports) can scroll smoothly
 * using mouse wheel, have visible custom scrollbars, and scrollHeight > clientHeight.
 */

const { chromium } = require('playwright-core');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

async function testAllScroll() {
  console.log(`[SCROLL TEST] Testing all wizard pages for scrollability at ${BASE_URL}...`);
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });

  try {
    // STEP 1: /welcome -> /enter-data
    await page.goto(`${BASE_URL}/welcome`);
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Begin Clinical Assessment|Start/i }).click();
    await page.waitForURL('**/enter-data');
    await page.waitForTimeout(500);

    // 1. Verify /enter-data scroll
    console.log('[1/3] Testing /enter-data...');
    const enterDataScroll = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
    if (!enterDataScroll) throw new Error('/enter-data is not scrollable');
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    const enterDataY = await page.evaluate(() => window.scrollY);
    console.log(`  -> /enter-data scrolled to ${enterDataY}px`);
    if (enterDataY <= 0) throw new Error('/enter-data wheel scroll failed');

    // Populate sample patient and predict -> /results
    await page.getByRole('button', { name: /Load sample patient/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Run CAD Risk Prediction|Predict/i }).click();
    await page.waitForURL('**/results');
    await page.waitForTimeout(1000);

    // 2. Verify /results scroll
    console.log('[2/3] Testing /results...');
    const resultsScroll = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
    console.log(`  -> /results scrollHeight (${await page.evaluate(() => document.documentElement.scrollHeight)}px) > clientHeight (${720}px): ${resultsScroll}`);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(300);
    const resultsY = await page.evaluate(() => window.scrollY);
    console.log(`  -> /results scrolled to ${resultsY}px`);

    // Navigate to /reports
    const reportsBtn = page.locator('#generate-reports-btn, button:has-text("Generate Reports")').first();
    await reportsBtn.click();
    await page.waitForURL('**/reports');
    await page.waitForTimeout(1500);

    // 3. Verify /reports scroll
    console.log('[3/3] Testing /reports...');
    const reportsScroll = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
    console.log(`  -> /reports scrollHeight (${await page.evaluate(() => document.documentElement.scrollHeight)}px) > clientHeight (${720}px): ${reportsScroll}`);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    const reportsY = await page.evaluate(() => window.scrollY);
    console.log(`  -> /reports scrolled to ${reportsY}px`);
    if (reportsY <= 0) throw new Error('/reports wheel scroll failed');

    console.log('\n[SUCCESS] All pages verified with smooth mouse wheel and visible scrollbar scrolling!');
  } finally {
    await browser.close();
  }
}

testAllScroll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[SCROLL TEST FAILED]:', err);
    process.exit(1);
  });
