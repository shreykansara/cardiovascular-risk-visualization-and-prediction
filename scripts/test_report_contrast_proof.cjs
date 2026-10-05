const { chromium } = require('playwright-core');

function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function parseRgb(rgbStr) {
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function getContrast(rgb1, rgb2) {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

async function runProof() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

  console.log(`\n==================================================================`);
  console.log(`TASK 1.1: PROVING THE CAUSE - REPORT SHEET RISK COLOURS CONTRAST`);
  console.log(`==================================================================\n`);

  for (const theme of ['light', 'dark']) {
    const themeName = theme === 'light' ? 'Paper (Light)' : 'Monitor (Dark)';
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript((th) => {
      localStorage.setItem('perfusion3d-theme', th);
    }, theme);

    const page = await context.newPage();

    // 1. Fill sample patient and navigate to reports
    await page.goto(`${BASE_URL}/welcome`);
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Start/i }).click();
    await page.waitForURL('**/enter-data');
    await page.locator('select').filter({ hasText: /sample patient/i }).first().selectOption('normal');
    await page.getByRole('button', { name: /^Predict$/i }).click();
    await page.waitForURL('**/results');
    await page.getByRole('button', { name: /Create reports/i }).click();
    await page.waitForURL('**/reports');
    await page.waitForSelector('#printable-report-sheet, article', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const data = await page.evaluate(() => {
      const sheet = document.querySelector('#printable-report-sheet') || document.querySelector('article');
      const sheetBg = window.getComputedStyle(sheet).backgroundColor;

      // Extract colors of CSS variables active in this theme
      const style = window.getComputedStyle(document.documentElement);
      const low = style.getPropertyValue('--low').trim();
      const mod = style.getPropertyValue('--mod').trim();
      const high = style.getPropertyValue('--high').trim();
      const ink = style.getPropertyValue('--ink').trim();

      // Find rendered risk dots in the report sheet
      const dots = Array.from(sheet.querySelectorAll('span')).filter(s => {
        const cs = window.getComputedStyle(s);
        return cs.width === '8px' && cs.height === '8px' && (cs.borderRadius === '50%' || cs.borderRadius === '4px');
      });

      const dotBgs = dots.map(d => window.getComputedStyle(d).backgroundColor);

      return {
        sheetBg,
        tokens: { low, mod, high, ink },
        dotBgs,
      };
    });

    const sheetRgb = parseRgb(data.sheetBg);
    console.log(`>>> Theme: ${themeName}`);
    console.log(`  Report Sheet Computed Background: ${data.sheetBg} (rgb: [${sheetRgb.join(', ')}])`);
    console.log(`  Active Theme Tokens:`);
    console.log(`    --low:  ${data.tokens.low}`);
    console.log(`    --mod:  ${data.tokens.mod}`);
    console.log(`    --high: ${data.tokens.high}`);
    console.log(`    --ink:  ${data.tokens.ink}`);

    // Compute contrast of these tokens directly against the sheet background
    // Helper to evaluate in page
    const computedRgb = await page.evaluate(() => {
      const d = document.createElement('div');
      document.body.appendChild(d);
      const getRgb = (prop) => {
        d.style.color = `var(${prop})`;
        return window.getComputedStyle(d).color;
      };
      const res = {
        low: getRgb('--low'),
        mod: getRgb('--mod'),
        high: getRgb('--high'),
        ink: getRgb('--ink'),
      };
      d.remove();
      return res;
    });

    const lowRgb = parseRgb(computedRgb.low);
    const modRgb = parseRgb(computedRgb.mod);
    const highRgb = parseRgb(computedRgb.high);
    const inkRgb = parseRgb(computedRgb.ink);

    const lowContrast = getContrast(lowRgb, sheetRgb);
    const modContrast = getContrast(modRgb, sheetRgb);
    const highContrast = getContrast(highRgb, sheetRgb);
    const inkContrast = getContrast(inkRgb, sheetRgb);

    console.log(`\n  WCAG Contrast Against White Sheet (${data.sheetBg}):`);
    console.log(`    Low    (${computedRgb.low}):  ${lowContrast.toFixed(2)}:1  ${lowContrast >= 3.0 ? '[PASS ≥ 3:1]' : '[FAIL < 3:1 (NON-TEXT VIOLATION)]'}`);
    console.log(`    Mod    (${computedRgb.mod}): ${modContrast.toFixed(2)}:1  ${modContrast >= 3.0 ? '[PASS ≥ 3:1]' : '[FAIL < 3:1 (NON-TEXT VIOLATION)]'}`);
    console.log(`    High   (${computedRgb.high}): ${highContrast.toFixed(2)}:1  ${highContrast >= 3.0 ? '[PASS ≥ 3:1]' : '[FAIL < 3:1 (NON-TEXT VIOLATION)]'}`);
    console.log(`    Ink    (${computedRgb.ink}): ${inkContrast.toFixed(2)}:1  ${inkContrast >= 4.5 ? '[PASS ≥ 4.5:1]' : '[FAIL < 4.5:1 (TEXT VIOLATION)]'}`);
    console.log(`\n------------------------------------------------------------------\n`);

    await context.close();
  }

  await browser.close();
}

runProof().catch(console.error);
