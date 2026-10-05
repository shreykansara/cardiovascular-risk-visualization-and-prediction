const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function run() {
  const outputDir = path.resolve('docs/screenshots/round4/viewer-before');
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

  console.log('Navigating to welcome page...');
  await page.goto('http://localhost:8080/welcome');
  await page.waitForLoadState('networkidle');

  const ackBox = page.locator('#welcome-understand-checkbox');
  if (await ackBox.isVisible()) {
    await ackBox.check();
    await page.locator('#start-assessment-btn').click();
    await page.waitForURL('**/enter-data');
  } else {
    await page.goto('http://localhost:8080/enter-data');
  }

  console.log('Selecting sample patient (normal)...');
  await page.waitForSelector('#sample-patient-select');
  await page.selectOption('#sample-patient-select', 'normal');
  await page.waitForTimeout(500);

  console.log('Clicking predict...');
  const predictBtn = page.locator('#predict-button');
  await predictBtn.click();

  await page.waitForURL('**/results', { timeout: 15000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  console.log('Results loaded. Waiting for 3D model...');
  await page.waitForTimeout(3000);

  const container = page.locator('#viewer-cavity-container');

  const views = ['Front', 'Left', 'Back', 'Right'];
  for (const view of views) {
    const btn = page.locator(`#view-preset-${view.toLowerCase()}`);
    if (await btn.isVisible()) {
      await btn.click();
    }
    await page.waitForTimeout(1000);
    const filename = `${view.toLowerCase()}.png`;
    const fullPath = path.join(outputDir, filename);
    await container.screenshot({ path: fullPath });
    console.log(`Saved screenshot: ${fullPath}`);
  }

  await browser.close();
  console.log('Task 0.3 capture complete.');
}

run().catch((err) => {
  console.error('Error capturing viewer before:', err);
  process.exit(1);
});
