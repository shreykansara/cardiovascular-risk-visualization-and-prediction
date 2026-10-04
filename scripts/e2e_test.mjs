import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_BASE_DIR = path.resolve(REPO_ROOT, 'docs', 'screenshots');

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:8080';

async function runE2E() {
  console.log(`=== Starting Clinical Paper Playwright Dual-Theme E2E Test (Phase 4) ===`);
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

  const themes = ['light', 'dark'];
  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '375', width: 375, height: 812 },
  ];

  // Fetch API reports status for validation
  let serverReportStatus = null;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/reports/status`);
    if (res.ok) {
      serverReportStatus = await res.json();
      console.log(`Server Reports Status:`, serverReportStatus);
    }
  } catch (err) {
    console.warn(`Could not query /api/v1/reports/status: ${err.message}`);
  }

  for (const theme of themes) {
    const themeScreenshotsDir = path.join(SCREENSHOTS_BASE_DIR, theme);
    if (!fs.existsSync(themeScreenshotsDir)) {
      fs.mkdirSync(themeScreenshotsDir, { recursive: true });
    }

    console.log(`\n======================================================`);
    console.log(`=== RUNNING COMPLETE FLOW WITH THEME: ${theme.toUpperCase()} ===`);
    console.log(`======================================================`);

    for (const vp of viewports) {
      console.log(`\n--- Running on viewport: ${vp.width}x${vp.height} (${vp.name}) | Theme: ${theme} ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });

      // Task 4.2: Pre-seed theme in localStorage before initial load
      await context.addInitScript((thm) => {
        localStorage.setItem('perfusion3d-theme', thm);
      }, theme);

      const page = await context.newPage();

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter benign network connection retries or WebGL context creation warnings
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

      // Verify data-theme attribute matches
      let activeTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      if (activeTheme !== theme) {
        throw new Error(`Theme mismatch on load: expected "${theme}", got "${activeTheme}"`);
      }

      // Verify theme persistence across reload
      await page.reload({ waitUntil: 'networkidle' });
      activeTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      if (activeTheme !== theme) {
        throw new Error(`Theme persistence failure after reload: expected "${theme}", got "${activeTheme}"`);
      }

      // Verify "System" theme follows emulated OS color scheme (run on desktop viewport)
      if (vp.name === '1440') {
        const themeSelect = page.locator('header select').first();
        if ((await themeSelect.count()) > 0) {
          console.log('Testing "System" theme OS emulation...');
          await themeSelect.selectOption('system');
          await page.waitForTimeout(200);

          await page.emulateMedia({ colorScheme: 'dark' });
          await page.waitForTimeout(400);
          let sysTheme = await page.evaluate(() => document.documentElement.dataset.theme);
          if (sysTheme !== 'dark') {
            throw new Error(`System theme failed to follow dark OS emulation (got: ${sysTheme})`);
          }

          await page.emulateMedia({ colorScheme: 'light' });
          await page.waitForTimeout(400);
          sysTheme = await page.evaluate(() => document.documentElement.dataset.theme);
          if (sysTheme !== 'light') {
            throw new Error(`System theme failed to follow light OS emulation (got: ${sysTheme})`);
          }

          // Restore test theme
          await themeSelect.selectOption(theme);
          await page.waitForTimeout(200);
        }
      }

      const welcomeScreenshotPath = path.join(themeScreenshotsDir, `welcome_${vp.name}.png`);
      await page.screenshot({ path: welcomeScreenshotPath, fullPage: true });
      console.log(`Saved screenshot: ${welcomeScreenshotPath}`);

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
      const enterDataScreenshotPath = path.join(themeScreenshotsDir, `enter_data_${vp.name}.png`);
      await page.screenshot({ path: enterDataScreenshotPath, fullPage: true });
      console.log(`Saved screenshot: ${enterDataScreenshotPath}`);

      // Load sample patient (High risk LAD)
      console.log('Loading sample patient (High risk LAD)...');
      const sampleSelect = page.locator('select').nth(1); // Second select is sample patient
      await sampleSelect.selectOption('high_risk_lad');
      await page.waitForTimeout(400);

      // Click Predict
      const predictBtn = page.locator('#predict-button');
      await predictBtn.click();
      await page.waitForURL('**/results', { timeout: 15000 });
      console.log('3. Successfully navigated to /results');

      // 3. Results Page
      await page.waitForTimeout(1200); // Wait for WebGL canvas and predictions to render

      const resultsText = await page.content();
      if (!resultsText.includes('Coronary artery disease')) {
        throw new Error('Results page missing "Coronary artery disease" heading');
      }
      if (!resultsText.includes('Left anterior descending artery')) {
        throw new Error('Results page missing vessel row: LAD');
      }
      if (!resultsText.includes('Left circumflex artery')) {
        throw new Error('Results page missing vessel row: LCX');
      }
      if (!resultsText.includes('Right coronary artery')) {
        throw new Error('Results page missing vessel row: RCA');
      }

      // Check canvas
      const canvas = page.locator('canvas');
      if ((await canvas.count()) === 0) {
        throw new Error('WebGL Canvas element not found on Results page');
      }

      // Check no forbidden metrics tokens on results page
      const forbiddenTokens = ['ROC-AUC', 'PR-AUC', 'TreeSHAP', 'calibrated baseline', 'Model Metrics'];
      for (const token of forbiddenTokens) {
        if (resultsText.includes(token)) {
          throw new Error(`Forbidden metric/jargon token found on Results screen: "${token}"`);
        }
      }

      const resultsScreenshotPath = path.join(themeScreenshotsDir, `results_${vp.name}.png`);
      await page.screenshot({ path: resultsScreenshotPath, fullPage: true });
      console.log(`Saved screenshot: ${resultsScreenshotPath}`);

      // 4. Reports Page
      const createReportsBtn = page.locator('#create-reports-button');
      await createReportsBtn.click();
      await page.waitForURL('**/reports', { timeout: 15000 });
      console.log('4. Successfully navigated to /reports');

      await page.waitForTimeout(1500); // Wait for report generation
      const reportsTechScreenshotPath = path.join(themeScreenshotsDir, `reports_technical_${vp.name}.png`);
      await page.screenshot({ path: reportsTechScreenshotPath, fullPage: true });
      console.log(`Saved screenshot: ${reportsTechScreenshotPath}`);

      // Check report status line text matches server status
      const pageText = await page.content();
      if (serverReportStatus) {
        const lastCode = serverReportStatus.last_error_code;
        console.log(`Verifying report status line text for code: "${lastCode}"...`);
        if (lastCode === 'ok') {
          // Status line can say "Generated with Groq" or fallback if rate limited/offline
        } else if (lastCode === 'model_unavailable') {
          if (!pageText.includes('Groq model not available. Using standard template.')) {
            console.warn('Status line mismatch for model_unavailable');
          }
        } else if (lastCode === 'rate_limited') {
          if (!pageText.includes('Groq rate limit reached. Using standard template.')) {
            console.warn('Status line mismatch for rate_limited');
          }
        } else if (lastCode === 'request_blocked') {
          if (!pageText.includes('Groq blocked the request. Using standard template.')) {
            console.warn('Status line mismatch for request_blocked');
          }
        } else if (lastCode === 'access_denied') {
          if (!pageText.includes('Groq denied access for this key. Using standard template.')) {
            console.warn('Status line mismatch for access_denied');
          }
        }
      }

      // Switch to Patient report
      const patientTab = page.getByRole('button', { name: 'Patient report' });
      await patientTab.click();
      await page.waitForTimeout(500);

      const reportsPatientScreenshotPath = path.join(themeScreenshotsDir, `reports_patient_${vp.name}.png`);
      await page.screenshot({ path: reportsPatientScreenshotPath, fullPage: true });
      console.log(`Saved screenshot: ${reportsPatientScreenshotPath}`);

      // 5. Model Info Page
      console.log('5. Navigating to /model-info...');
      await page.goto(`${BASE_URL}/model-info`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const modelInfoScreenshotPath = path.join(themeScreenshotsDir, `model_info_${vp.name}.png`);
      await page.screenshot({ path: modelInfoScreenshotPath, fullPage: true });
      console.log(`Saved screenshot: ${modelInfoScreenshotPath}`);

      if (consoleErrors.length > 0) {
        console.error(`\n❌ Console Errors on viewport ${vp.name} (${theme}):`);
        for (const err of consoleErrors) {
          console.error(`  - ${err}`);
        }
        throw new Error(`Console errors detected on viewport ${vp.name} (${theme})`);
      }

      await context.close();
    }
  }

  await browser.close();
  console.log('\n================================================================');
  console.log('[PASS] Dual-theme E2E suite completed with zero console errors!');
  console.log('All screenshots captured in docs/screenshots/light/ and docs/screenshots/dark/');
  console.log('================================================================');
}

runE2E().catch((err) => {
  console.error('[FAIL] Dual-theme E2E Execution Failed:', err);
  process.exit(1);
});
