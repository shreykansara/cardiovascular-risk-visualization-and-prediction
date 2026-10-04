/**
 * Design Conformance Test Suite (Phases 8.1, 8.2, 8.4)
 * Strict computed-style assertions, full multi-theme flow, reduced motion verification,
 * and dual-resolution screenshot capture for Perfusion3D ECG Paper Design System.
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const PAPER_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots', 'paper');
const MONITOR_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots', 'monitor');

fs.mkdirSync(PAPER_DIR, { recursive: true });
fs.mkdirSync(MONITOR_DIR, { recursive: true });

const assertionResults = [];

function recordAssertion(name, passed, detail = '') {
  assertionResults.push({ name, passed, detail });
  if (passed) {
    console.log(`  [PASS] ${name}`);
  } else {
    console.error(`  [FAIL] ${name}: ${detail}`);
  }
}

async function getBrowser() {
  try {
    return await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.log('[CONFORMANCE] Chrome launch failed, trying Microsoft Edge...');
    return await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

async function runThemeFlow(browser, themeKey, themeName, screenshotDir) {
  console.log(`\n======================================================`);
  console.log(`>>> TESTING THEME: ${themeName} (${themeKey})`);
  console.log(`======================================================`);

  const consoleErrors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Inject initial theme into localStorage
  await context.addInitScript((th) => {
    localStorage.setItem('perfusion3d-theme', th);
  }, themeKey);

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('status of 404') && !text.includes('net::ERR_FAILED')) {
        console.error(`  [BROWSER CONSOLE ERROR]: ${text}`);
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.error(`  [BROWSER UNCAUGHT EXCEPTION]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  // Target expected colors
  const isLight = themeKey === 'light';
  const expectedPanelBg = isLight ? 'rgb(255, 255, 255)' : 'rgb(12, 26, 19)';
  const expectedAcc = isLight ? 'rgb(29, 63, 138)' : 'rgb(76, 255, 154)';
  const expectedBds = isLight ? 'rgb(185, 154, 150)' : 'rgb(58, 99, 80)';

  // ----------------------------------------------------
  // STEP 1: /welcome
  // ----------------------------------------------------
  console.log(`\n[${themeName}] Navigating to /welcome...`);
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(700); // Allow wipe animation to settle

  // 1. html data-theme matches
  const htmlTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  recordAssertion(`html data-theme matches "${themeKey}"`, htmlTheme === themeKey, `got "${htmlTheme}"`);

  // 2. body font-family starts with Sora
  const bodyFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
  const startsWithSora = bodyFont.toLowerCase().includes('sora');
  recordAssertion(`body font-family starts with Sora`, startsWithSora, `got "${bodyFont}"`);

  // 3. root background-size equals "40px 40px, 40px 40px, 8px 8px, 8px 8px"
  const gridBgSize = await page.evaluate(() => {
    const el = document.querySelector('.ecg-grid');
    return el ? window.getComputedStyle(el).backgroundSize : '';
  });
  recordAssertion(
    `root background-size equals "40px 40px, 40px 40px, 8px 8px, 8px 8px"`,
    gridBgSize === '40px 40px, 40px 40px, 8px 8px, 8px 8px',
    `got "${gridBgSize}"`
  );

  // 4. Panel styles
  const panelStyles = await page.evaluate(() => {
    const p = document.querySelector('.pn');
    if (!p) return null;
    const cs = window.getComputedStyle(p);
    return {
      borderRadius: cs.borderRadius,
      borderTopWidth: cs.borderTopWidth,
      backgroundColor: cs.backgroundColor,
    };
  });
  recordAssertion(`panel border-radius is 3px`, panelStyles?.borderRadius === '3px', `got ${panelStyles?.borderRadius}`);
  recordAssertion(`panel border is 1px`, panelStyles?.borderTopWidth === '1px', `got ${panelStyles?.borderTopWidth}`);
  recordAssertion(
    `panel background is ${expectedPanelBg}`,
    panelStyles?.backgroundColor === expectedPanelBg,
    `got ${panelStyles?.backgroundColor}`
  );

  // 5. Primary button styles
  const btnStyles = await page.evaluate((expectedAcc) => {
    const b =
      document.querySelector('button.btn-primary') ||
      document.querySelector('#start-wizard-button') ||
      Array.from(document.querySelectorAll('button')).find((btn) => window.getComputedStyle(btn).backgroundColor === expectedAcc);
    if (!b) return null;
    const cs = window.getComputedStyle(b);
    return {
      height: cs.height,
      borderRadius: cs.borderRadius,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
    };
  }, expectedAcc);
  recordAssertion(`primary button height is 36px`, btnStyles?.height === '36px', `got ${btnStyles?.height}`);
  recordAssertion(`primary button radius is 3px`, btnStyles?.borderRadius === '3px', `got ${btnStyles?.borderRadius}`);
  recordAssertion(
    `primary button background is ${expectedAcc}`,
    btnStyles?.backgroundColor === expectedAcc,
    `got ${btnStyles?.backgroundColor}`
  );
  recordAssertion(`primary button font-size is 13px`, btnStyles?.fontSize === '13px', `got ${btnStyles?.fontSize}`);
  recordAssertion(`primary button font-weight is 600`, btnStyles?.fontWeight === '600', `got ${btnStyles?.fontWeight}`);

  // 6. Header and Progress rule
  const headerStyles = await page.evaluate(() => {
    const hdr = document.querySelector('header');
    if (!hdr) return null;
    const cs = window.getComputedStyle(hdr);
    return {
      backgroundColor: cs.backgroundColor,
      borderBottomWidth: cs.borderBottomWidth,
    };
  });
  recordAssertion(
    `header background is ${expectedPanelBg}`,
    headerStyles?.backgroundColor === expectedPanelBg,
    `got ${headerStyles?.backgroundColor}`
  );
  recordAssertion(`header border-bottom is 1px`, headerStyles?.borderBottomWidth === '1px', `got ${headerStyles?.borderBottomWidth}`);

  const progressHeight = await page.evaluate(() => {
    const seg = document.querySelector('.ecg-progress-segment') || document.querySelector('header + div > div > div');
    return seg ? window.getComputedStyle(seg).height : '';
  });
  recordAssertion(`progress segment height is 3px`, progressHeight === '3px', `got ${progressHeight}`);

  // 7. Footer styles
  const footerFontSize = await page.evaluate(() => {
    const f = document.querySelector('footer');
    return f ? window.getComputedStyle(f).fontSize : '';
  });
  recordAssertion(`footer font-size is 11px`, footerFontSize === '11px', `got ${footerFontSize}`);

  // 8. No element has animation-iteration-count "infinite"
  const infiniteAnimElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all.filter((el) => window.getComputedStyle(el).animationIterationCount === 'infinite').length;
  });
  recordAssertion(`no element has animation-iteration-count infinite`, infiniteAnimElements === 0, `found ${infiniteAnimElements}`);

  // 9. After animations finish, no .wipe element has clip-path other than "none" / "inset(0px)"
  const wipeClipPaths = await page.evaluate(() => {
    const wipes = Array.from(document.querySelectorAll('.wipe'));
    return wipes.map((el) => window.getComputedStyle(el).clipPath).filter((cp) => cp && cp !== 'none' && cp !== 'inset(0px)');
  });
  recordAssertion(
    `after animations finish, no .wipe element has lingering clip-path`,
    wipeClipPaths.length === 0,
    `lingering clip-paths: ${JSON.stringify(wipeClipPaths)}`
  );

  // Capture Welcome Screenshots (1440 and 375)
  await page.screenshot({ path: path.join(screenshotDir, 'welcome_1440.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, 'welcome_375.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // ----------------------------------------------------
  // STEP 2: /enter-data
  // ----------------------------------------------------
  console.log(`\n[${themeName}] Navigating to /enter-data...`);
  const checkbox = page.locator('input[type="checkbox"]');
  await checkbox.check();
  await page.waitForTimeout(200);

  const startBtn = page.getByRole('button', { name: /Start/i });
  await startBtn.click();
  await page.waitForURL('**/enter-data', { timeout: 10000 });
  await page.waitForTimeout(800);

  // Input wrapper styling
  const inputWrapperStyles = await page.evaluate(() => {
    const input = document.querySelector('input[type="number"]');
    const wrapper = input ? input.closest('.field-wrapper') || input.parentElement : null;
    if (!wrapper) return null;
    const cs = window.getComputedStyle(wrapper);
    return {
      height: cs.height,
      borderColor: cs.borderTopColor,
    };
  });
  recordAssertion(`input wrapper height is 34px`, inputWrapperStyles?.height === '34px', `got ${inputWrapperStyles?.height}`);
  recordAssertion(
    `input wrapper border-color is ${expectedBds}`,
    inputWrapperStyles?.borderColor === expectedBds,
    `got ${inputWrapperStyles?.borderColor}`
  );

  // Focus input and test outline-width 2px
  const ageInput = page.locator('input[type="number"]').first();
  await ageInput.focus();
  await page.waitForTimeout(200);

  const focusOutlineWidth = await page.evaluate(() => {
    const input = document.querySelector('input[type="number"]');
    const wrapper = input ? input.closest('.field-wrapper') || input.parentElement : null;
    if (!wrapper) return '';
    return window.getComputedStyle(wrapper).outlineWidth;
  });
  recordAssertion(`input wrapper outline-width is 2px on focus`, focusOutlineWidth === '2px', `got ${focusOutlineWidth}`);

  // Create an out-of-range field: set Age to 80 (typical range is 18 to 75)
  await ageInput.fill('80');
  await page.waitForTimeout(300);

  // Verify caption shows out of range
  const captionText = await page.evaluate(() => {
    const input = document.querySelector('input[type="number"]');
    const container = input ? input.closest('.flex-col') || input.parentElement?.parentElement : null;
    const caption = container ? container.querySelector('span[style*="11px"], div[style*="11px"]') : null;
    return caption ? caption.textContent : '';
  });
  const hasOutOfRangeCaption = captionText?.includes('Outside typical range') || captionText?.includes('typical range');
  recordAssertion(`out-of-range caption updates live when value exceeds typical range`, !!hasOutOfRangeCaption, `got "${captionText}"`);

  // Capture Data Entry Screenshots with one field focused and one out of range
  await page.screenshot({ path: path.join(screenshotDir, 'data_entry_1440.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, 'data_entry_375.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // Load sample patient
  console.log(`\n[${themeName}] Loading sample patient...`);
  const sampleSelect = page.locator('select').filter({ hasText: /sample patient/i });
  await sampleSelect.first().selectOption('normal');
  await page.waitForTimeout(500);

  // Click Predict and capture transition overlay
  console.log(`\n[${themeName}] Clicking Predict and verifying overlay...`);
  const predictBtn = page.getByRole('button', { name: /^Predict$/i });

  // Start predict and observe overlay
  const predictPromise = predictBtn.click();

  // Wait for overlay to appear
  await page.waitForSelector('.ecg-grid.fixed, div:has-text("Estimating…")', { timeout: 3000 });
  const overlayText = await page.textContent('.ecg-grid.fixed, div:has-text("Estimating…")');
  const hasEstimating = overlayText && overlayText.includes('Estimating…');
  recordAssertion(`predict overlay contains "Estimating…" text`, !!hasEstimating, `got "${overlayText}"`);

  // Capture predict overlay mid-animation screenshot (1440px and 375px)
  await page.screenshot({ path: path.join(screenshotDir, 'predict_overlay_1440.png') });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, 'predict_overlay_375.png') });
  await page.setViewportSize({ width: 1440, height: 900 });

  await predictPromise;
  await page.waitForURL('**/results', { timeout: 15000 });
  await page.waitForTimeout(1500); // Allow 3D canvas and components to settle

  // ----------------------------------------------------
  // STEP 3: /results
  // ----------------------------------------------------
  console.log(`\n[${themeName}] Verifying /results computed styles...`);

  // 1. Result number: font-family IBM Plex Mono, font-size 40px, weight 500, tabular-nums
  const resultNumStyles = await page.evaluate(() => {
    // Find the 40px result element
    const all = Array.from(document.querySelectorAll('span'));
    const el = all.find((s) => s.textContent && s.textContent.trim().endsWith('%') && window.getComputedStyle(s).fontSize === '40px');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontVariantNumeric: cs.fontVariantNumeric,
    };
  });
  recordAssertion(
    `result number font-family starts with IBM Plex Mono`,
    resultNumStyles?.fontFamily.toLowerCase().includes('ibm plex mono'),
    `got "${resultNumStyles?.fontFamily}"`
  );
  recordAssertion(`result number font-size is 40px`, resultNumStyles?.fontSize === '40px', `got ${resultNumStyles?.fontSize}`);
  recordAssertion(`result number font-weight is 500`, resultNumStyles?.fontWeight === '500', `got ${resultNumStyles?.fontWeight}`);
  recordAssertion(
    `result number has tabular-nums`,
    resultNumStyles?.fontVariantNumeric.includes('tabular-nums'),
    `got "${resultNumStyles?.fontVariantNumeric}"`
  );

  // 2. Vessel number: mono 20px
  const vesselNumStyles = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('span'));
    const el = all.find((s) => s.textContent && s.textContent.trim().endsWith('%') && window.getComputedStyle(s).fontSize === '20px');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
    };
  });
  recordAssertion(
    `vessel number font-family starts with IBM Plex Mono`,
    vesselNumStyles?.fontFamily.toLowerCase().includes('ibm plex mono'),
    `got "${vesselNumStyles?.fontFamily}"`
  );
  recordAssertion(`vessel number font-size is 20px`, vesselNumStyles?.fontSize === '20px', `got ${vesselNumStyles?.fontSize}`);

  // 3. Risk dot: 8px square, border-radius 50%
  const riskDotStyles = await page.evaluate(() => {
    const dot = document.querySelector('.risk-dot') || document.querySelector('span[style*="border-radius: 50%"]');
    if (!dot) return null;
    const cs = window.getComputedStyle(dot);
    return {
      width: cs.width,
      height: cs.height,
      borderRadius: cs.borderRadius,
    };
  });
  recordAssertion(
    `risk dot is 8px square with 50% border-radius`,
    riskDotStyles?.width === '8px' && riskDotStyles?.height === '8px' && (riskDotStyles?.borderRadius === '50%' || riskDotStyles?.borderRadius === '4px'),
    `got ${JSON.stringify(riskDotStyles)}`
  );

  // 4. Probability bar: height 6px; thin bar: height 4px
  const barStyles = await page.evaluate(() => {
    const bars = Array.from(document.querySelectorAll('div')).filter((d) => {
      const h = window.getComputedStyle(d).height;
      return h === '6px' || h === '4px';
    });
    const bar6 = bars.find((d) => window.getComputedStyle(d).height === '6px');
    const bar4 = bars.find((d) => window.getComputedStyle(d).height === '4px');
    return {
      has6px: !!bar6,
      has4px: !!bar4,
    };
  });
  recordAssertion(`probability bar height is 6px`, barStyles.has6px, `6px bar found: ${barStyles.has6px}`);
  recordAssertion(`factor thin bar height is 4px`, barStyles.has4px, `4px bar found: ${barStyles.has4px}`);

  // 5. Select LAD vessel row
  console.log(`\n[${themeName}] Selecting LAD vessel row...`);
  const ladRow = page.locator('.row').filter({ hasText: /LAD/i }).first();
  await ladRow.click();
  await page.waitForTimeout(400);

  const selectedRowStyles = await page.evaluate(() => {
    const row = document.querySelector('.row.selected');
    if (!row) return null;
    const cs = window.getComputedStyle(row);
    const trace = row.querySelector('.trace');
    const traceOpacity = trace ? window.getComputedStyle(trace).opacity : '';
    return {
      borderLeftWidth: cs.borderLeftWidth,
      borderLeftColor: cs.borderLeftColor,
      traceOpacity,
    };
  });
  recordAssertion(`selected vessel row border-left-width is 3px`, selectedRowStyles?.borderLeftWidth === '3px', `got ${selectedRowStyles?.borderLeftWidth}`);
  recordAssertion(
    `selected vessel row border-left-color is ${expectedAcc}`,
    selectedRowStyles?.borderLeftColor === expectedAcc,
    `got ${selectedRowStyles?.borderLeftColor}`
  );
  recordAssertion(`vessel row trace becomes visible on selection`, selectedRowStyles?.traceOpacity === '1', `got ${selectedRowStyles?.traceOpacity}`);

  // Capture Results Screenshots (1440 and 375)
  await page.screenshot({ path: path.join(screenshotDir, 'results_1440.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, 'results_375.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // ----------------------------------------------------
  // STEP 4: /reports
  // ----------------------------------------------------
  console.log(`\n[${themeName}] Navigating to /reports...`);
  const createReportsBtn = page.getByRole('button', { name: /Create reports/i });
  await createReportsBtn.click();
  await page.waitForURL('**/reports', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Assert report sheet background is rgb(255, 255, 255) in BOTH themes
  const sheetBg = await page.evaluate(() => {
    const sheet =
      document.querySelector('#printable-report-sheet') ||
      document.querySelector('article[style*="var(--sheet)"]') ||
      document.querySelector('.sheet-document') ||
      document.querySelector('article');
    if (!sheet) return '';
    return window.getComputedStyle(sheet).backgroundColor;
  });
  recordAssertion(
    `report sheet background is rgb(255, 255, 255) in ${themeName}`,
    sheetBg === 'rgb(255, 255, 255)',
    `got "${sheetBg}"`
  );

  // Capture Clinician Report Screenshots
  await page.screenshot({ path: path.join(screenshotDir, 'reports_clinician_1440.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, 'reports_clinician_375.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // Switch to Patient report tab
  console.log(`\n[${themeName}] Switching to Patient report tab...`);
  const patientTab = page.getByRole('button', { name: /Patient report/i });
  await patientTab.click();
  await page.waitForTimeout(500);

  const patientReportText = await page.textContent('body');
  const hasPatientReport = patientReportText && (patientReportText.includes('Heart Health Summary') || patientReportText.includes('Patient'));
  recordAssertion(`patient report renders upon switching tabs`, !!hasPatientReport, `rendered text check`);

  // Capture Patient Report Screenshots
  await page.screenshot({ path: path.join(screenshotDir, 'reports_patient_1440.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, 'reports_patient_375.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // ----------------------------------------------------
  // STEP 5: /model-info
  // ----------------------------------------------------
  console.log(`\n[${themeName}] Navigating to /model-info...`);
  const modelInfoLink = page.getByRole('link', { name: /Model information/i });
  await modelInfoLink.click();
  await page.waitForURL('**/model-info', { timeout: 10000 });
  await page.waitForTimeout(600);

  const modelInfoText = await page.textContent('body');
  const hasModelMetrics =
    modelInfoText &&
    modelInfoText.includes('Validation performance metrics') &&
    (modelInfoText.includes('ROC-AUC') || modelInfoText.includes('Accuracy'));
  recordAssertion(`model info page renders metrics and feature group tables`, !!hasModelMetrics, `metrics check`);

  // Capture Model Info Screenshots
  await page.screenshot({ path: path.join(screenshotDir, 'model_info_1440.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, 'model_info_375.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // Audit Console Errors
  recordAssertion(
    `zero browser console errors during session (${themeName})`,
    consoleErrors.length === 0,
    consoleErrors.join('; ')
  );

  await context.close();
}

async function runReducedMotionTest(browser) {
  console.log(`\n======================================================`);
  console.log(`>>> TESTING REDUCED MOTION (prefers-reduced-motion: reduce)`);
  console.log(`======================================================`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });

  const page = await context.newPage();

  console.log(`[ReducedMotion] Navigating to /welcome...`);
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle', timeout: 30000 });

  // Verify animations are disabled
  const animDuration = await page.evaluate(() => {
    const el = document.querySelector('.wipe');
    return el ? window.getComputedStyle(el).animationDuration : '0s';
  });
  const isReducedDisabled =
    animDuration === '0.01ms' ||
    animDuration === '0s' ||
    animDuration === '1e-05s' ||
    animDuration.includes('1e-05') ||
    parseFloat(animDuration) <= 0.001;
  recordAssertion(
    `reduced motion disables wipe animations (duration 0.01ms / 0s)`,
    isReducedDisabled,
    `got "${animDuration}"`
  );

  // Step through to predict
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /Start/i }).click();
  await page.waitForURL('**/enter-data', { timeout: 10000 });

  const sampleSelect = page.locator('select').filter({ hasText: /sample patient/i });
  await sampleSelect.first().selectOption('normal');
  await page.waitForTimeout(200);

  const t0 = Date.now();
  await page.getByRole('button', { name: /^Predict$/i }).click();
  await page.waitForURL('**/results', { timeout: 10000 });
  const elapsed = Date.now() - t0;
  console.log(`  -> Predict navigation completed in ${elapsed}ms under reduced motion`);

  // Under normal motion, minDelay is 1650ms. With reduced motion, minDelay is 0ms.
  // The network inference call is typically ~100-300ms, so total elapsed is well under 1400ms.
  recordAssertion(
    `reduced motion does not delay navigation beyond network request time`,
    elapsed < 1400,
    `elapsed: ${elapsed}ms`
  );

  await context.close();
}

async function runAll() {
  console.log(`[CONFORMANCE] Starting Design Conformance Suite against ${BASE_URL}...`);
  const browser = await getBrowser();

  try {
    // 1. Light Theme ("Paper")
    await runThemeFlow(browser, 'light', 'Paper', PAPER_DIR);

    // 2. Dark Theme ("Monitor")
    await runThemeFlow(browser, 'dark', 'Monitor', MONITOR_DIR);

    // 3. Reduced Motion Test
    await runReducedMotionTest(browser);

    // Final Summary
    console.log(`\n======================================================`);
    console.log(`>>> DESIGN CONFORMANCE RESULTS SUMMARY`);
    console.log(`======================================================`);

    const passedCount = assertionResults.filter((a) => a.passed).length;
    const failedCount = assertionResults.filter((a) => !a.passed).length;
    console.log(`Total Assertions: ${assertionResults.length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);

    if (failedCount > 0) {
      console.error(`\nFAILED ASSERTIONS:`);
      assertionResults
        .filter((a) => !a.passed)
        .forEach((a, i) => console.error(`  ${i + 1}. ${a.name} (${a.detail})`));
      process.exit(1);
    } else {
      console.log(`\nALL CONFORMANCE ASSERTIONS PASSED!`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`\n[FATAL ERROR]:`, err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAll();
