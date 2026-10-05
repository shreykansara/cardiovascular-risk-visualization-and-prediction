const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function run() {
  const outputDir = path.resolve('docs/screenshots/round4/viewer-baseline');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to baseline welcome page on http://localhost:5174...');
  await page.goto('http://localhost:5174/welcome');
  await page.waitForLoadState('networkidle');

  const ackBox = page.locator('#welcome-acknowledgement');
  if (await ackBox.isVisible()) {
    await ackBox.check();
    await page.locator('#start-wizard-button').click();
    await page.waitForURL('**/enter-data');
  } else {
    await page.goto('http://localhost:5174/enter-data');
  }

  console.log('Selecting sample patient (normal)...');
  const sampleSelect = page.locator('select:has(option[value="normal"])');
  await sampleSelect.waitFor({ state: 'visible' });
  await sampleSelect.selectOption('normal');
  await page.waitForTimeout(500);

  console.log('Clicking predict...');
  const predictBtn = page.locator('#predict-button');
  await predictBtn.click();

  await page.waitForURL('**/results', { timeout: 15000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  console.log('Results loaded. Waiting for 3D model...');
  await page.waitForTimeout(3000);

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();

  // Helper to drag
  async function dragHorizontal(dx) {
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dx, startY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
  }

  // 1. Front view (default)
  console.log('Capturing Front view...');
  await canvas.screenshot({ path: path.join(outputDir, 'front.png') });

  // 2. Left view (drag roughly 90 deg)
  console.log('Capturing Left view...');
  await dragHorizontal(175);
  await canvas.screenshot({ path: path.join(outputDir, 'left.png') });

  // 3. Back view (drag another 90 deg)
  console.log('Capturing Back view...');
  await dragHorizontal(175);
  await canvas.screenshot({ path: path.join(outputDir, 'back.png') });

  // 4. Right view (drag another 90 deg)
  console.log('Capturing Right view...');
  await dragHorizontal(175);
  await canvas.screenshot({ path: path.join(outputDir, 'right.png') });

  await browser.close();
  console.log('Task 0.4 capture complete.');
}

run().catch((err) => {
  console.error('Error capturing viewer baseline:', err);
  process.exit(1);
});
