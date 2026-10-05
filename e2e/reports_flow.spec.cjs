/**
 * E2E Playwright Tests for Deterministic Reports Flow (Task 1.8)
 *
 * Verifies:
 * 1. /reports shows both tabs (Clinician report and Patient report)
 * 2. The status line reads "Prepared at {HH:MM} from the entered values."
 * 3. The ONLY API call made on /reports is POST /api/v1/reports
 * 4. Switching tabs makes zero network calls
 * 5. Returning to /reports with unchanged inputs makes zero network calls (cached result)
 */

const { chromium } = require('playwright-core');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function run() {
  console.log('=== REPORTS FLOW VERIFICATION ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Track all network requests
  const apiCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/')) {
      apiCalls.push({ url, method: req.method() });
    }
  });

  console.log('1. Navigating through Welcome to Enter Data...');
  await page.goto(`${BASE_URL}/welcome`);
  await page.waitForLoadState('networkidle');

  await page.locator('#welcome-understand-checkbox').check();
  await page.locator('#start-assessment-btn').click();
  await page.waitForURL('**/enter-data');

  console.log('2. Selecting sample patient and predicting...');
  await page.waitForSelector('#sample-patient-select');
  await page.selectOption('#sample-patient-select', 'normal');
  await page.waitForTimeout(300);

  await page.locator('#predict-button').click();
  await page.waitForURL('**/results');
  await page.waitForTimeout(1000);

  // Clear tracked API calls before navigating to reports
  apiCalls.length = 0;

  console.log('3. Navigating to /reports...');
  await page.locator('#create-reports-button').click();
  await page.waitForURL('**/reports');

  // Wait for report sheet to render
  await page.locator('#printable-report-sheet').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(500);

  // 1. Verify tabs exist
  const clinicianTab = page.locator('button[role="tab"]', { hasText: 'Clinician report' });
  const patientTab = page.locator('button[role="tab"]', { hasText: 'Patient report' });
  if (!(await clinicianTab.isVisible()) || !(await patientTab.isVisible())) {
    throw new Error('Reports page does not show both tabs!');
  }
  console.log('  -> [PASS] Both tabs visible on /reports');

  // 2. Verify status line reads "Prepared at {HH:MM} from the entered values."
  const statusLineText = await page.textContent('.app-chrome.no-print p, .app-chrome.no-print div:has-text("Prepared at")');
  console.log(`  -> Status line text: "${statusLineText.trim()}"`);
  if (!/Prepared at \d{2}:\d{2} from the entered values\./.test(statusLineText)) {
    throw new Error(`Status line "${statusLineText}" does not match required format "Prepared at {HH:MM} from the entered values."`);
  }
  console.log('  -> [PASS] Status line correctly formatted');

  // 3. Verify ONLY API call made on /reports is POST /api/v1/reports
  console.log(`  -> API calls captured on /reports:`, apiCalls);
  const nonReportCalls = apiCalls.filter((c) => !c.url.includes('/api/v1/reports') || c.method !== 'POST');
  if (nonReportCalls.length > 0) {
    throw new Error(`Unexpected API calls made on /reports: ${JSON.stringify(nonReportCalls)}`);
  }
  const reportCalls = apiCalls.filter((c) => c.url.includes('/api/v1/reports') && c.method === 'POST');
  if (reportCalls.length !== 1) {
    throw new Error(`Expected exactly 1 POST /api/v1/reports call, but found ${reportCalls.length}`);
  }
  console.log('  -> [PASS] Exactly one POST /api/v1/reports call made on /reports');

  // 4. Switching tabs makes zero network calls
  apiCalls.length = 0;
  await patientTab.click();
  await page.waitForTimeout(300);
  await clinicianTab.click();
  await page.waitForTimeout(300);
  if (apiCalls.length !== 0) {
    throw new Error(`Tab switching triggered network calls: ${JSON.stringify(apiCalls)}`);
  }
  console.log('  -> [PASS] Tab switching triggered zero network calls');

  // 5. Returning to /reports with unchanged inputs makes zero network calls
  apiCalls.length = 0;
  // Go back to results
  await page.goto(`${BASE_URL}/results`);
  await page.waitForTimeout(500);
  // Return to reports
  await page.locator('#create-reports-button').click();
  await page.waitForURL('**/reports');
  await page.locator('#printable-report-sheet').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  if (apiCalls.length !== 0) {
    throw new Error(`Returning to /reports with unchanged inputs triggered network calls: ${JSON.stringify(apiCalls)}`);
  }
  console.log('  -> [PASS] Returning to /reports with unchanged inputs used cached result with zero network calls');

  await browser.close();
  console.log('\n=== ALL REPORTS E2E TESTS PASSED ===');
}

run().catch((err) => {
  console.error('[FAIL] Reports flow test error:', err);
  process.exit(1);
});
