import { chromium } from 'playwright-core';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

const BUDGETS = {
  landing: 70,
  welcome: 45,
  patientData: 80,
  results: 60,
  reportsChrome: 25,
};

function countWords(text) {
  if (!text) return 0;
  const cleaned = text
    .replace(/[^\w\s-]/g, ' ')
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const results = {};

  // 1. Landing Page (/)
  console.log('Measuring Landing (/)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const landingText = await page.evaluate(() => {
    // Exclude nav and footer
    const clones = document.body.cloneNode(true);
    clones.querySelectorAll('nav, header, footer, [role="contentinfo"]').forEach(el => el.remove());
    return clones.innerText;
  });
  results.landing = {
    words: countWords(landingText),
    budget: BUDGETS.landing,
    text: landingText.trim().replace(/\s+/g, ' '),
  };

  // 2. Welcome Page (/welcome)
  console.log('Measuring Welcome (/welcome)...');
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle' });
  const welcomeText = await page.evaluate(() => {
    const clones = document.body.cloneNode(true);
    clones.querySelectorAll('nav, header, footer, [role="contentinfo"]').forEach(el => el.remove());
    return clones.innerText;
  });
  results.welcome = {
    words: countWords(welcomeText),
    budget: BUDGETS.welcome,
    text: welcomeText.trim().replace(/\s+/g, ' '),
  };

  // Click "Lower risk sample" to enter data with preset and accepted disclaimer
  console.log('Proceeding to Patient Data via sample preset...');
  const sampleBtn = await page.$('button:has-text("Lower risk sample")');
  if (sampleBtn) {
    await sampleBtn.click();
    await page.waitForTimeout(600);
  } else {
    const checkbox = await page.$('#welcome-understand-checkbox');
    if (checkbox) await checkbox.check();
    const startBtn = await page.$('#start-assessment-btn');
    if (startBtn) await startBtn.click();
    await page.waitForTimeout(600);
  }

  // 3. Patient Data (/enter-data)
  console.log('Measuring Patient Data (/enter-data)...');
  const patientDataText = await page.evaluate(() => {
    const clones = document.body.cloneNode(true);
    // Exclude nav, footer, labels, units, captions, canvas, table cells
    clones.querySelectorAll(
      'nav, header, footer, [role="contentinfo"], label, th, td, canvas, [data-caption], [data-unit]'
    ).forEach(el => el.remove());

    // Also remove caption elements inside fields (row 3 captions)
    clones.querySelectorAll('span, p, div').forEach(el => {
      const text = el.innerText?.trim() || '';
      if (text.startsWith('Usual range:') || text.startsWith('Outside usual range') || text.startsWith('Typical range')) {
        el.remove();
      }
    });

    return clones.innerText;
  });
  results.patientData = {
    words: countWords(patientDataText),
    budget: BUDGETS.patientData,
    text: patientDataText.trim().replace(/\s+/g, ' '),
  };

  // 4. Results (/results)
  console.log('Measuring Results (/results)...');
  const predictBtn = await page.$('#predict-button, button:has-text("Calculate risk")');
  if (predictBtn) {
    await predictBtn.click();
    // Wait for animation and results page to load
    await page.waitForSelector('#create-reports-button', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
  } else {
    await page.goto(`${BASE_URL}/results`, { waitUntil: 'networkidle' });
  }

  const resultsText = await page.evaluate(() => {
    const clones = document.body.cloneNode(true);
    // Exclude nav, footer, canvas, table cells
    clones.querySelectorAll(
      'nav, header, footer, [role="contentinfo"], canvas, [data-canvas], table, th, td'
    ).forEach(el => el.remove());
    return clones.innerText;
  });
  results.results = {
    words: countWords(resultsText),
    budget: BUDGETS.results,
    text: resultsText.trim().replace(/\s+/g, ' '),
  };

  // 5. Reports Chrome (/reports)
  console.log('Measuring Reports Chrome (/reports)...');
  const createReportsBtn = await page.$('#create-reports-button');
  if (createReportsBtn) {
    await createReportsBtn.click();
    await page.waitForSelector('.app-chrome', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
  } else {
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
  }

  const reportsChromeText = await page.evaluate(() => {
    const chrome = document.querySelector('.app-chrome.no-print') || document.querySelector('.app-chrome');
    if (chrome) {
      return chrome.innerText;
    }
    const clones = document.body.cloneNode(true);
    clones.querySelectorAll(
      'nav, header, footer, [role="contentinfo"], [data-report-content], .report-view, article, #print-root'
    ).forEach(el => el.remove());
    return clones.innerText;
  });
  results.reportsChrome = {
    words: countWords(reportsChromeText),
    budget: BUDGETS.reportsChrome,
    text: reportsChromeText.trim().replace(/\s+/g, ' '),
  };

  await browser.close();

  console.log('\n================ WORD COUNT REPORT (1440px) ================');
  let allPass = true;
  for (const [key, data] of Object.entries(results)) {
    const pass = data.words <= data.budget;
    if (!pass) allPass = false;
    const badge = pass ? 'PASS' : 'FAIL';
    console.log(
      `[${badge}] ${key.padEnd(15)} : ${String(data.words).padStart(3)} / ${String(data.budget).padStart(3)} words`
    );
    console.log(`       Preview: "${data.text.slice(0, 100)}..."`);
  }
  console.log('============================================================');

  return { results, allPass };
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
