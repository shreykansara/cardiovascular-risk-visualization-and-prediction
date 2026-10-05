/**
 * Automated Contrast Scanner Specification Test (Task 1.5)
 * Crawls /welcome, /enter-data, /results, /reports (clinician & patient), /model-info
 * in both "Paper" (Light) and "Monitor" (Dark) themes.
 * 
 * Verifies WCAG 2.1 contrast:
 * - Text >= 4.5:1 (>= 3.0:1 for large text >= 24px or >= 18.66px bold)
 * - Text must sit on a solid ancestor surface (not directly on grid, except 3D canvas)
 * - Non-text (dots, bars, inputs, button borders) >= 3.0:1
 * - Ignores disabled controls and records them
 * - Outputs docs/CONTRAST_REPORT.md
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const REPORT_FILE = path.resolve(__dirname, '..', 'docs', 'CONTRAST_REPORT.md');

function parseColor(str) {
  if (!str || str === 'transparent' || str === 'none') return null;
  let m = str.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
  if (m) {
    return {
      r: parseFloat(m[1]) * 255,
      g: parseFloat(m[2]) * 255,
      b: parseFloat(m[3]) * 255,
      a: m[4] !== undefined ? parseFloat(m[4]) : 1,
    };
  }
  m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    return {
      r: parseInt(m[1], 10),
      g: parseInt(m[2], 10),
      b: parseInt(m[3], 10),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1,
    };
  }
  return null;
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relLum({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(c1, c2) {
  const l1 = relLum(c1);
  const l2 = relLum(c2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

const scanPageInBrowser = () => {
  function parseColor(str) {
    if (!str || str === 'transparent' || str === 'none') return null;
    let m = str.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
    if (m) {
      return {
        r: parseFloat(m[1]) * 255,
        g: parseFloat(m[2]) * 255,
        b: parseFloat(m[3]) * 255,
        a: m[4] !== undefined ? parseFloat(m[4]) : 1,
      };
    }
    m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) {
      return {
        r: parseInt(m[1], 10),
        g: parseInt(m[2], 10),
        b: parseInt(m[3], 10),
        a: m[4] !== undefined ? parseFloat(m[4]) : 1,
      };
    }
    return null;
  }

  function composite(top, bottom) {
    if (!top) return bottom;
    if (!bottom) return top;
    const a = top.a + bottom.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const r = (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a;
    const g = (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a;
    const b = (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a;
    return { r, g, b, a };
  }

  function getEffectiveBg(el) {
    let curr = el;
    const layers = [];
    let isDirectOnGrid = false;

    while (curr && curr !== document.documentElement) {
      const cs = window.getComputedStyle(curr);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.unshift(bg);
        if (bg.a >= 0.98) break; // Found solid surface
      }
      curr = curr.parentElement;
    }

    if (layers.length === 0 || layers[0].a < 0.98) {
      isDirectOnGrid = true;
      const isDark = document.documentElement.dataset.theme === 'dark';
      layers.unshift(isDark ? { r: 12, g: 26, b: 19, a: 1 } : { r: 255, g: 255, b: 255, a: 1 });
    }

    let effective = layers[0];
    for (let i = 1; i < layers.length; i++) {
      effective = composite(layers[i], effective);
    }

    return { effectiveBg: effective, isDirectOnGrid };
  }

  const items = [];
  const disabledItems = [];
  const elements = document.querySelectorAll('*');

  elements.forEach((el) => {
    // Exclude 3D canvas container per Task 1.5 ("except the 3D canvas")
    if (el.closest('canvas, .r3f-canvas, [data-canvas-container], #viewer-cavity-container, .relative.w-full.h-full.bg-panel')) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;

    const isDisabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[disabled], [aria-disabled="true"]');
    if (isDisabled) {
      const text = el.innerText || el.textContent || '';
      if (text.trim()) {
        disabledItems.push({
          tag: el.tagName.toLowerCase(),
          text: text.trim().slice(0, 30),
          id: el.id || (typeof el.className === 'string' ? el.className.slice(0, 30) : ''),
        });
      }
      return; // Ignore disabled controls
    }

    // Direct text nodes check
    let directText = '';
    for (let n of el.childNodes) {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0) {
        directText += ' ' + n.textContent.trim();
      }
    }
    directText = directText.trim();

    if (directText.length > 0) {
      const textColor = parseColor(cs.color);
      const { effectiveBg, isDirectOnGrid } = getEffectiveBg(el);
      const fontSize = parseFloat(cs.fontSize) || 14;
      const fontWeight = parseInt(cs.fontWeight, 10) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 600);

      items.push({
        type: 'text',
        selector: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`,
        sampleText: directText.slice(0, 40),
        textColor,
        effectiveBg,
        isDirectOnGrid,
        isLarge,
        fontSize,
        fontWeight,
      });
    }

    // Non-text checks:
    // Risk dots
    if (el.classList.contains('risk-dot') || (el.style.borderRadius === '50%' && (rect.width <= 10 && rect.height <= 10))) {
      const dotColor = parseColor(cs.backgroundColor);
      const { effectiveBg } = getEffectiveBg(el.parentElement);
      if (dotColor) {
        items.push({
          type: 'non-text-dot',
          selector: 'risk-dot',
          sampleText: 'Risk Dot',
          textColor: dotColor,
          effectiveBg,
          isDirectOnGrid: false,
          isLarge: true,
        });
      }
    }

    // Input/button borders
    if (['input', 'select', 'textarea', 'button'].includes(el.tagName.toLowerCase())) {
      const borderWidth = parseFloat(cs.borderWidth) || 0;
      if (borderWidth > 0 && cs.borderStyle !== 'none') {
        const borderColor = parseColor(cs.borderColor);
        const { effectiveBg } = getEffectiveBg(el.parentElement);
        if (borderColor && borderColor.a > 0.05 && effectiveBg) {
          items.push({
            type: 'non-text-border',
            selector: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''}`,
            sampleText: `${el.tagName.toLowerCase()} border`,
            textColor: borderColor,
            effectiveBg,
            isDirectOnGrid: false,
            isLarge: true,
          });
        }
      }
    }

    // Progress bar fill
    if (el.getAttribute('role') === 'progressbar' || el.classList.contains('prob-bar')) {
      const barColor = parseColor(cs.backgroundColor);
      const { effectiveBg } = getEffectiveBg(el.parentElement);
      if (barColor) {
        items.push({
          type: 'non-text-bar',
          selector: 'progress-bar',
          sampleText: 'Bar fill',
          textColor: barColor,
          effectiveBg,
          isDirectOnGrid: false,
          isLarge: true,
        });
      }
    }
  });

  return { items, disabledItems };
};

async function runContrastSuite() {
  console.log('[Contrast Suite] Launching system browser...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
  } catch (e) {
    browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  }

  const themes = ['light', 'dark'];
  const reportRows = [];
  const allDisabled = [];
  let totalFailures = 0;

  for (const theme of themes) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const themeName = theme === 'light' ? 'Paper (Light)' : 'Monitor (Dark)';
    console.log(`\nScanning theme: ${themeName}...`);

    // 1. /welcome
    await page.goto(`${BASE_URL}/welcome`);
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      localStorage.setItem('perfusion3d-theme', t);
    }, theme);
    await page.waitForTimeout(300);
    const rWelcome = await page.evaluate(scanPageInBrowser);
    recordResults('/welcome', themeName, rWelcome.items, rWelcome.disabledItems);

    // Accept disclaimer & navigate
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(100);
    }
    const startBtn = page.locator('#start-assessment-btn, #start-wizard-button').first();
    await startBtn.click();
    await page.waitForURL('**/enter-data');
    await page.waitForTimeout(300);

    // 2. /enter-data
    const rEnterData = await page.evaluate(scanPageInBrowser);
    recordResults('/enter-data', themeName, rEnterData.items, rEnterData.disabledItems);

    // Load sample patient
    const sampleSelect = page.locator('#sample-patient-select');
    if (await sampleSelect.isVisible()) {
      await sampleSelect.selectOption('high_risk_lad');
      await page.waitForTimeout(300);
    }

    // Predict & wait for results
    const predictBtn = page.getByRole('button', { name: /predict/i }).first();
    await predictBtn.click();
    await page.waitForURL('**/results', { timeout: 15000 });
    await page.waitForTimeout(600);

    // 3. /results
    const rResults = await page.evaluate(scanPageInBrowser);
    recordResults('/results', themeName, rResults.items, rResults.disabledItems);

    // Intercept reports call to test error state first
    await page.route('**/api/v1/reports', async (route) => {
      await route.fulfill({ status: 500, body: 'Server Error' });
    });

    // Create reports & wait for error state
    const reportsBtn = page.getByRole('button', { name: /create reports/i }).first();
    await reportsBtn.click();
    await page.waitForURL('**/reports', { timeout: 15000 });
    await page.waitForSelector('.sheet:has-text("The reports could not be prepared.")', { timeout: 15000 });
    await page.waitForTimeout(300);

    // 4a. /reports (error state)
    const rReportsError = await page.evaluate(scanPageInBrowser);
    recordResults('/reports (error state)', themeName, rReportsError.items, rReportsError.disabledItems);

    // Delay response to test loading state via "Try again"
    await page.unroute('**/api/v1/reports');
    await page.route('**/api/v1/reports', async (route) => {
      await new Promise(r => setTimeout(r, 2500));
      await route.continue();
    });

    await page.click('#try-again-button');
    await page.waitForSelector('.sheet[aria-busy="true"]', { timeout: 5000 });

    // 4b. /reports (loading state)
    const rReportsLoading = await page.evaluate(scanPageInBrowser);
    recordResults('/reports (loading state)', themeName, rReportsLoading.items, rReportsLoading.disabledItems);

    // Wait for ready clinician state
    await page.waitForSelector('#printable-report-sheet h1', { timeout: 15000 });
    await page.unroute('**/api/v1/reports');
    await page.waitForTimeout(400);

    // 4c. /reports (clinician tab)
    const rReportsClinician = await page.evaluate(scanPageInBrowser);
    recordResults('/reports (clinician tab)', themeName, rReportsClinician.items, rReportsClinician.disabledItems);

    // Switch to patient tab
    const patientTab = page.locator('#tab-patient, button[role="tab"]:has-text("Patient report")').first();
    await patientTab.click();
    await page.waitForTimeout(400);

    // 5. /reports (patient tab)
    const rReportsPatient = await page.evaluate(scanPageInBrowser);
    recordResults('/reports (patient tab)', themeName, rReportsPatient.items, rReportsPatient.disabledItems);

    // 6. /model-info
    await page.goto(`${BASE_URL}/model-info`);
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      localStorage.setItem('perfusion3d-theme', t);
    }, theme);
    await page.waitForTimeout(300);
    const rModelInfo = await page.evaluate(scanPageInBrowser);
    recordResults('/model-info', themeName, rModelInfo.items, rModelInfo.disabledItems);

    await context.close();
  }

  function recordResults(screen, theme, items, disabled) {
    if (disabled && disabled.length > 0) {
      disabled.forEach(d => allDisabled.push({ screen, theme, ...d }));
    }

    items.forEach((item) => {
      const ratio = contrast(item.textColor, item.effectiveBg);
      const required = item.isLarge ? 3.0 : 4.5;
      const pass = ratio >= required && !item.isDirectOnGrid;
      if (!pass) totalFailures++;

      reportRows.push({
        screen,
        theme,
        element: `\`${item.selector}\` ("${item.sampleText.replace(/\|/g, '/')}")`,
        ratio: `${ratio.toFixed(2)}:1`,
        required: `${required.toFixed(1)}:1`,
        pass: pass ? 'PASS' : 'FAIL',
        note: item.isDirectOnGrid ? 'Text on grid' : (pass ? 'OK' : 'Low contrast'),
      });
    });
  }

  // Generate markdown report
  let md = `# Automated WCAG 2.1 Contrast Scanner Report (Task 1.5)\n\n`;
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Scanner: Playwright system browser engine against \`${BASE_URL}\`\n\n`;
  md += `## Summary\n`;
  md += `- **Total Elements Audited**: ${reportRows.length}\n`;
  md += `- **Total Failures**: ${totalFailures}\n`;
  md += `- **Verdict**: **${totalFailures === 0 ? 'PASSED (Zero Failures)' : 'FAILED'}**\n\n`;

  md += `## Contrast Audit Results Table\n\n`;
  md += `| Screen | Theme | Element / Snippet | Ratio | Required | Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  reportRows.forEach((r) => {
    md += `| ${r.screen} | ${r.theme} | ${r.element} | ${r.ratio} | ${r.required} | **${r.pass}** |\n`;
  });

  if (allDisabled.length > 0) {
    md += `\n## Disabled Controls (Ignored per Task 1.5)\n\n`;
    md += `| Screen | Theme | Tag | Text Snippet |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    allDisabled.forEach((d) => {
      md += `| ${d.screen} | ${d.theme} | \`<${d.tag}>\` | ${d.text.replace(/\|/g, '/')} |\n`;
    });
  }

  fs.writeFileSync(REPORT_FILE, md, 'utf-8');
  console.log(`\n[Contrast Suite] Saved detailed report to ${REPORT_FILE}`);
  console.log(`[Contrast Suite] Total elements scanned: ${reportRows.length}`);
  console.log(`[Contrast Suite] Total failures: ${totalFailures}`);

  await browser.close();

  if (totalFailures > 0) {
    console.error(`[Contrast Suite] FAILED with ${totalFailures} contrast violations.`);
    process.exit(1);
  } else {
    console.log(`[Contrast Suite] SUCCESS: Zero contrast violations across all screens and themes!`);
  }
}

runContrastSuite().catch((err) => {
  console.error('[Contrast Suite] Unhandled error:', err);
  process.exit(1);
});
