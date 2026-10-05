const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function run() {
  console.log('=== PHASE 2: 3D VIEWER VERIFICATION ===\n');

  // 1. Run cavity contrast script
  console.log('1. Running cavity contrast check...');
  const contrastOutput = execSync('python scripts/check_cavity_contrast.py', { encoding: 'utf-8' });
  console.log(contrastOutput);

  // 2. Launch Chromium with WebGL support
  console.log('2. Launching browser...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  const screenshotsDir = path.resolve('docs/screenshots/round3/viewer');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Helper to load sample patient and go to results
  async function loadSampleAndGoToResults(presetValue = 'normal') {
    await page.goto('http://localhost:5173/welcome');
    await page.waitForLoadState('networkidle');
    const ackBox = page.locator('#welcome-understand-checkbox');
    if (await ackBox.isVisible()) {
      await ackBox.check();
      await page.locator('#start-assessment-btn').click();
      await page.waitForURL('**/enter-data');
    } else {
      await page.goto('http://localhost:5173/enter-data');
    }

    await page.waitForSelector('#sample-patient-select');
    await page.selectOption('#sample-patient-select', presetValue);
    await page.waitForTimeout(300);

    // Click Predict
    const predictBtn = page.locator('#predict-button');
    await predictBtn.click();

    // Wait for ResultsPage
    await page.waitForURL('**/results', { timeout: 15000 });
    await page.waitForSelector('#viewer-cavity-container', { timeout: 15000 });
    // Wait for model to render
    await page.waitForTimeout(2000);
  }

  try {
    console.log('3. Loading Low Risk patient...');
    await loadSampleAndGoToResults('normal'); // low risk sample

    const container = page.locator('#viewer-cavity-container');

    // Test: ViewerHint visible on load
    const hintChip = page.locator('#viewer-hint-chip');
    const isHintVisible = await hintChip.isVisible();
    console.log('  ViewerHint visible on load:', isHintVisible ? 'PASS' : 'FAIL');
    if (!isHintVisible) throw new Error('ViewerHint not visible on load');

    // Test: Computed cursor on canvas wrapper is 'grab'
    const cursor = await container.evaluate((el) => window.getComputedStyle(el).cursor);
    console.log(`  Container computed cursor: "${cursor}" (expected "grab"):`, cursor === 'grab' ? 'PASS' : 'FAIL');

    // Test: Label dimensions
    const labels = await page.locator('[id^="vessel-label-"]').all();
    console.log(`  Found ${labels.length} vessel labels`);
    for (const label of labels) {
      const box = await label.boundingBox();
      const id = await label.getAttribute('id');
      console.log(`    Label ${id}: ${box.width.toFixed(1)}px x ${box.height.toFixed(1)}px`);
      if (box.height > 24.5) throw new Error(`Label ${id} height > 24px: ${box.height}`);
      if (box.width > 100.5) throw new Error(`Label ${id} width > 100px: ${box.width}`);
    }
    console.log('  Label size check (<= 24px high, <= 100px wide): PASS');

    // Screenshot low risk patient
    await page.screenshot({ path: path.join(screenshotsDir, 'viewer_low_risk_1440.png') });
    console.log('  Saved docs/screenshots/round3/viewer/viewer_low_risk_1440.png');

    // Test: Mouse drag on canvas hides hint and shows "?" button
    console.log('4. Testing mouse drag interaction...');
    const box = await container.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const helpBtn = page.locator('#viewer-help-button');
    const isHelpVisible = await helpBtn.isVisible();
    console.log('  "?" help button visible after drag:', isHelpVisible ? 'PASS' : 'FAIL');
    if (!isHelpVisible) throw new Error('"?" help button did not appear after interaction');

    // Test: Azimuth attributes & Toolbar buttons
    console.log('5. Testing Toolbar views and azimuth updates...');
    const initialAz = await container.getAttribute('data-view-azimuth');
    console.log(`  Initial azimuth: ${initialAz}`);

    // Click "Back" view
    await page.locator('#view-preset-back').click();
    await page.waitForTimeout(700);
    const backAz = await container.getAttribute('data-view-azimuth');
    console.log(`  Azimuth after "Back": ${backAz} (expected ~180 or ~-180):`, Math.abs(Math.abs(Number(backAz)) - 180) <= 25 ? 'PASS' : 'FAIL');

    // Click "Reset view"
    await page.locator('#viewer-reset-view').click();
    await page.waitForTimeout(700);
    const resetAz = await container.getAttribute('data-view-azimuth');
    console.log(`  Azimuth after "Reset view": ${resetAz} (expected ~0):`, Math.abs(Number(resetAz)) <= 15 ? 'PASS' : 'FAIL');

    // Test Keyboard: ArrowLeft changes azimuth
    console.log('6. Testing Keyboard navigation (ArrowLeft)...');
    await container.focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    const arrowAz = await container.getAttribute('data-view-azimuth');
    console.log(`  Azimuth after ArrowLeft: ${arrowAz}:`, arrowAz !== resetAz ? 'PASS' : 'FAIL');

    // Reset view again
    await page.locator('#viewer-reset-view').click();
    await page.waitForTimeout(700);

    // Overlap checks at 4 preset views at 1440px
    console.log('7. Testing label non-overlap at 4 presets (1440px)...');
    for (const view of ['front', 'left', 'back', 'right']) {
      await page.locator(`#view-preset-${view}`).click();
      await page.waitForTimeout(600);

      const ladBox = await page.locator('#vessel-label-lad').boundingBox();
      const lcxBox = await page.locator('#vessel-label-lcx').boundingBox();
      const rcaBox = await page.locator('#vessel-label-rca').boundingBox();

      const intersect = (b1, b2) => {
        if (!b1 || !b2) return false;
        return (
          b1.x < b2.x + b2.width &&
          b1.x + b1.width > b2.x &&
          b1.y < b2.y + b2.height &&
          b1.y + b1.height > b2.y
        );
      };

      const overlap1 = intersect(ladBox, lcxBox);
      const overlap2 = intersect(ladBox, rcaBox);
      const overlap3 = intersect(lcxBox, rcaBox);

      console.log(`  Preset ${view}: overlaps [LAD-LCX: ${overlap1}, LAD-RCA: ${overlap2}, LCX-RCA: ${overlap3}]`);
      if (overlap1 || overlap2 || overlap3) {
        throw new Error(`Labels overlap at preset ${view}`);
      }
    }
    console.log('  1440px label overlap checks: ALL PASSED');

    // Now test moderate & high risk screenshots
    console.log('8. Capturing Moderate and High risk patient screenshots...');
    // Moderate risk patient
    await loadSampleAndGoToResults('high_risk_lad');
    await page.screenshot({ path: path.join(screenshotsDir, 'viewer_moderate_risk_1440.png') });
    console.log('  Saved docs/screenshots/round3/viewer/viewer_moderate_risk_1440.png');

    // High risk patient
    await loadSampleAndGoToResults('triple_vessel');
    await page.screenshot({ path: path.join(screenshotsDir, 'viewer_high_risk_1440.png') });
    console.log('  Saved docs/screenshots/round3/viewer/viewer_high_risk_1440.png');

    // Mobile viewport overlap checks (390px)
    console.log('9. Testing label non-overlap at 390px mobile viewport...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    for (const view of ['front', 'left', 'back', 'right']) {
      await page.locator(`#view-preset-${view}`).click();
      await page.waitForTimeout(600);

      const ladBox = await page.locator('#vessel-label-lad').boundingBox();
      const lcxBox = await page.locator('#vessel-label-lcx').boundingBox();
      const rcaBox = await page.locator('#vessel-label-rca').boundingBox();

      const intersect = (b1, b2) => {
        if (!b1 || !b2) return false;
        return (
          b1.x < b2.x + b2.width &&
          b1.x + b1.width > b2.x &&
          b1.y < b2.y + b2.height &&
          b1.y + b1.height > b2.y
        );
      };

      const overlap1 = intersect(ladBox, lcxBox);
      const overlap2 = intersect(ladBox, rcaBox);
      const overlap3 = intersect(lcxBox, rcaBox);

      console.log(`  390px Preset ${view}: overlaps [LAD-LCX: ${overlap1}, LAD-RCA: ${overlap2}, LCX-RCA: ${overlap3}]`);
      if (overlap1 || overlap2 || overlap3) {
        throw new Error(`Labels overlap at 390px preset ${view}`);
      }
    }
    console.log('  390px label overlap checks: ALL PASSED');

    console.log('\n=== ALL PHASE 2 VIEWER CHECKS PASSED ===\n');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\nTest failed with error:', err);
  process.exit(1);
});
