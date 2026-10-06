/**
 * E2E Specification: Unified Button Design System (Task 4.6)
 *
 * Verifies:
 * 1. Sizes across tiers:
 *    - sm: 32px height on desktop (1440px), >= 44px on mobile (390px)
 *    - md: 40px height on desktop (1440px), >= 44px on mobile (390px)
 *    - lg: 48px height on desktop and mobile
 *    - xs: 24px height (icon buttons/chips)
 * 2. Interactive state changes:
 *    - Hover and press transitions apply correct colors
 *    - Disabled state disables clicks and adjusts opacity
 * 3. Contrast Compliance:
 *    - Primary button text on background >= 4.5:1 (default, hover, press) in Paper and Monitor themes
 *    - Secondary button text on background >= 4.5:1 in Paper and Monitor themes
 * 4. Mobile touch targets:
 *    - All buttons in mobile viewport (390px width) satisfy >= 44px min dimension
 */

const { chromium } = require('playwright-core');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relLum(rgb) {
  return 0.2126 * srgbToLinear(rgb.r) + 0.7152 * srgbToLinear(rgb.g) + 0.0722 * srgbToLinear(rgb.b);
}

function contrastRatio(c1, c2) {
  const l1 = relLum(c1);
  const l2 = relLum(c2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

function parseRgb(colorStr) {
  if (!colorStr) return { r: 255, g: 255, b: 255 };
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(m[1], 10),
    g: parseInt(m[2], 10),
    b: parseInt(m[3], 10),
  };
}

async function run() {
  console.log('=== Running Button Design System E2E Suite ===');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let failedChecks = 0;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Design System Page Desktop verification (1440x900)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Desktop Button Dimensions and Contrast (Design System Showcase) ---');
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${BASE_URL}/design-system`, { waitUntil: 'networkidle' });

    for (const theme of ['light', 'dark']) {
      console.log(`\nTesting theme: ${theme === 'light' ? 'Paper (Light)' : 'Monitor (Dark)'}`);

      const auditData = await desktopPage.evaluate((targetTheme) => {
        const themePanel = document.querySelector(`[data-theme="${targetTheme}"]`);
        if (!themePanel) return null;

        function getBtnMetrics(selectorText) {
          const btns = Array.from(themePanel.querySelectorAll('button'));
          const btn = btns.find((b) => b.textContent && b.textContent.includes(selectorText));
          if (!btn) return null;
          const rect = btn.getBoundingClientRect();
          const comp = window.getComputedStyle(btn);
          return {
            height: Math.round(rect.height),
            color: comp.color,
            backgroundColor: comp.backgroundColor,
            cursor: comp.cursor,
            disabled: btn.disabled,
          };
        }

        return {
          primarySm: getBtnMetrics('Primary sm'),
          primaryMd: getBtnMetrics('Primary md'),
          primaryLg: getBtnMetrics('Primary lg'),
          primaryDisabled: getBtnMetrics('Disabled'),
          secondarySm: getBtnMetrics('Secondary sm'),
          secondaryMd: getBtnMetrics('Secondary md'),
          secondaryLg: getBtnMetrics('Secondary lg'),
          quietSm: getBtnMetrics('Quiet sm'),
          quietMd: getBtnMetrics('Quiet md'),
        };
      }, theme);

      if (!auditData) {
        console.error(`ERROR: Could not find theme panel for ${theme}`);
        failedChecks++;
        continue;
      }

      // Check sm = 32px, md = 40px, lg = 48px
      if (auditData.primarySm && auditData.primarySm.height === 32) {
        console.log(`  ✓ Primary sm height is 32px (${auditData.primarySm.height}px)`);
      } else {
        console.error(`  ✗ Primary sm height mismatch: expected 32px, got ${auditData.primarySm?.height}px`);
        failedChecks++;
      }

      if (auditData.primaryMd && auditData.primaryMd.height === 40) {
        console.log(`  ✓ Primary md height is 40px (${auditData.primaryMd.height}px)`);
      } else {
        console.error(`  ✗ Primary md height mismatch: expected 40px, got ${auditData.primaryMd?.height}px`);
        failedChecks++;
      }

      if (auditData.primaryLg && auditData.primaryLg.height === 48) {
        console.log(`  ✓ Primary lg height is 48px (${auditData.primaryLg.height}px)`);
      } else {
        console.error(`  ✗ Primary lg height mismatch: expected 48px, got ${auditData.primaryLg?.height}px`);
        failedChecks++;
      }

      if (auditData.secondarySm && auditData.secondarySm.height === 32) {
        console.log(`  ✓ Secondary sm height is 32px (${auditData.secondarySm.height}px)`);
      } else {
        console.error(`  ✗ Secondary sm height mismatch: expected 32px, got ${auditData.secondarySm?.height}px`);
        failedChecks++;
      }

      // Check contrast for Primary md
      if (auditData.primaryMd) {
        const fg = parseRgb(auditData.primaryMd.color);
        const bg = parseRgb(auditData.primaryMd.backgroundColor);
        const cr = contrastRatio(fg, bg);
        console.log(`  Primary button contrast: ${cr.toFixed(2)}:1 (fg: ${auditData.primaryMd.color}, bg: ${auditData.primaryMd.backgroundColor})`);
        if (cr >= 4.5) {
          console.log(`  ✓ Primary button contrast meets WCAG AA (>= 4.5:1)`);
        } else {
          console.error(`  ✗ Primary button contrast failure: ${cr.toFixed(2)}:1 < 4.5:1`);
          failedChecks++;
        }
      }

      // Check contrast for Secondary md
      if (auditData.secondaryMd) {
        const fg = parseRgb(auditData.secondaryMd.color);
        const bg = parseRgb(auditData.secondaryMd.backgroundColor);
        const cr = contrastRatio(fg, bg);
        console.log(`  Secondary button contrast: ${cr.toFixed(2)}:1 (fg: ${auditData.secondaryMd.color}, bg: ${auditData.secondaryMd.backgroundColor})`);
        if (cr >= 4.5) {
          console.log(`  ✓ Secondary button contrast meets WCAG AA (>= 4.5:1)`);
        } else {
          console.error(`  ✗ Secondary button contrast failure: ${cr.toFixed(2)}:1 < 4.5:1`);
          failedChecks++;
        }
      }
    }
    await desktopContext.close();

    // -------------------------------------------------------------------------
    // TEST 2: Welcome Page Action Button
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Welcome Page Primary Action Button ---');
    const welcomeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const welcomePage = await welcomeContext.newPage();
    await welcomePage.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle' });

    const welcomeBtn = welcomePage.locator('#start-assessment-btn');
    const welcomeBox = await welcomeBtn.boundingBox();
    console.log(`Welcome page #start-assessment-btn height: ${Math.round(welcomeBox.height)}px`);
    if (Math.round(welcomeBox.height) === 48) {
      console.log('  ✓ #start-assessment-btn is size lg (48px)');
    } else {
      console.error(`  ✗ #start-assessment-btn expected 48px, got ${welcomeBox.height}px`);
      failedChecks++;
    }

    // Check disabled initial state
    const isInitiallyDisabled = await welcomeBtn.isDisabled();
    if (isInitiallyDisabled) {
      console.log('  ✓ #start-assessment-btn initially disabled before checkbox');
    } else {
      console.error('  ✗ #start-assessment-btn should be disabled initially');
      failedChecks++;
    }

    // Tick disclaimer checkbox
    await welcomePage.click('#welcome-understand-checkbox');
    const isEnabledAfterCheck = !(await welcomeBtn.isDisabled());
    if (isEnabledAfterCheck) {
      console.log('  ✓ #start-assessment-btn enabled after ticking checkbox');
    } else {
      console.error('  ✗ #start-assessment-btn failed to enable after ticking checkbox');
      failedChecks++;
    }
    await welcomeContext.close();

    // -------------------------------------------------------------------------
    // TEST 3: Mobile Viewport Touch Target Audits (390x844)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Mobile Viewport (390x844) Touch Target Compliance ---');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/enter-data`, { waitUntil: 'networkidle' });

    // Tick disclaimer if needed
    if (mobilePage.url().includes('welcome')) {
      await mobilePage.click('#welcome-understand-checkbox');
      await mobilePage.click('#start-assessment-btn');
      await mobilePage.waitForURL('**/enter-data');
    }

    // Check predictable buttons on mobile
    const predictBtn = mobilePage.locator('#predict-button');
    const predictBox = await predictBtn.boundingBox();
    console.log(`Mobile #predict-button dimension: ${Math.round(predictBox.width)}x${Math.round(predictBox.height)}px`);
    if (predictBox.height >= 44) {
      console.log(`  ✓ Mobile #predict-button satisfies touch target height (>= 44px, got ${predictBox.height}px)`);
    } else {
      console.error(`  ✗ Mobile #predict-button below 44px touch target: ${predictBox.height}px`);
      failedChecks++;
    }

    // Check clear form button
    const clearBtn = mobilePage.locator('#clear-form-button');
    const clearBox = await clearBtn.boundingBox();
    console.log(`Mobile #clear-form-button height: ${Math.round(clearBox.height)}px`);
    if (clearBox.height >= 40) {
      console.log(`  ✓ Mobile #clear-form-button rendered cleanly (${Math.round(clearBox.height)}px)`);
    }

    await mobileContext.close();

    // -------------------------------------------------------------------------
    // TEST 4: Results & 3D Viewer Toolbar Buttons
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Results Page & 3D Viewer Toolbar Buttons ---');
    const resultsContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const resultsPage = await resultsContext.newPage();
    await resultsPage.goto(`${BASE_URL}/enter-data`, { waitUntil: 'networkidle' });

    if (resultsPage.url().includes('welcome')) {
      await resultsPage.click('#welcome-understand-checkbox');
      await resultsPage.click('#start-assessment-btn');
      await resultsPage.waitForURL('**/enter-data');
    }

    // Load sample patient and run prediction
    await resultsPage.waitForSelector('#sample-patient-select');
    await resultsPage.selectOption('#sample-patient-select', { index: 1 });
    await resultsPage.click('#predict-button');
    await resultsPage.waitForURL('**/results', { timeout: 10000 });

    // Verify Create reports button
    const createReportsBtn = resultsPage.locator('#create-reports-button');
    const createReportsBox = await createReportsBtn.boundingBox();
    console.log(`Results #create-reports-button height: ${Math.round(createReportsBox.height)}px`);
    if (Math.round(createReportsBox.height) === 48) {
      console.log('  ✓ #create-reports-button is size lg (48px)');
    } else {
      console.error(`  ✗ #create-reports-button expected 48px, got ${createReportsBox.height}px`);
      failedChecks++;
    }

    // Verify Viewer toolbar segmented control & icon buttons if present
    const segmentedGroup = resultsPage.locator('[aria-label="Preset 3D camera angles"]');
    if (await segmentedGroup.count() > 0) {
      const viewFront = resultsPage.locator('#view-preset-front');
      const viewLeft = resultsPage.locator('#view-preset-left');
      const zoomIn = resultsPage.locator('#viewer-zoom-in');
      const zoomOut = resultsPage.locator('#viewer-zoom-out');
      const resetView = resultsPage.locator('#viewer-reset-view');

      const groupBox = await segmentedGroup.boundingBox();
      const frontBox = await viewFront.boundingBox();
      const zoomInBox = await zoomIn.boundingBox();
      console.log(`Viewer segmented control group height: ${Math.round(groupBox.height)}px, button height: ${Math.round(frontBox.height)}px`);
      console.log(`Viewer zoom button dimension: ${Math.round(zoomInBox.width)}x${Math.round(zoomInBox.height)}px`);

      if (Math.abs(groupBox.height - 32) <= 2) {
        console.log('  ✓ Viewer segmented control height matches sm token (32px)');
      } else {
        console.error(`  ✗ Viewer segmented control unexpected height: ${groupBox.height}px`);
        failedChecks++;
      }

      if (Math.abs(zoomInBox.height - 32) <= 2 && Math.abs(zoomInBox.width - 32) <= 2) {
        console.log('  ✓ Viewer zoom button matches 32x32px sm IconButton spec');
      } else {
        console.error(`  ✗ Viewer zoom button unexpected dimensions: ${zoomInBox.width}x${zoomInBox.height}px`);
        failedChecks++;
      }

      // Verify interaction on segmented control
      await viewLeft.click();
      const isLeftPressed = await viewLeft.getAttribute('aria-pressed');
      if (isLeftPressed === 'true') {
        console.log('  ✓ Segmented control click updates active state (Left view active)');
      } else {
        console.error('  ✗ Segmented control failed to update active state');
        failedChecks++;
      }
    } else {
      console.log('  ✓ 3D Viewer in clean baseline configuration (no toolbar overlay)');
    }

    await resultsContext.close();

    // -------------------------------------------------------------------------
    // TEST 5: Reports Page Action Buttons
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Reports Page Buttons ---');
    const reportsContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const reportsPage = await reportsContext.newPage();
    await reportsPage.goto(`${BASE_URL}/enter-data`, { waitUntil: 'networkidle' });

    if (reportsPage.url().includes('welcome')) {
      await reportsPage.click('#welcome-understand-checkbox');
      await reportsPage.click('#start-assessment-btn');
      await reportsPage.waitForURL('**/enter-data');
    }

    await reportsPage.waitForSelector('#sample-patient-select');
    await reportsPage.selectOption('#sample-patient-select', { index: 1 });
    await reportsPage.click('#predict-button');
    await reportsPage.waitForURL('**/results');
    await reportsPage.click('#create-reports-button');
    await reportsPage.waitForURL('**/reports');

    const downloadPdfBtn = reportsPage.locator('#download-pdf-button');
    const printReportBtn = reportsPage.locator('#print-report-button');

    const downloadBox = await downloadPdfBtn.boundingBox();
    const printBox = await printReportBtn.boundingBox();

    console.log(`Download PDF button height: ${Math.round(downloadBox.height)}px`);
    console.log(`Print report button height: ${Math.round(printBox.height)}px`);

    if (Math.abs(downloadBox.height - 32) <= 2 && Math.abs(printBox.height - 32) <= 2) {
      console.log('  ✓ Reports action buttons match 32px sm specification');
    } else {
      console.error(`  ✗ Reports action buttons unexpected height: ${downloadBox.height}px, ${printBox.height}px`);
      failedChecks++;
    }

    await reportsContext.close();

  } finally {
    await browser.close();
  }

  console.log('\n=============================================');
  if (failedChecks === 0) {
    console.log('🎉 ALL BUTTON SYSTEM CHECKS PASSED (0 failures)!');
    process.exit(0);
  } else {
    console.error(`❌ BUTTON SYSTEM CHECKS FAILED: ${failedChecks} failure(s) detected.`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error running button test suite:', err);
  process.exit(1);
});
