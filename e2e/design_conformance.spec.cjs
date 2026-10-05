/**
 * Design Conformance Test Suite (Phase 7 / Task 7.2)
 * Tests strict adherence to the ECG Paper design language metrics:
 * - header height 56px (48px under 900px)
 * - step button height 56px
 * - number box 20px
 * - step bars 3px
 * - current step bar colour = --acc
 * - welcome strip height 64px (40px under 600px)
 * - title 28px/600
 * - sidebar width 240px
 * - section header padding (12px 16px)
 * - field control height 34px
 * - action bar border-top 1px
 * - sticky positions (nav sticky top 0, sidebar sticky top 72px, action bar sticky bottom 0, mobile strip sticky top 48px)
 * Removes old header and Back link assertions.
 */

const { chromium } = require('playwright-core');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
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
    console.log('[CONFORMANCE] Chrome launch failed, trying Edge...');
    return await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

async function testTheme(browser, themeKey, themeName) {
  console.log(`\n======================================================`);
  console.log(`>>> TESTING THEME CONFORMANCE: ${themeName} (${themeKey})`);
  console.log(`======================================================`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript((th) => {
    localStorage.setItem('perfusion3d-theme', th);
  }, themeKey);

  const page = await context.newPage();

  const isLight = themeKey === 'light';
  const expectedAcc = isLight ? 'rgb(29, 63, 138)' : 'rgb(76, 255, 154)';

  // ----------------------------------------------------
  // SCREEN 1: /welcome (Desktop 1440px)
  // ----------------------------------------------------
  console.log(`[${themeName}] Testing /welcome (1440px)...`);
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);

  // 1. Header height 56px at >=900px, position sticky, top 0
  const headerDesktop = await page.evaluate(() => {
    const hdr = document.querySelector('header.app-header');
    if (!hdr) return null;
    const cs = window.getComputedStyle(hdr);
    return {
      height: cs.height,
      position: cs.position,
      top: cs.top,
      borderBottomWidth: cs.borderBottomWidth,
    };
  });
  recordAssertion(
    `header height is 56px at 1440px`,
    headerDesktop?.height === '56px',
    `got ${headerDesktop?.height}`
  );
  recordAssertion(
    `header position is sticky with top 0`,
    headerDesktop?.position === 'sticky' && (headerDesktop?.top === '0px' || headerDesktop?.top === '0'),
    `got position=${headerDesktop?.position}, top=${headerDesktop?.top}`
  );

  // 2. Step button height 56px
  const stepBtnHeight = await page.evaluate(() => {
    const btn = document.querySelector('.nav-step-item-btn');
    return btn ? window.getComputedStyle(btn).height : '';
  });
  recordAssertion(
    `step button height is 56px`,
    stepBtnHeight === '56px',
    `got ${stepBtnHeight}`
  );

  // 3. Number box 20px
  const numBoxDims = await page.evaluate(() => {
    const nb = document.querySelector('.nav-step-num');
    if (!nb) return null;
    const cs = window.getComputedStyle(nb);
    return { width: cs.width, height: cs.height };
  });
  recordAssertion(
    `number box dimensions are 20px x 20px`,
    numBoxDims?.width === '20px' && numBoxDims?.height === '20px',
    `got ${JSON.stringify(numBoxDims)}`
  );

  // 4. Current step bar color = --acc, height = 3px
  const currentStepBar = await page.evaluate((expectedAcc) => {
    const btn = document.querySelector('.nav-step-item-btn.current');
    if (!btn) return null;
    // Check after pseudo element
    const after = window.getComputedStyle(btn, '::after');
    return {
      height: after.height,
      backgroundColor: after.backgroundColor,
    };
  }, expectedAcc);
  recordAssertion(
    `step bar height is 3px`,
    currentStepBar?.height === '3px',
    `got ${currentStepBar?.height}`
  );
  recordAssertion(
    `current step bar colour equals --acc (${expectedAcc})`,
    currentStepBar?.backgroundColor === expectedAcc,
    `got ${currentStepBar?.backgroundColor}`
  );

  // 5. Welcome ECG strip band height 64px
  const stripHeight = await page.evaluate(() => {
    const band = document.querySelector('.ecg-strip-band');
    return band ? window.getComputedStyle(band).height : '';
  });
  recordAssertion(
    `welcome strip band height is 64px at 1440px`,
    stripHeight === '64px',
    `got ${stripHeight}`
  );

  // 6. Title 28px/600
  const titleStyles = await page.evaluate(() => {
    const t = document.querySelector('h1');
    if (!t) return null;
    const cs = window.getComputedStyle(t);
    return { fontSize: cs.fontSize, fontWeight: cs.fontWeight };
  });
  recordAssertion(
    `welcome title is 28px/600`,
    titleStyles?.fontSize === '28px' && titleStyles?.fontWeight === '600',
    `got ${JSON.stringify(titleStyles)}`
  );

  // Check mobile header height <900px
  await page.setViewportSize({ width: 768, height: 900 });
  await page.waitForTimeout(300);
  const headerMobile = await page.evaluate(() => {
    const hdr = document.querySelector('header.app-header');
    return hdr ? window.getComputedStyle(hdr).height : '';
  });
  recordAssertion(
    `header height is 48px under 900px (at 768px)`,
    headerMobile === '48px',
    `got ${headerMobile}`
  );

  // Check welcome strip height <600px (at 375px)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  const stripMobileHeight = await page.evaluate(() => {
    const band = document.querySelector('.ecg-strip-band');
    return band ? window.getComputedStyle(band).height : '';
  });
  recordAssertion(
    `welcome strip band height is 40px under 600px (at 375px)`,
    stripMobileHeight === '40px',
    `got ${stripMobileHeight}`
  );

  // Restore 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // ----------------------------------------------------
  // SCREEN 2: /enter-data (Desktop 1440px)
  // ----------------------------------------------------
  console.log(`[${themeName}] Navigating to /enter-data (1440px)...`);
  await page.locator('#welcome-understand-checkbox').check();
  await page.locator('#start-assessment-btn').click();
  await page.waitForURL('**/enter-data', { timeout: 15000 });
  await page.waitForTimeout(600);

  // 7. Sidebar width 240px, sticky top 72px
  const sidebarStyles = await page.evaluate(() => {
    const sb = document.querySelector('.sidebar-desktop');
    if (!sb) return null;
    const cs = window.getComputedStyle(sb);
    return {
      width: cs.width,
      position: cs.position,
      top: cs.top,
    };
  });
  recordAssertion(
    `sidebar width is 240px`,
    sidebarStyles?.width === '240px',
    `got ${sidebarStyles?.width}`
  );
  recordAssertion(
    `sidebar position is sticky with top 72px`,
    sidebarStyles?.position === 'sticky' && sidebarStyles?.top === '72px',
    `got position=${sidebarStyles?.position}, top=${sidebarStyles?.top}`
  );

  // 8. Section header padding 12px 16px
  const sectionHeaderPadding = await page.evaluate(() => {
    const btn = document.querySelector('.section-panel-header');
    if (!btn) return null;
    const cs = window.getComputedStyle(btn);
    return {
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      paddingRight: cs.paddingRight,
    };
  });
  recordAssertion(
    `section header padding is 12px 16px`,
    sectionHeaderPadding?.paddingTop === '12px' &&
      sectionHeaderPadding?.paddingBottom === '12px' &&
      sectionHeaderPadding?.paddingLeft === '16px' &&
      sectionHeaderPadding?.paddingRight === '16px',
    `got ${JSON.stringify(sectionHeaderPadding)}`
  );

  // 9. Field control height 34px
  const controlHeight = await page.evaluate(() => {
    const input = document.querySelector('input[type="number"]');
    const select = document.querySelector('.section-field-grid select');
    const choice = document.querySelector('.segmented-choice-btn');
    return {
      inputHeight: input ? window.getComputedStyle(input).height : '',
      selectHeight: select ? window.getComputedStyle(select).height : '',
      choiceHeight: choice ? window.getComputedStyle(choice).height : '',
    };
  });
  recordAssertion(
    `field control height is 34px`,
    controlHeight.inputHeight === '34px' || controlHeight.selectHeight === '34px',
    `got ${JSON.stringify(controlHeight)}`
  );

  // 10. Action bar border-top 1px, position sticky, bottom 0
  const actionBarStyles = await page.evaluate(() => {
    const bar = document.querySelector('.sticky-action-bar');
    if (!bar) return null;
    const cs = window.getComputedStyle(bar);
    return {
      borderTopWidth: cs.borderTopWidth,
      position: cs.position,
      bottom: cs.bottom,
    };
  });
  recordAssertion(
    `action bar border-top is 1px`,
    actionBarStyles?.borderTopWidth === '1px',
    `got ${actionBarStyles?.borderTopWidth}`
  );
  recordAssertion(
    `action bar position is sticky with bottom 0`,
    actionBarStyles?.position === 'sticky' &&
      (actionBarStyles?.bottom === '0px' || actionBarStyles?.bottom === '0'),
    `got position=${actionBarStyles?.position}, bottom=${actionBarStyles?.bottom}`
  );

  // 11. Mobile section strip sticky top 48px
  await page.setViewportSize({ width: 768, height: 900 });
  await page.waitForTimeout(300);
  const mobileStripStyles = await page.evaluate(() => {
    const strip = document.querySelector('.section-strip-mobile');
    if (!strip) return null;
    const cs = window.getComputedStyle(strip);
    return {
      position: cs.position,
      top: cs.top,
      height: cs.height,
    };
  });
  recordAssertion(
    `mobile section strip is sticky top 48px with height 44px (<900px)`,
    mobileStripStyles?.position === 'sticky' &&
      mobileStripStyles?.top === '48px' &&
      mobileStripStyles?.height === '44px',
    `got ${JSON.stringify(mobileStripStyles)}`
  );

  await context.close();
}

async function runConformance() {
  console.log('=== Running ECG Paper Design Conformance Suite (Task 7.2) ===');
  console.log(`Target: ${BASE_URL}\n`);

  const browser = await getBrowser();
  try {
    await testTheme(browser, 'light', 'Paper');
    await testTheme(browser, 'dark', 'Monitor');

    console.log(`\n======================================================`);
    console.log(`>>> DESIGN CONFORMANCE SUMMARY`);
    console.log(`======================================================`);
    const passed = assertionResults.filter((a) => a.passed).length;
    const failed = assertionResults.filter((a) => !a.passed).length;
    console.log(`Total: ${assertionResults.length}, Passed: ${passed}, Failed: ${failed}`);

    if (failed > 0) {
      console.error('\nFAILED ASSERTIONS:');
      assertionResults
        .filter((a) => !a.passed)
        .forEach((a, i) => console.error(`  ${i + 1}. ${a.name} (${a.detail})`));
      process.exit(1);
    } else {
      console.log('\nALL CONFORMANCE CHECKS PASSED WITH 0 FAILURES!');
      process.exit(0);
    }
  } finally {
    await browser.close();
  }
}

runConformance().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
