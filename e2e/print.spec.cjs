/**
 * Automated Print & PDF Conformance Test (Phase 6 / Task 6.5)
 * 
 * Verifies that:
 * 1. Under media 'print', every .app-chrome and .no-print element has display: none
 * 2. Background image of root/body is 'none'
 * 3. A4 PDF generated has no navbar or chrome text ("Regenerate", "Download PDF", "Theme", "New assessment", "Step 4 of 4", "Model information", "Skip to content", "Back")
 * 4. Report title and mandatory disclaimer appear exactly once in the PDF text
 * 5. Rasterised top 10mm band is completely white (no stray navbar)
 * 6. Contrast for risk dots (>= 3:1) and text (>= 4.5:1) passes on #ffffff
 * 7. Generates and saves 4 sample PDFs to docs/print-samples/
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const sharp = require('sharp');

const PRINT_DIR = path.resolve(__dirname, '..', 'docs', 'print-samples');
if (!fs.existsSync(PRINT_DIR)) {
  fs.mkdirSync(PRINT_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

const FORBIDDEN_PRINT_STRINGS = [
  'Regenerate',
  'Download PDF',
  'Theme',
  'New assessment',
  'Step 4 of 4',
  'Model information',
  'Skip to content',
  'Back',
];

const MANDATORY_DISCLAIMER_SENTENCE =
  'Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation.';

// WCAG relative luminance calculation
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(colorStr) {
  if (!colorStr) return [255, 255, 255];
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) {
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  }
  // Hex
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }
  return [255, 255, 255];
}

async function runPrintTests() {
  console.log('=== Running ECG Paper Print & PDF Conformance Test (Task 6.5) ===');
  console.log(`Target: ${BASE_URL}`);

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.log('Chrome launch failed, trying Edge...');
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // Step 1: Welcome
  console.log('[Print Test] Navigating through flow to generate report data...');
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('#welcome-understand-checkbox').check();
  await page.locator('#start-assessment-btn').click();
  await page.waitForURL('**/enter-data', { timeout: 15000 });

  // Step 2: Load sample patient and predict
  const sampleSelect = page.locator('#sample-patient-select');
  await sampleSelect.waitFor({ state: 'visible', timeout: 10000 });
  await sampleSelect.selectOption({ index: 1 });
  await page.waitForTimeout(500);

  const predictBtn = page.locator('#predict-button');
  await predictBtn.click();
  await page.waitForFunction(() => window.location.pathname.includes('/results'), { timeout: 30000 });

  // Step 3: Create reports
  const createReportsBtn = page.locator('#create-reports-button');
  await createReportsBtn.waitFor({ state: 'visible', timeout: 10000 });
  await createReportsBtn.click();
  await page.waitForFunction(() => window.location.pathname.includes('/reports'), { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Ensure actual report sheet (not skeleton) rendered
  await page.locator('#printable-report-sheet').waitFor({ state: 'visible', timeout: 30000 });
  console.log('[Print Test] Report loaded successfully. Commencing Print evaluation across 4 configurations...\n');

  const themes = ['paper', 'monitor'];
  const tabs = ['clinician', 'patient'];
  const pdfOutputPaths = [];

  for (const theme of themes) {
    for (const tab of tabs) {
      const configName = `${tab} (${theme})`;
      console.log(`--- Testing Configuration: ${configName} ---`);

      // 1. Set theme
      const dataTheme = theme === 'paper' ? 'light' : 'dark';
      await page.evaluate((dt) => {
        document.documentElement.setAttribute('data-theme', dt);
        localStorage.setItem('perfusion3d-theme', dt);
      }, dataTheme);
      await page.waitForTimeout(200);

      // 2. Select tab and wait for content
      if (tab === 'clinician') {
        const tabBtn = page.locator('button[role="tab"]', { hasText: 'Clinician report' });
        await tabBtn.click();
      } else {
        const tabBtn = page.locator('button[role="tab"]', { hasText: 'Patient report' });
        await tabBtn.click();
      }
      await page.locator('#printable-report-sheet').waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForTimeout(500);

      // 3. Emulate print media
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(300);

      // a) Assert every .app-chrome and .no-print element has display: none
      const chromeStatus = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.app-chrome, .no-print, dialog'));
        const failing = [];
        for (const el of elements) {
          const comp = window.getComputedStyle(el);
          if (comp.display !== 'none') {
            failing.push({
              tag: el.tagName,
              className: el.className,
              display: comp.display,
            });
          }
        }
        const rootEl = document.getElementById('root') || document.body;
        const rootBg = window.getComputedStyle(rootEl).backgroundImage;
        const bodyBg = window.getComputedStyle(document.body).backgroundImage;
        return { failing, rootBg, bodyBg };
      });

      if (chromeStatus.failing.length > 0) {
        throw new Error(
          `[FAIL] ${configName}: Visible app-chrome/no-print elements under print media:\n` +
          JSON.stringify(chromeStatus.failing, null, 2)
        );
      }
      if (chromeStatus.rootBg !== 'none' || chromeStatus.bodyBg !== 'none') {
        throw new Error(
          `[FAIL] ${configName}: Background image not 'none' under print media: root=${chromeStatus.rootBg}, body=${chromeStatus.bodyBg}`
        );
      }
      console.log(`  [PASS] Chrome hidden and background-image is 'none'`);

      // b) Generate A4 PDF and extract text
      const pdfFilename = `perfusion3d_${tab}_${theme}.pdf`;
      const pdfPath = path.join(PRINT_DIR, pdfFilename);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        path: pdfPath,
      });
      pdfOutputPaths.push(pdfPath);
      console.log(`  [PDF] Saved: ${pdfPath}`);

      const parser = new PDFParse({ data: pdfBuffer });
      const pdfData = await parser.getText();
      const pdfText = pdfData.text;
      const normalizedText = pdfText.replace(/\s+/g, ' ');

      // Fail if any forbidden string present
      for (const forbidden of FORBIDDEN_PRINT_STRINGS) {
        // Use word boundary with exact case match for UI chrome strings
        const regex = new RegExp(`\\b${forbidden}\\b`);
        if (regex.test(normalizedText)) {
          throw new Error(
            `[FAIL] ${configName}: PDF text contains forbidden chrome string '${forbidden}'`
          );
        }
      }
      console.log(`  [PASS] Zero forbidden chrome strings in PDF text`);

      // Verify report title is present
      const expectedTitle =
        tab === 'clinician'
          ? 'Technical Evaluation'
          : 'Your Heart Health';
      if (!normalizedText.toLowerCase().includes(expectedTitle.toLowerCase())) {
        throw new Error(
          `[FAIL] ${configName}: PDF text missing expected title '${expectedTitle}'`
        );
      }
      console.log(`  [PASS] Report title '${expectedTitle}' present in PDF`);

      // Verify disclaimer sentence appears exactly once
      const normalizedDisclaimer = MANDATORY_DISCLAIMER_SENTENCE.replace(/\s+/g, ' ');
      const disclaimerMatches = normalizedText.split(normalizedDisclaimer).length - 1;
      if (disclaimerMatches !== 1) {
        throw new Error(
          `[FAIL] ${configName}: Disclaimer sentence appeared ${disclaimerMatches} times in PDF (expected exactly 1)`
        );
      }
      console.log(`  [PASS] Disclaimer sentence present exactly once in PDF`);

      // c) Rasterise page 1 using pypdfium2 (accurate Google PDFium renderer) and assert top 10mm band is white
      const { execSync } = require('child_process');
      const checkRasterCmd = `python -c "import pypdfium2 as pdfium, numpy as np; pdf = pdfium.PdfDocument(r'${pdfPath}'); page = pdf[0]; img = page.render(scale=96/72).to_pil(); arr = np.array(img.crop((0, 0, img.size[0], 38))); non_white = int(np.sum((arr[:, :, 0] < 250) | (arr[:, :, 1] < 250) | (arr[:, :, 2] < 250))); print(non_white)"`;
      const nonWhiteCount = parseInt(execSync(checkRasterCmd, { encoding: 'utf-8' }).trim(), 10);

      if (nonWhiteCount > 0) {
        throw new Error(
          `[FAIL] ${configName}: Found ${nonWhiteCount} non-white pixels in top 10mm band of PDF Page 1 (stray navbar detected)`
        );
      }
      console.log(`  [PASS] Page 1 top 10mm band rasterised and confirmed completely white (0 non-white pixels)`);

      // d) Compute contrast for risk dots (>= 3:1) and text (>= 4.5:1)
      const elementsContrast = await page.evaluate(() => {
        const sheet = document.querySelector('#print-root .sheet');
        if (!sheet) return { textPairs: [], dotPairs: [] };

        const textEls = Array.from(sheet.querySelectorAll('h1, h2, h3, p, span, th, td, li'));
        const textPairs = [];
        for (const el of textEls) {
          const comp = window.getComputedStyle(el);
          if (comp.display === 'none' || comp.visibility === 'hidden') continue;
          if (el.textContent && el.textContent.trim().length > 0) {
            textPairs.push({
              text: el.textContent.trim().slice(0, 30),
              color: comp.color,
            });
          }
        }

        const dotEls = Array.from(sheet.querySelectorAll('.risk-dot, span[style*="border-radius: 50%"]'));
        const dotPairs = [];
        for (const dot of dotEls) {
          const comp = window.getComputedStyle(dot);
          dotPairs.push({
            color: comp.backgroundColor,
          });
        }

        return { textPairs, dotPairs };
      });

      const whiteRgb = [255, 255, 255];
      let contrastFailures = 0;

      for (const item of elementsContrast.textPairs) {
        const rgb = parseRgb(item.color);
        const ratio = getContrastRatio(rgb, whiteRgb);
        if (ratio < 4.5) {
          contrastFailures++;
          console.error(`    [Contrast Text Fail] "${item.text}" color ${item.color} ratio ${ratio.toFixed(2)}:1 < 4.5:1`);
        }
      }

      for (const dot of elementsContrast.dotPairs) {
        const rgb = parseRgb(dot.color);
        const ratio = getContrastRatio(rgb, whiteRgb);
        if (ratio < 3.0) {
          contrastFailures++;
          console.error(`    [Contrast Dot Fail] dot color ${dot.color} ratio ${ratio.toFixed(2)}:1 < 3.0:1`);
        }
      }

      if (contrastFailures > 0) {
        throw new Error(
          `[FAIL] ${configName}: Found ${contrastFailures} contrast failures on white print background`
        );
      }
      console.log(`  [PASS] All text (>= 4.5:1) and risk dots (>= 3.0:1) pass contrast against #FFFFFF\n`);

      // Revert media emulation for next iteration
      await page.emulateMedia({ media: null });
      await page.waitForTimeout(200);
    }
  }

  await browser.close();

  console.log('=== All Print Tests PASSED! ===');
  console.log('Saved 4 PDF Samples:');
  pdfOutputPaths.forEach((p) => console.log(` - ${p}`));
  process.exit(0);
}

runPrintTests().catch((err) => {
  console.error('\n[FATAL PRINT TEST ERROR]:', err);
  process.exit(1);
});
