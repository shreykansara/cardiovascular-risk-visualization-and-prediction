/**
 * Regression Test: Sheet Tokens Specification (Task 2.2)
 * In Monitor (Dark) mode, verifies that for all 4 report states:
 * 1. error
 * 2. loading
 * 3. ready clinician
 * 4. ready patient
 * Every element inside .sheet and #print-root has computed text, background,
 * and border colors that strictly belong to the set of --s-* token values
 * read dynamically from tokens.css. In addition, every text pair reaches >= 4.5:1.
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const TOKENS_PATH = path.resolve(__dirname, '..', 'apps', 'web', 'src', 'design', 'tokens.css');

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16),
    };
  }
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relLum({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(c1, c2) {
  const l1 = relLum(c1);
  const l2 = relLum(c2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

function loadSheetTokens() {
  const content = fs.readFileSync(TOKENS_PATH, 'utf-8');
  const tokenRegex = /--s-([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  const tokens = {};
  let match;
  while ((match = tokenRegex.exec(content)) !== null) {
    const name = `--s-${match[1]}`;
    const rawVal = match[2].trim();
    if (rawVal.startsWith('#')) {
      tokens[name] = hexToRgb(rawVal);
    }
  }
  return tokens;
}

async function inspectSheetState(page, stateName, sheetTokens) {
  console.log(`\n--- Inspecting State: ${stateName} (Theme: dark / Monitor) ---`);

  const allowedRgbs = Object.entries(sheetTokens).map(([name, rgb]) => ({
    name,
    ...rgb,
  }));

  const results = await page.evaluate(({ allowedRgbs }) => {
    function parseRgb(str) {
      if (!str || str === 'transparent' || str === 'none') return null;
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (a === 0) return null;
      return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10), a };
    }

    function isMatch(c, list, tol = 2) {
      if (!c) return true; // transparent is allowed
      return list.some(item => 
        Math.abs(item.r - c.r) <= tol &&
        Math.abs(item.g - c.g) <= tol &&
        Math.abs(item.b - c.b) <= tol
      );
    }

    const container = document.querySelector('#print-root') || document.querySelector('.sheet');
    if (!container) return { error: 'No #print-root or .sheet found' };

    const elements = [container, ...container.querySelectorAll('*')];
    const colorViolations = [];
    const textContrastPairs = [];

    for (const el of elements) {
      // Ignore hidden or 0-size elements
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        continue;
      }
      if (rect.width === 0 && rect.height === 0) continue;

      const tag = el.tagName.toLowerCase();
      const hasDirectText = Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);

      // Check text color if element has direct text
      const fgRgb = parseRgb(style.color);
      if (hasDirectText && fgRgb) {
        if (!isMatch(fgRgb, allowedRgbs)) {
          colorViolations.push({
            type: 'color',
            tag,
            text: el.textContent.trim().slice(0, 30),
            computed: style.color,
          });
        }

        // Measure effective background for contrast
        let curr = el;
        let bgRgb = null;
        while (curr && curr !== document.body) {
          const s = window.getComputedStyle(curr);
          const parsed = parseRgb(s.backgroundColor);
          if (parsed && parsed.a > 0.8) {
            bgRgb = parsed;
            break;
          }
          curr = curr.parentElement;
        }
        if (!bgRgb) {
          bgRgb = { r: 255, g: 255, b: 255 }; // default sheet background is white
        }

        textContrastPairs.push({
          tag,
          text: el.textContent.trim().slice(0, 30),
          fg: fgRgb,
          bg: bgRgb,
        });
      }

      // Check background-color
      const bgRgb = parseRgb(style.backgroundColor);
      if (bgRgb && bgRgb.a > 0.05) {
        if (!isMatch(bgRgb, allowedRgbs)) {
          colorViolations.push({
            type: 'backgroundColor',
            tag,
            computed: style.backgroundColor,
          });
        }
      }

      // Check border colors
      const borderProps = ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'];
      for (const prop of borderProps) {
        const w = parseFloat(style[`${prop}Width`]);
        const s = style[`${prop}Style`];
        if (w > 0 && s !== 'none' && s !== 'hidden') {
          const bColor = parseRgb(style[`${prop}Color`]);
          if (bColor && !isMatch(bColor, allowedRgbs)) {
            colorViolations.push({
              type: `${prop}Color`,
              tag,
              computed: style[`${prop}Color`],
            });
          }
        }
      }
    }

    return { colorViolations, textContrastPairs };
  }, { allowedRgbs });

  if (results.error) {
    throw new Error(results.error);
  }

  // Check contrast pairs
  const contrastViolations = [];
  for (const pair of results.textContrastPairs) {
    const cr = contrastRatio(pair.fg, pair.bg);
    if (cr < 4.5) {
      contrastViolations.push({
        text: pair.text,
        tag: pair.tag,
        ratio: cr.toFixed(2),
        fg: `rgb(${pair.fg.r},${pair.fg.g},${pair.fg.b})`,
        bg: `rgb(${pair.bg.r},${pair.bg.g},${pair.bg.b})`,
      });
    }
  }

  console.log(`Audited ${results.textContrastPairs.length} text elements in ${stateName}.`);
  console.log(`Color violations: ${results.colorViolations.length}, Contrast violations: ${contrastViolations.length}`);

  if (results.colorViolations.length > 0) {
    console.error('Color violations detected:', results.colorViolations);
  }
  if (contrastViolations.length > 0) {
    console.error('Contrast violations detected (< 4.5:1):', contrastViolations);
  }

  return {
    colorViolations: results.colorViolations,
    contrastViolations,
  };
}

async function run() {
  const sheetTokens = loadSheetTokens();
  console.log('Loaded --s-* sheet tokens from tokens.css:');
  for (const [k, v] of Object.entries(sheetTokens)) {
    console.log(`  ${k}: rgb(${v.r}, ${v.g}, ${v.b})`);
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  let totalViolations = 0;

  try {
    const page = await context.newPage();
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    console.log('Navigating to Welcome and setting dark mode...');
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');
    await page.selectOption('#nav-theme-select', 'dark');
    await page.waitForTimeout(200);

    // Accept and proceed to enter-data
    await page.locator('#welcome-understand-checkbox').check();
    await page.locator('#start-assessment-btn').click();
    await page.waitForURL('**/enter-data');

    // Select sample patient and predict
    await page.waitForSelector('#sample-patient-select');
    await page.selectOption('#sample-patient-select', 'normal');
    await page.waitForTimeout(300);

    await page.locator('#predict-button').click();
    await page.waitForURL('**/results');
    await page.waitForTimeout(500);

    // 1. Error State: Intercept reports call with 500 before navigating
    console.log('\n[1/4] Intercepting reports call to force Error State...');
    await page.route('**/api/v1/reports', async (route) => {
      await route.fulfill({ status: 500, body: 'Server Error' });
    });

    await page.locator('#create-reports-button').click();
    await page.waitForURL('**/reports');
    await page.waitForSelector('.sheet:has-text("The reports could not be prepared.")', { timeout: 15000 });

    const errorRes = await inspectSheetState(page, 'Error State', sheetTokens);
    totalViolations += errorRes.colorViolations.length + errorRes.contrastViolations.length;

    // 2. Loading State: Delay next response by 3s and click "Try again"
    console.log('\n[2/4] Delaying report response to test Loading State...');
    await page.unroute('**/api/v1/reports');
    await page.route('**/api/v1/reports', async (route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });

    // Click "Try again"
    await page.click('#try-again-button');
    await page.waitForSelector('.sheet[aria-busy="true"]', { timeout: 5000 });

    const loadingRes = await inspectSheetState(page, 'Loading State', sheetTokens);
    totalViolations += loadingRes.colorViolations.length + loadingRes.contrastViolations.length;

    // 3. Ready Clinician State: Wait for report to arrive
    console.log('\n[3/4] Waiting for reports to finish for Ready Clinician State...');
    await page.waitForSelector('#printable-report-sheet h1', { timeout: 15000 });
    await page.unroute('**/api/v1/reports');

    const clinicianRes = await inspectSheetState(page, 'Ready Clinician State', sheetTokens);
    totalViolations += clinicianRes.colorViolations.length + clinicianRes.contrastViolations.length;

    // 4. Ready Patient State
    console.log('\n[4/4] Testing Ready Patient State...');
    await page.click('#tab-patient');
    await page.waitForTimeout(300);

    const patientRes = await inspectSheetState(page, 'Ready Patient State', sheetTokens);
    totalViolations += patientRes.colorViolations.length + patientRes.contrastViolations.length;

  } finally {
    await browser.close();
  }

  console.log(`\n=================================================`);
  console.log(`Regression Test Completed. Total Violations: ${totalViolations}`);
  console.log(`=================================================`);

  if (totalViolations > 0) {
    process.exit(1);
  } else {
    console.log('[PASS] All sheet states conform strictly to --s-* tokens and 4.5:1 contrast in Monitor mode!');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
