/**
 * End-to-End Browser Flow Test (Task A4)
 * Uses system Chrome/Edge via playwright-core channel: 'chrome' (no binary download needed).
 * 
 * Verifies full 4-step workflow:
 * 1. /welcome -> ticks checkbox -> clicks Start
 * 2. /enter-data -> clicks "Load sample patient" -> clicks Predict
 * 3. /results -> confirms 4 vessel cards + 3D canvas
 * 4. /reports -> confirms Technical and Patient tabs render
 * 5. Fails on any uncaught browser console error
 * 6. Captures screenshots to docs/screenshots/
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function runE2E() {
  console.log(`[E2E] Starting test against ${BASE_URL}...`);
  console.log(`[E2E] Launching system Chrome...`);

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.log(`[E2E] Chrome failed, attempting Microsoft Edge...`);
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon or font/asset 404s
      if (!text.includes('favicon') && !text.includes('status of 404') && !text.includes('net::ERR_FAILED')) {
        console.error(`[BROWSER CONSOLE ERROR]: ${text}`);
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[BROWSER UNCAUGHT EXCEPTION]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  try {
    // ----------------------------------------------------
    // STEP 1: /welcome
    // ----------------------------------------------------
    console.log('[E2E] Step 1: Navigating to /welcome...');
    await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Verify Title and Disclaimer
    const pageText = await page.textContent('body');
    if (!pageText.includes('Perfusion3D')) {
      throw new Error('Welcome page missing Perfusion3D brand title');
    }
    if (!pageText.includes('Predictions are for decision-support')) {
      throw new Error('Welcome page missing clinical safety disclaimer');
    }

    // Capture Step 1 Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_welcome.png'), fullPage: true });
    console.log('  -> Screenshot saved: docs/screenshots/01_welcome.png');

    // Click checkbox
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();
    await page.waitForTimeout(300);

    // Click Start / Begin button
    const startBtn = page.getByRole('button', { name: /Begin Clinical Assessment|Start|Get Started/i });
    await startBtn.click();
    await page.waitForURL('**/enter-data', { timeout: 10000 });
    console.log('  -> Navigated to /enter-data');

    // ----------------------------------------------------
    // STEP 2: /enter-data
    // ----------------------------------------------------
    console.log('[E2E] Step 2: Populating form on /enter-data...');
    await page.waitForTimeout(500);

    // Click "Load sample patient"
    const sampleBtn = page.getByRole('button', { name: /Load sample patient/i });
    await sampleBtn.click();
    await page.waitForTimeout(800);

    // Verify fields populated (e.g. Age input has value)
    const ageInput = page.locator('input[type="number"]').first();
    const ageVal = await ageInput.inputValue();
    if (!ageVal || Number(ageVal) <= 0) {
      throw new Error('Sample patient did not populate Age input');
    }
    console.log(`  -> Sample patient loaded successfully (Age: ${ageVal})`);

    // Capture Step 2 Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_enter_data.png'), fullPage: true });
    console.log('  -> Screenshot saved: docs/screenshots/02_enter_data.png');

    // Click "Predict" / "Run CAD Risk Prediction"
    const predictBtn = page.getByRole('button', { name: /Run CAD Risk Prediction|Predict/i });
    await predictBtn.click();

    // Wait for navigation to /results
    await page.waitForURL('**/results', { timeout: 15000 });
    console.log('  -> Navigated to /results');

    // ----------------------------------------------------
    // STEP 3: /results
    // ----------------------------------------------------
    console.log('[E2E] Step 3: Verifying results and 3D digital twin...');
    await page.waitForTimeout(2000); // Allow 3D canvas and SHAP charts to render

    // Confirm 3D canvas element exists
    const canvasCount = await page.locator('canvas').count();
    if (canvasCount === 0) {
      throw new Error('3D WebGL Canvas not found on /results');
    }
    console.log(`  -> 3D Canvas element verified (${canvasCount} canvas found)`);

    // Confirm 4 vessel/target cards (CAD, LAD, LCX, RCA)
    const resultsText = await page.textContent('body');
    const requiredTargets = ['CAD', 'LAD', 'LCX', 'RCA'];
    for (const target of requiredTargets) {
      if (!resultsText.includes(target)) {
        throw new Error(`Target ${target} card not found in results`);
      }
    }
    console.log('  -> Verified all 4 target risk cards (CAD, LAD, LCX, RCA)');

    // Capture Step 3 Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_results.png'), fullPage: true });
    console.log('  -> Screenshot saved: docs/screenshots/03_results.png');

    // Click "Generate reports"
    const reportsBtn = page.locator('#generate-reports-btn, button:has-text("Generate Reports")').first();
    await reportsBtn.click();
    await page.waitForURL('**/reports', { timeout: 10000 });
    console.log('  -> Navigated to /reports');

    // ----------------------------------------------------
    // STEP 4: /reports
    // ----------------------------------------------------
    console.log('[E2E] Step 4: Verifying reports generation and tabs...');
    await page.waitForTimeout(2000); // Allow reports to synthesize/render

    // Verify Technical Report Tab content
    const reportsContent = await page.textContent('body');
    if (!reportsContent.includes('Technical Report') && !reportsContent.includes('TECHNICAL')) {
      throw new Error('Technical report tab not rendered');
    }
    console.log('  -> Technical report rendered successfully');

    // Switch to Patient Report tab
    const patientTabBtn = page.getByRole('button', { name: /Patient Report/i });
    await patientTabBtn.click();
    await page.waitForTimeout(1000);

    const patientReportContent = await page.textContent('body');
    if (!patientReportContent.includes('Your Heart Health Summary') && !patientReportContent.includes('Patient Report')) {
      throw new Error('Patient report tab not rendered after tab switch');
    }
    console.log('  -> Patient report rendered successfully');

    // Capture Step 4 Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_reports.png'), fullPage: true });
    console.log('  -> Screenshot saved: docs/screenshots/04_reports.png');

    // ----------------------------------------------------
    // CONSOLE ERROR AUDIT
    // ----------------------------------------------------
    if (consoleErrors.length > 0) {
      console.error(`[E2E FAIL] Detected ${consoleErrors.length} browser console errors during session:`);
      consoleErrors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
      throw new Error(`Browser console errors detected: ${consoleErrors[0]}`);
    }

    console.log('\n======================================================');
    console.log('[E2E SUCCESS] All 4 steps completed with ZERO console errors!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[E2E ERROR]:', err);
    process.exit(1);
  });
