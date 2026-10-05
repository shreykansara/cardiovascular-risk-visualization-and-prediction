/**
 * End-to-End Flow & Screenshot Capture Suite (Phases 7.3 & 7.5)
 * 
 * Verifies full end-to-end workflow:
 * 1. Welcome (tick, Start)
 * 2. Clinical data (load sample, click sidebar item & assert scroll, break field,
 *    assert error text & Predict does not navigate, fix field)
 * 3. Predict (overlay appears and disappears)
 * 4. Results (select LAD)
 * 5. Create reports (assert URL changes after >=250ms and <=600ms; sheet has no clip-path after 1.2s)
 * 6. Both tabs (clinician & patient)
 * 7. Model information
 * 8. Runs in Paper ('light') and Monitor ('dark'), plus reducedMotion: 'reduce' (delay must be 0)
 * 9. Captures all required Task 7.5 screenshots at 1440px, 768px, 375px in both themes
 * 10. Fails on any uncaught console error
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SHOT_DIR_PAPER = path.resolve(__dirname, '..', 'docs', 'screenshots', 'round2', 'paper');
const SHOT_DIR_MONITOR = path.resolve(__dirname, '..', 'docs', 'screenshots', 'round2', 'monitor');

fs.mkdirSync(SHOT_DIR_PAPER, { recursive: true });
fs.mkdirSync(SHOT_DIR_MONITOR, { recursive: true });

async function getBrowser() {
  try {
    return await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.log('[E2E] Chrome launch failed, trying Edge...');
    return await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

async function captureMultiRes(page, targetDir, namePrefix) {
  const resolutions = [
    { width: 1440, height: 900, suffix: '1440' },
    { width: 768, height: 1024, suffix: '768' },
    { width: 375, height: 812, suffix: '375' },
  ];

  for (const res of resolutions) {
    await page.setViewportSize({ width: res.width, height: res.height });
    await page.waitForTimeout(200);
    const shotPath = path.join(targetDir, `${namePrefix}_${res.suffix}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
  }

  // Restore 1440
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(150);
}

async function runThemeFlow(browser, themeKey, themeName, screenshotDir) {
  console.log(`\n======================================================`);
  console.log(`>>> RUNNING FULL FLOW: ${themeName} (${themeKey})`);
  console.log(`======================================================`);

  const consoleErrors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript((th) => {
    localStorage.setItem('perfusion3d-theme', th);
  }, themeKey);

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('status of 404') && !text.includes('status of 422') && !text.includes('net::ERR_FAILED')) {
        console.error(`  [CONSOLE ERROR]: ${text}`);
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.error(`  [PAGE ERROR]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  // ----------------------------------------------------
  // STEP 1: /welcome (Fresh)
  // ----------------------------------------------------
  console.log(`[${themeName}] 1. Welcome fresh...`);
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(600);

  // Capture Task 7.5 Screenshot: Welcome (fresh)
  await captureMultiRes(page, screenshotDir, 'welcome_fresh');
  console.log(`  -> Screenshots saved: welcome_fresh (1440, 768, 375)`);

  // Tick checkbox and start assessment
  const understandCb = page.locator('#welcome-understand-checkbox');
  await understandCb.check();
  await page.locator('#start-assessment-btn').click();
  await page.waitForURL('**/enter-data', { timeout: 15000 });

  // ----------------------------------------------------
  // STEP 2: /enter-data
  // ----------------------------------------------------
  console.log(`[${themeName}] 2. Clinical data interactions...`);
  await page.waitForTimeout(500);

  // 2a. Enter a value (e.g. Age = 55) and navigate back to welcome to test in-progress block
  const fieldAge = page.locator('#field-Age');
  await fieldAge.fill('55');
  await page.waitForTimeout(200);

  // Return to welcome to test in-progress card and capture screenshot
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const inProgressText = await page.textContent('body');
  if (!inProgressText.includes('assessment is in progress')) {
    throw new Error('In-progress assessment block not found on /welcome');
  }
  await captureMultiRes(page, screenshotDir, 'welcome_in_progress');
  console.log(`  -> Screenshots saved: welcome_in_progress (1440, 768, 375)`);

  // Click "Continue" to return to /enter-data
  const continueBtn = page.getByRole('button', { name: /^Continue$/i });
  await continueBtn.click();
  await page.waitForURL('**/enter-data', { timeout: 10000 });
  await page.waitForTimeout(500);

  // 2b. Load sample patient
  const sampleSelect = page.locator('#sample-patient-select');
  await sampleSelect.selectOption({ index: 1 });
  await page.waitForTimeout(500);

  // 2c. Click a sidebar item and assert scroll
  const initialScroll = await page.evaluate(() => window.scrollY);
  const labSidebarBtn = page.locator('.sidebar-desktop button', { hasText: 'Laboratory' });
  await labSidebarBtn.click();
  await page.waitForTimeout(400);
  const scrolledY = await page.evaluate(() => window.scrollY);
  if (scrolledY <= initialScroll) {
    throw new Error(`Sidebar click did not trigger page scroll (before: ${initialScroll}, after: ${scrolledY})`);
  }
  console.log(`  -> Sidebar smooth scroll verified (scrollY: ${initialScroll} -> ${scrolledY})`);

  // 2d. Create clinical data states:
  // - Focus one field (Pulse rate PR)
  // - Out of range field (Age = 80, typical 18-75)
  // - In error field (BP = 300, beyond hard limit 260)
  const prInput = page.locator('#field-PR');
  await prInput.focus();

  await fieldAge.fill('80');
  await fieldAge.blur();

  const bpInput = page.locator('#field-BP');
  await bpInput.fill('300');
  await bpInput.blur();
  await page.waitForTimeout(300);

  // Verify error text appears
  const bpErrorText = await page.evaluate(() => {
    const input = document.getElementById('field-BP');
    const container = input ? input.closest('.flex-col') : null;
    return container ? container.textContent : '';
  });
  if (!bpErrorText.includes('between')) {
    throw new Error(`Hard limits error text not rendered for BP 300: "${bpErrorText}"`);
  }
  console.log(`  -> Error validation text confirmed: "${bpErrorText}"`);

  // Assert Predict does NOT navigate when an error exists
  const predictBtn = page.locator('#predict-button');
  await predictBtn.click();
  await page.waitForTimeout(400);
  const currentPath = await page.evaluate(() => window.location.pathname);
  if (!currentPath.includes('/enter-data')) {
    throw new Error(`Predict navigated away while form has errors! Path: ${currentPath}`);
  }
  console.log(`  -> Confirmed Predict does not navigate when invalid fields exist`);

  // Capture Task 7.5 Screenshot: Clinical data states (one focused, one out of range, one in error)
  await captureMultiRes(page, screenshotDir, 'clinical_data_states');
  console.log(`  -> Screenshots saved: clinical_data_states (1440, 768, 375)`);

  // Test confirm dialog: click "New assessment" in navbar
  const newAssessmentBtn = page.locator('.nav-new-assessment-btn');
  await newAssessmentBtn.click();
  await page.waitForTimeout(300);
  await captureMultiRes(page, screenshotDir, 'confirm_dialog');
  console.log(`  -> Screenshots saved: confirm_dialog (1440, 768, 375)`);

  // Cancel dialog
  const cancelDialogBtn = page.locator('dialog.nav-confirm-dialog button', { hasText: 'Cancel' });
  await cancelDialogBtn.click();
  await page.waitForTimeout(200);

  // Fix the invalid field (BP = 120, Age = 55)
  await bpInput.fill('120');
  await bpInput.blur();
  await fieldAge.fill('55');
  await fieldAge.blur();
  await page.waitForTimeout(300);

  // ----------------------------------------------------
  // STEP 3: Predict & Results
  // ----------------------------------------------------
  console.log(`[${themeName}] 3. Running Predict...`);
  await predictBtn.click();

  // Overlay appears and disappears
  await page.waitForSelector('.ecg-grid.fixed, .app-chrome.fixed, svg path[style*="draw"]', { timeout: 5000 });
  console.log(`  -> Predict overlay appeared`);

  await page.waitForFunction(() => window.location.pathname.includes('/results'), { timeout: 25000 });
  console.log(`  -> Predict overlay disappeared, navigated to /results`);

  // 4. Select LAD vessel row
  const ladCard = page.locator('.results-panel-2', { hasText: 'LAD' });
  await ladCard.click();
  await page.waitForTimeout(300);
  console.log(`  -> Selected LAD vessel`);

  // ----------------------------------------------------
  // STEP 4: Transition to Reports (Task 5.2 / 7.3)
  // ----------------------------------------------------
  console.log(`[${themeName}] 4. Testing Create reports transition timing...`);
  const createReportsBtn = page.locator('#create-reports-button');

  const t0 = Date.now();
  await createReportsBtn.click();

  await page.waitForFunction(() => window.location.pathname.includes('/reports'), { timeout: 10000 });
  const elapsed = Date.now() - t0;
  console.log(`  -> Reports navigation completed in ${elapsed}ms`);

  // Task 7.3 assertion: URL changes after >= 250ms and within 600ms (verifies 300ms transition delay)
  if (elapsed < 250 || elapsed > 600) {
    throw new Error(`Transition delay ${elapsed}ms outside required range [250ms, 600ms]`);
  }
  console.log(`  -> [PASS] Transition delay verified: ${elapsed}ms is in [250ms, 600ms]`);

  // Capture mid-transition screenshot at ≈400ms from click (Task 7.5)
  if (elapsed < 400) {
    await page.waitForTimeout(400 - elapsed);
  }
  await captureMultiRes(page, screenshotDir, 'transition_mid');
  console.log(`  -> Screenshots saved: transition_mid (1440, 768, 375)`);

  // Task 7.3: After 1.2s from enter, sheet has no leftover clip-path
  await page.waitForTimeout(1000);
  const sheetClipPath = await page.evaluate(() => {
    const wrapper = document.querySelector('.sheet-wrapper');
    const sheet = document.querySelector('#print-root .sheet');
    const wCp = wrapper ? window.getComputedStyle(wrapper).clipPath : 'none';
    const sCp = sheet ? window.getComputedStyle(sheet).clipPath : 'none';
    return { wrapper: wCp, sheet: sCp };
  });

  const isWrapperClean = sheetClipPath.wrapper === 'none' || sheetClipPath.wrapper === 'inset(0px)' || !sheetClipPath.wrapper;
  const isSheetClean = sheetClipPath.sheet === 'none' || sheetClipPath.sheet === 'inset(0px)' || !sheetClipPath.sheet;
  if (!isWrapperClean || !isSheetClean) {
    throw new Error(`Lingering clip-path detected on sheet after 1.2s: ${JSON.stringify(sheetClipPath)}`);
  }
  console.log(`  -> [PASS] Sheet clip-path confirmed clean after 1.2s: ${JSON.stringify(sheetClipPath)}`);

  // Wait for printable report sheet content to render
  await page.locator('#printable-report-sheet').waitFor({ state: 'visible', timeout: 25000 });

  // Capture Task 7.5 Screenshot: Reports
  await captureMultiRes(page, screenshotDir, 'reports');
  console.log(`  -> Screenshots saved: reports (1440, 768, 375)`);

  // ----------------------------------------------------
  // STEP 5: Both Tabs & Model Info
  // ----------------------------------------------------
  console.log(`[${themeName}] 5. Verifying tabs and model info...`);
  // Patient tab
  const patientTab = page.locator('button[role="tab"]', { hasText: 'Patient report' });
  await patientTab.click();
  await page.waitForTimeout(500);
  await page.locator('#printable-report-sheet').waitFor({ state: 'visible', timeout: 25000 });
  const patientText = await page.textContent('#printable-report-sheet');
  if (!patientText.includes('Heart Health') && !patientText.includes('arteries')) {
    throw new Error('Patient report failed to render expected text');
  }
  console.log(`  -> Patient report rendered successfully`);

  // Clinician tab
  const clinicianTab = page.locator('button[role="tab"]', { hasText: 'Clinician report' });
  await clinicianTab.click();
  await page.waitForTimeout(500);
  await page.locator('#printable-report-sheet').waitFor({ state: 'visible', timeout: 25000 });
  console.log(`  -> Clinician report re-rendered successfully`);

  // Model Information Link
  const modelInfoLink = page.getByRole('link', { name: /Model information/i });
  await modelInfoLink.click();
  await page.waitForURL('**/model-info', { timeout: 10000 });
  await page.waitForTimeout(500);

  const modelText = await page.textContent('body');
  if (!modelText.includes('ROC-AUC') && !modelText.includes('Validation performance')) {
    throw new Error('Model information page missing ROC-AUC performance metrics');
  }
  console.log(`  -> Model information page confirmed with validation metrics`);

  // Check console errors
  if (consoleErrors.length > 0) {
    throw new Error(`[FAIL] Uncaught browser console errors during ${themeName} flow:\n` + consoleErrors.join('\n'));
  }
  console.log(`  -> [PASS] Zero console errors during ${themeName} session`);

  await context.close();
}

async function runReducedMotionFlow(browser) {
  console.log(`\n======================================================`);
  console.log(`>>> TESTING REDUCED MOTION TRANSITION (prefers-reduced-motion: reduce)`);
  console.log(`======================================================`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });

  const page = await context.newPage();

  // Welcome -> Data Entry
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle' });
  await page.locator('#welcome-understand-checkbox').check();
  await page.locator('#start-assessment-btn').click();
  await page.waitForURL('**/enter-data', { timeout: 10000 });

  // Load sample patient and predict
  const sampleSelect = page.locator('#sample-patient-select');
  await sampleSelect.selectOption({ index: 1 });
  await page.waitForTimeout(300);

  await page.locator('#predict-button').click();
  await page.waitForFunction(() => window.location.pathname.includes('/results'), { timeout: 25000 });

  // Create reports under reduced motion: transition delay MUST be 0
  const createReportsBtn = page.locator('#create-reports-button');
  const t0 = Date.now();
  await createReportsBtn.click();
  await page.waitForFunction(() => window.location.pathname.includes('/reports'), { timeout: 10000 });
  const elapsed = Date.now() - t0;
  console.log(`  -> Reduced motion reports navigation elapsed: ${elapsed}ms`);

  // Under reduced motion, navigate is called immediately with no 300ms setTimeout
  if (elapsed >= 250) {
    throw new Error(`Reduced motion transition delay was ${elapsed}ms (expected 0ms delay, <250ms)`);
  }
  console.log(`  -> [PASS] Reduced motion navigation executed immediately (${elapsed}ms < 250ms)`);

  await context.close();
}

async function runAll() {
  console.log('=== Running ECG Paper E2E Flow & Screenshot Suite (Tasks 7.3 & 7.5) ===');
  console.log(`Target: ${BASE_URL}\n`);

  const browser = await getBrowser();
  try {
    // 1. Paper Theme Flow
    await runThemeFlow(browser, 'light', 'Paper', SHOT_DIR_PAPER);

    // 2. Monitor Theme Flow
    await runThemeFlow(browser, 'dark', 'Monitor', SHOT_DIR_MONITOR);

    // 3. Reduced Motion Flow
    await runReducedMotionFlow(browser);

    console.log(`\n======================================================`);
    console.log(`>>> ALL E2E FLOW & SCREENSHOT TESTS PASSED WITH 0 ERRORS!`);
    console.log(`======================================================`);
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL E2E FLOW ERROR]:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAll();
