import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(REPO_ROOT, 'docs', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';

async function runE2E() {
  console.log(`=== Starting Clinical Paper Playwright E2E Test ===`);
  console.log(`Target URL: ${BASE_URL}`);

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
    });
  } catch (e1) {
    try {
      browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
      });
    } catch (e2) {
      console.error('Failed launching system Edge or Chrome:', e2);
      process.exit(1);
    }
  }

  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '375', width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    console.log(`\n--- Running flow on viewport: ${vp.width}x${vp.height} ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore favicon or benign WebGL driver warnings if any
        if (!text.includes('favicon') && !text.includes('THREE.WebGLRenderer: A WebGL context')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    // 1. Welcome Page
    console.log('1. Navigating to /welcome...');
    await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `welcome_${vp.name}.png`), fullPage: true });

    // Tick checkbox
    const checkbox = page.locator('#welcome-acknowledgement');
    await checkbox.check();
    await page.waitForTimeout(100);

    // Click Start
    const startBtn = page.locator('#start-wizard-button');
    await startBtn.click();
    await page.waitForURL('**/enter-data');
    console.log('2. Successfully navigated to /enter-data');

    // 2. Data Entry Page
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `enter_data_${vp.name}.png`), fullPage: true });

    // Load sample patient
    console.log('Loading sample patient (High risk LAD)...');
    const select = page.locator('select').first();
    await select.selectOption('high_risk_lad');
    await page.waitForTimeout(400);

    // Click Predict
    const predictBtn = page.locator('#predict-button');
    await predictBtn.click();
    await page.waitForURL('**/results', { timeout: 15000 });
    console.log('3. Successfully navigated to /results');

    // 3. Results Page
    await page.waitForTimeout(1000); // Wait for WebGL canvas and predictions to render

    // Assertions for Task 5.1
    const textContent = await page.content();
    if (!textContent.includes('Coronary artery disease')) {
      throw new Error('Results page missing "Coronary artery disease" heading');
    }
    if (!textContent.includes('Left anterior descending artery')) {
      throw new Error('Results page missing vessel row: LAD');
    }
    if (!textContent.includes('Left circumflex artery')) {
      throw new Error('Results page missing vessel row: LCX');
    }
    if (!textContent.includes('Right coronary artery')) {
      throw new Error('Results page missing vessel row: RCA');
    }
    // Canvas check
    const canvas = page.locator('canvas');
    if ((await canvas.count()) === 0) {
      throw new Error('WebGL Canvas element not found on Results page');
    }

    // Check no model metrics visible on results page (Task 2.1)
    const metricsForbidden = ['ROC-AUC', 'PR-AUC', 'TreeSHAP', 'calibrated baseline', 'Model Metrics'];
    for (const token of metricsForbidden) {
      if (textContent.includes(token)) {
        throw new Error(`Forbidden metric/jargon token found on Results screen: "${token}"`);
      }
    }
    console.log('Results page verified: CAD value, 3 vessel rows, canvas present, zero model metrics visible.');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `results_${vp.name}.png`), fullPage: true });

    // 4. Reports Page
    const createReportsBtn = page.locator('#create-reports-button');
    await createReportsBtn.click();
    await page.waitForURL('**/reports', { timeout: 15000 });
    console.log('4. Successfully navigated to /reports');

    await page.waitForTimeout(1500); // Wait for report generation
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `reports_technical_${vp.name}.png`), fullPage: true });

    // Check report content and status line
    const reportsText = await page.content();
    if (!reportsText.includes('Model output summary') && !reportsText.includes('Technical Report')) {
      throw new Error('Technical report document sheet failed to render');
    }

    // Switch to Patient report
    const patientTab = page.getByRole('button', { name: 'Patient report' });
    await patientTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `reports_patient_${vp.name}.png`), fullPage: true });

    const patientText = await page.content();
    if (!patientText.toLowerCase().includes('your three main heart arteries')) {
      throw new Error('Patient report document sheet failed to render');
    }
    console.log('Reports page verified: both Clinician and Patient report tabs render properly.');

    // 5. Model Info Page
    console.log('5. Navigating to /model-info...');
    await page.goto(`${BASE_URL}/model-info`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const modelInfoText = await page.content();
    if (!modelInfoText.includes('Validation performance metrics') || !modelInfoText.includes('ROC-AUC')) {
      throw new Error('Model information page failed to render metrics table');
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `model_info_${vp.name}.png`), fullPage: true });
    console.log('/model-info page verified.');

    // 6. Design System Page
    console.log('6. Navigating to /design-system...');
    await page.goto(`${BASE_URL}/design-system`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `design_system_${vp.name}.png`), fullPage: true });
    console.log('/design-system page verified.');

    if (consoleErrors.length > 0) {
      console.error(`\n❌ Console Errors on viewport ${vp.name}:`);
      for (const err of consoleErrors) {
        console.error(`  - ${err}`);
      }
      throw new Error(`Console errors detected on viewport ${vp.name}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n[PASS] All E2E flows and screenshots captured successfully with zero console errors.');
}

runE2E().catch((err) => {
  console.error('[FAIL] E2E Execution Failed:', err);
  process.exit(1);
});
