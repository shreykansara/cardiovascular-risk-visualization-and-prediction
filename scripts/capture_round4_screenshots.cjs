const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots', 'round4', 'full-pages');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Capturing full-page screenshots at 1440px and 390px in Paper & Monitor modes...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const resolutions = [
    { name: '1440px', width: 1440, height: 900 },
    { name: '390px', width: 390, height: 844 },
  ];

  const themes = [
    { name: 'paper', themeVal: 'light' },
    { name: 'monitor', themeVal: 'dark' },
  ];

  for (const res of resolutions) {
    for (const th of themes) {
      console.log(`\nCapturing ${res.name} in ${th.name} theme...`);
      const context = await browser.newContext({
        viewport: { width: res.width, height: res.height },
      });
      const page = await context.newPage();

      // 1. Welcome Page
      await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle' });
      await page.selectOption('#nav-theme-select', th.themeVal);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${res.name}_${th.name}_01_welcome.png`),
        fullPage: true,
      });

      // 2. Data Entry Page
      await page.click('#welcome-understand-checkbox');
      await page.click('#start-assessment-btn');
      await page.waitForURL('**/enter-data');
      await page.waitForSelector('#sample-patient-select');
      await page.selectOption('#sample-patient-select', { index: 1 });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${res.name}_${th.name}_02_enter_data.png`),
        fullPage: true,
      });

      // 3. Results Page
      await page.click('#predict-button');
      await page.waitForURL('**/results', { timeout: 15000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${res.name}_${th.name}_03_results.png`),
        fullPage: true,
      });

      // 4. Reports Page (Clinician)
      await page.click('#create-reports-button');
      await page.waitForURL('**/reports', { timeout: 15000 });
      await page.waitForSelector('#printable-report-sheet', { timeout: 15000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${res.name}_${th.name}_04_reports_clinician.png`),
        fullPage: true,
      });

      // 5. Reports Page (Patient)
      await page.click('#tab-patient');
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${res.name}_${th.name}_05_reports_patient.png`),
        fullPage: true,
      });

      // 6. Design System Page
      await page.goto(`${BASE_URL}/design-system`, { waitUntil: 'networkidle' });
      await page.selectOption('#nav-theme-select', th.themeVal);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${res.name}_${th.name}_06_design_system.png`),
        fullPage: true,
      });

      await context.close();
    }
  }

  await browser.close();
  console.log(`\nSuccessfully captured all screenshots to ${OUTPUT_DIR}`);
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
