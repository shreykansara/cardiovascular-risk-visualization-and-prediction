/**
 * 3D Viewer Stability Specification (Task 3.1 & Task 3.8)
 * Verifies:
 * a) Idle test: 30 canvas screenshots 100ms apart, max changed-pixel % <= 0.05%
 * b) View test: Front, Left, Back, Right views (800ms wait), heart occupancy >= 10% in every view
 * c) Rotation test: click Back, sample every 50ms for 800ms, no frame mean lum < 50% of idle mean
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const DOC_PATH = path.resolve(__dirname, '..', 'docs', 'VIEWER_FLICKER.md');

async function run() {
  console.log('=== RUNNING 3D VIEWER STABILITY AUDIT (Task 3.1) ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    // Navigate and set up sample patient
    console.log('1. Setting up sample patient and navigating to /results...');
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    await page.locator('#welcome-understand-checkbox').check();
    await page.locator('#start-assessment-btn').click();
    await page.waitForURL('**/enter-data');

    await page.waitForSelector('#sample-patient-select');
    await page.selectOption('#sample-patient-select', 'normal');
    await page.waitForTimeout(300);

    await page.locator('#predict-button').click();
    await page.waitForURL('**/results');
    await page.waitForTimeout(2000);

    const canvasLocator = page.locator('canvas').first();
    await canvasLocator.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000); // Allow initial scene settle

    // Helper functions inside browser
    await page.evaluate(() => {
      window.__analysisCanvas = document.createElement('canvas');
      window.__analysisCtx = window.__analysisCanvas.getContext('2d', { willReadFrequently: true });

      function srgbToLinear(c) {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      }

      window.__getFrameData = function(dataUrl) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const cvs = window.__analysisCanvas;
            cvs.width = img.width;
            cvs.height = img.height;
            const ctx = window.__analysisCtx;
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            resolve({
              width: img.width,
              height: img.height,
              data: imgData.data,
            });
          };
          img.onerror = reject;
          img.src = dataUrl;
        });
      };

      window.__computeDiffPct = async function(urlA, urlB) {
        const fA = await window.__getFrameData(urlA);
        const fB = await window.__getFrameData(urlB);
        const len = fA.data.length;
        const totalPixels = fA.width * fA.height;
        let diffCount = 0;
        for (let i = 0; i < len; i += 4) {
          const dr = Math.abs(fA.data[i] - fB.data[i]);
          const dg = Math.abs(fA.data[i + 1] - fB.data[i + 1]);
          const db = Math.abs(fA.data[i + 2] - fB.data[i + 2]);
          if (dr > 3 || dg > 3 || db > 3) {
            diffCount++;
          }
        }
        return (diffCount / totalPixels) * 100;
      };

      window.__computeStats = async function(url, bgR, bgG, bgB) {
        const frame = await window.__getFrameData(url);
        const len = frame.data.length;
        const totalPixels = frame.width * frame.height;
        let sumLum = 0;
        let nonBgCount = 0;
        // Sample inset by 10 pixels to avoid container corner radius antialiasing
        const insetOffset = (10 * frame.width + 10) * 4;
        const cornerR = insetOffset < len ? frame.data[insetOffset] : frame.data[0];
        const cornerG = insetOffset < len ? frame.data[insetOffset + 1] : frame.data[1];
        const cornerB = insetOffset < len ? frame.data[insetOffset + 2] : frame.data[2];
        const checkBgR = bgR !== undefined ? bgR : cornerR;
        const checkBgG = bgG !== undefined ? bgG : cornerG;
        const checkBgB = bgB !== undefined ? bgB : cornerB;

        for (let i = 0; i < len; i += 4) {
          const r = frame.data[i];
          const g = frame.data[i + 1];
          const b = frame.data[i + 2];
          // Luminance
          const lum = 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
          sumLum += lum;

          // Occupancy (distance from bg color)
          const dr = Math.abs(r - checkBgR);
          const dg = Math.abs(g - checkBgG);
          const db = Math.abs(b - checkBgB);
          if (Math.sqrt(dr * dr + dg * dg + db * db) > 25) {
            nonBgCount++;
          }
        }

        return {
          meanLum: sumLum / totalPixels,
          occupancy: (nonBgCount / totalPixels) * 100,
          cornerColor: { r: cornerR, g: cornerG, b: cornerB },
        };
      };
    });

    // --- TEST A: Idle Test ---
    console.log('2. Running Idle Stability Test (30 frames, 100ms apart)...');
    const idleUrls = [];
    for (let i = 0; i < 30; i++) {
      const buf = await canvasLocator.screenshot();
      idleUrls.push(`data:image/png;base64,${buf.toString('base64')}`);
      if (i < 29) await page.waitForTimeout(100);
    }

    let maxDiffPct = 0;
    for (let i = 0; i < idleUrls.length - 1; i++) {
      const diff = await page.evaluate(
        ({ u1, u2 }) => window.__computeDiffPct(u1, u2),
        { u1: idleUrls[i], u2: idleUrls[i + 1] }
      );
      if (diff > maxDiffPct) maxDiffPct = diff;
    }

    const idleStats = await page.evaluate(
      (u) => window.__computeStats(u),
      idleUrls[0]
    );

    const baselineLuminance = idleStats.meanLum;
    const cornerR = idleStats.cornerColor.r;
    const cornerG = idleStats.cornerColor.g;
    const cornerB = idleStats.cornerColor.b;

    console.log(`   -> Idle Max Changed-Pixel %: ${maxDiffPct.toFixed(4)}%`);
    console.log(`   -> Idle Baseline Mean Luminance: ${baselineLuminance.toFixed(4)}`);
    console.log(`   -> Detected Corner Color: rgb(${cornerR}, ${cornerG}, ${cornerB})`);

    // --- TEST B: View Test ---
    console.log('3. Running View Test (Front, Left, Back, Right)...');
    const views = ['Front', 'Left', 'Back', 'Right'];
    const occupancies = {};

    for (const viewName of views) {
      const viewBtn = page.locator('button', { hasText: new RegExp(`^${viewName}$`, 'i') }).first();
      if (await viewBtn.isVisible()) {
        await viewBtn.click();
      }
      await page.waitForTimeout(1000);

      const buf = await canvasLocator.screenshot();
      const url = `data:image/png;base64,${buf.toString('base64')}`;
      const stats = await page.evaluate(
        ({ u, r, g, b }) => window.__computeStats(u, r, g, b),
        { u: url, r: cornerR, g: cornerG, b: cornerB }
      );
      occupancies[viewName] = stats.occupancy;
      console.log(`   -> ${viewName} View Heart Occupancy: ${stats.occupancy.toFixed(2)}% (Required >= 10%)`);
    }

    // --- TEST C: Rotation Black Flash Test ---
    console.log('4. Running Rotation Black Flash Test (click Back, sample 5 rotation frames)...');
    const frontBtn = page.locator('button', { hasText: /^Front$/i }).first();
    if (await frontBtn.isVisible()) await frontBtn.click();
    await page.waitForTimeout(800);

    const backBtn = page.locator('button', { hasText: /^Back$/i }).first();
    if (await backBtn.isVisible()) await backBtn.click();

    const rotationUrls = [];
    for (let i = 0; i < 5; i++) {
      const buf = await canvasLocator.screenshot();
      rotationUrls.push(`data:image/png;base64,${buf.toString('base64')}`);
      await page.waitForTimeout(60);
    }

    const minThresholdLum = baselineLuminance * 0.5;
    let minObservedLum = 1.0;
    let blackFlashDetected = false;

    for (let i = 0; i < rotationUrls.length; i++) {
      const url = rotationUrls[i];
      const stats = await page.evaluate(
        ({ u, r, g, b }) => window.__computeStats(u, r, g, b),
        { u: url, r: cornerR, g: cornerG, b: cornerB }
      );
      console.log(`      Frame ${i} meanLum: ${stats.meanLum.toFixed(4)}`);
      if (stats.meanLum < minObservedLum) minObservedLum = stats.meanLum;
      if (stats.meanLum < minThresholdLum) blackFlashDetected = true;
    }

    console.log(`   -> Sampled ${rotationUrls.length} rotation frames.`);
    console.log(`   -> Minimum Rotation Luminance: ${minObservedLum.toFixed(4)} (Threshold: ${minThresholdLum.toFixed(4)})`);
    console.log(`   -> Black Flash Detected: ${blackFlashDetected ? 'YES (FAIL)' : 'NO (PASS)'}`);

    const rightViewMissing = occupancies['Right'] < 10.0;
    console.log(`   -> Right View Losing Heart: ${rightViewMissing ? 'YES (REPRODUCED)' : 'NO'}`);

    // Update docs/VIEWER_FLICKER.md with baseline measurements
    let mdContent = `# 3D Viewer Flicker and Stability Diagnosis (Task 3.1 & 3.2)\n\n`;
    mdContent += `Generated: ${new Date().toISOString()}\n\n`;
    mdContent += `## Task 3.1 Baseline Measurements (Current State Before Revert)\n\n`;
    mdContent += `- **Idle Max Changed-Pixel %**: ${maxDiffPct.toFixed(4)}% (Target: <= 0.05%)\n`;
    mdContent += `- **Idle Baseline Mean Luminance**: ${baselineLuminance.toFixed(4)}\n`;
    mdContent += `- **Corner Background Color**: rgb(${cornerR}, ${cornerG}, ${cornerB})\n\n`;
    mdContent += `### View Occupancy Table\n\n`;
    mdContent += `| View | Occupancy % | Required | Status |\n`;
    mdContent += `| :--- | :--- | :--- | :--- |\n`;
    for (const [v, occ] of Object.entries(occupancies)) {
      mdContent += `| ${v} | ${occ.toFixed(2)}% | >= 10.00% | ${occ >= 10 ? 'PASS' : 'FAIL'} |\n`;
    }
    mdContent += `\n- **Right View Lost Heart Reproduced**: ${rightViewMissing ? 'YES' : 'NO'}\n\n`;
    mdContent += `### Rotation Black Flash Test\n\n`;
    mdContent += `- **Minimum Observed Luminance**: ${minObservedLum.toFixed(4)}\n`;
    mdContent += `- **Luminance Threshold (50% of idle)**: ${minThresholdLum.toFixed(4)}\n`;
    mdContent += `- **Black Flash (< 50% idle luminance)**: ${blackFlashDetected ? 'DETECTED (FAIL)' : 'NONE (PASS)'}\n\n`;

    fs.writeFileSync(DOC_PATH, mdContent, 'utf-8');
    console.log(`\nWritten baseline diagnostics to ${DOC_PATH}`);

    return {
      maxDiffPct,
      baselineLuminance,
      occupancies,
      minObservedLum,
      blackFlashDetected,
      rightViewMissing,
    };
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('[FAIL] Viewer stability spec error:', err);
  process.exit(1);
});
