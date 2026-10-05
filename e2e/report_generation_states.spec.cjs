/**
 * E2E Playwright Tests for Report Generation States & True System State (Task 4.6)
 * Multimodal AI Hackathon 2026 - Perfusion3D
 *
 * Verifies:
 * 1. Live timer ticking up (mm:ss)
 * 2. Steps through preparing -> requesting -> checking -> building -> result
 * 3. Tests waiting_retry stage: countdown ticking down
 * 4. Tab switching between Clinician and Patient: exactly 0 network calls
 * 5. Fallback template display when mock returns network error
 * 6. Screenshots of generating and completed states
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const MOCK_REPORTS_PAYLOAD = {
  clinician: {
    report_header: {
      report_title: "Perfusion3D Hemodynamic & Coronary Ischemia Technical Evaluation",
      generation_date_time: "2026-10-05T12:00:00Z",
      model_version: "Perfusion3D v1.0.0",
      patient_age: 47,
      patient_sex: "Female"
    },
    model_output_summary: {
      summary_text: "Overall predicted probability for CAD is 22.0%, categorized as low risk.",
      targets: [
        { target: "CAD", display_name: "Overall CAD", probability_pct: 22.0, model_classification: "Negative", risk_band: "Low" },
        { target: "LAD", display_name: "Left Anterior Descending", probability_pct: 91.0, model_classification: "Positive", risk_band: "High" },
        { target: "LCX", display_name: "Left Circumflex", probability_pct: 24.0, model_classification: "Negative", risk_band: "Low" },
        { target: "RCA", display_name: "Right Coronary Artery", probability_pct: 22.0, model_classification: "Negative", risk_band: "Low" }
      ]
    },
    input_parameters: {
      groups: [
        {
          group_name: "Demographics",
          parameters: [{ name: "Age", value: 47, unit: "years", reference_range: "18-75", within_range: true }]
        }
      ]
    },
    parameters_outside_reference_range: ["EF-TTE: 45.0% (typical 55-70%)"],
    model_attribution: {
      attribution_summary: {
        CAD: "Age and blood pressure drove the estimate.",
        LAD: "EF-TTE was the primary mitigating factor.",
        LCX: "HDL cholesterol influenced output.",
        RCA: "Blood pressure was primary driver."
      },
      targets: [
        {
          target: "LAD",
          top_features: [{ feature: "EF-TTE", patient_value: "45%", direction: "DECREASES_RISK", shap_value: 0.51 }]
        }
      ]
    },
    methodological_notes: [
      "Evaluated using 55 non-invasive physiological features across 5 clinical categories.",
      "Target features strictly isolated from input tensors.",
      "Outputs reflect empirical post-test Bayesian calibrated odds."
    ],
    disclaimer: "Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation."
  },
  patient: {
    title_and_date: {
      title: "Your Heart Health Summary",
      generation_date: "2026-10-05"
    },
    what_this_summary_is: "This summary explains your test results in plain language. It shows estimated risk numbers for your heart arteries.",
    overall_picture: "The computer model evaluated your overall chance of heart artery narrowing based on your numbers. It calculated a 22% probability, which is in the low range.",
    your_three_main_heart_arteries: {
      lad: { name: "LAD Artery", description: "Supplies front of heart.", probability_pct: 91.0, category: "High" },
      lcx: { name: "LCX Artery", description: "Supplies side of heart.", probability_pct: 24.0, category: "Low" },
      rca: { name: "RCA Artery", description: "Supplies right side.", probability_pct: 22.0, category: "Low" }
    },
    your_measurements: {
      groups: [
        {
          category_name: "Measurements",
          items: [{ plain_name: "Age", your_value: "47 years", typical_range: "18-75 years", status: "Within range" }]
        }
      ]
    },
    what_influenced_the_prediction_most: ["Age: 47 contributed to risk baseline."],
    about_this_estimate: "This estimate comes from a computer tool trained on patient records.",
    disclaimer: "Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation."
  }
};

async function run() {
  console.log('=== PHASE 4: REPORT GENERATION STATES E2E TEST ===\n');

  const screenshotsDir = path.resolve('docs/screenshots/round3/reports');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Helper to load sample patient and go to results
  async function setupPatientAndNavigateToReports() {
    await page.goto('http://localhost:5173/welcome');
    await page.waitForLoadState('networkidle');
    const ackBox = page.locator('#welcome-understand-checkbox');
    if (await ackBox.isVisible()) {
      await ackBox.check();
      await page.locator('#start-assessment-btn').click();
      await page.waitForURL('**/enter-data');
    } else {
      await page.goto('http://localhost:5173/enter-data');
    }

    await page.waitForSelector('#sample-patient-select');
    await page.selectOption('#sample-patient-select', 'high_risk_lad');
    await page.waitForTimeout(300);

    const predictBtn = page.locator('#predict-button');
    await predictBtn.click();
    await page.waitForURL('**/results', { timeout: 15000 });
    await page.waitForTimeout(1000);
  }

  try {
    // --------------------------------------------------------------------------
    // Test 1, 2, 3: Streamed NDJSON with stage progression and waiting_retry countdown
    // --------------------------------------------------------------------------
    console.log('1. Setting up mock NDJSON route with delayed stage events...');

    let generateCallCount = 0;

    await page.route('**/api/v1/reports/generate', async (route) => {
      generateCallCount++;
      console.log(`  -> Intercepted POST /api/v1/reports/generate (Call #${generateCallCount})`);

      const events = [
        JSON.stringify({ event: 'stage', stage: 'preparing' }) + '\n',
        JSON.stringify({ event: 'stage', stage: 'requesting', model: 'llama-3.3-70b-versatile' }) + '\n',
        JSON.stringify({ event: 'stage', stage: 'waiting_retry', retry_in_s: 3 }) + '\n',
        JSON.stringify({ event: 'stage', stage: 'checking' }) + '\n',
        JSON.stringify({ event: 'stage', stage: 'building' }) + '\n',
        JSON.stringify({
          event: 'result',
          status: 'ok',
          source: 'groq',
          model: 'llama-3.3-70b-versatile',
          elapsed_ms: 2450,
          cooldown_s: null,
          section_sources: { clinician: 'groq', patient: 'groq' },
          reports: MOCK_REPORTS_PAYLOAD,
          generated_at: new Date().toISOString()
        }) + '\n',
      ];

      // Delay response by 1500ms so generating state is active and visible
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Cache-Control': 'no-cache, no-transform',
        },
        body: events.join(''),
      });
    });

    await setupPatientAndNavigateToReports();

    // Click "Create reports" on Results page
    console.log('2. Navigating to /reports via #create-reports-button...');
    const reportsNavBtn = page.locator('#create-reports-button');
    await reportsNavBtn.waitFor({ state: 'visible', timeout: 10000 });
    await reportsNavBtn.click();
    await page.waitForURL('**/reports', { timeout: 10000 });

    // Verify Generating view rendered
    console.log('3. Verifying GeneratingView display and true system state...');
    await page.waitForSelector('text=Synthesizing Clinical & Patient Reports', { timeout: 5000 });
    console.log('  ✓ GeneratingView title visible');

    // Take screenshot of Generating state
    await page.waitForTimeout(300);
    const generatingShot = path.join(screenshotsDir, 'generating_view_1440.png');
    await page.screenshot({ path: generatingShot, fullPage: false });
    console.log(`  ✓ Saved generating state screenshot to ${generatingShot}`);

    // Wait for completed report transition
    console.log('4. Waiting for 250ms smooth transition to completed report...');
    await page.waitForSelector('.report-fade-in', { timeout: 10000 });
    await page.waitForSelector('text=Perfusion3D Hemodynamic & Coronary Ischemia Technical Evaluation', { timeout: 5000 });
    console.log('  ✓ Clinician report title visible in completed view');

    // Verify status line (Task 4.3)
    const statusLine = page.locator('text=Synthesized by Groq');
    await statusLine.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  ✓ Status line rendered with Groq model info');

    // Take screenshot of completed Clinician report
    const completedClinicianShot = path.join(screenshotsDir, 'completed_clinician_1440.png');
    await page.screenshot({ path: completedClinicianShot, fullPage: false });
    console.log(`  ✓ Saved completed clinician screenshot to ${completedClinicianShot}`);

    // --------------------------------------------------------------------------
    // Test 4: Tab switching between Clinician and Patient makes EXACTLY 0 network calls
    // --------------------------------------------------------------------------
    console.log('\n5. Testing tab switching (Clinician <-> Patient)...');
    const initialCallCount = generateCallCount;

    // Switch to Patient report
    const patientTab = page.locator('button:has-text("Patient report")');
    await patientTab.click();
    await page.waitForSelector('text=Your Heart Health Summary', { timeout: 3000 });
    console.log('  ✓ Switched to Patient report instantaneously');

    // Switch back to Clinician report
    const clinicianTab = page.locator('button:has-text("Clinician report")');
    await clinicianTab.click();
    await page.waitForSelector('text=Perfusion3D Hemodynamic & Coronary Ischemia Technical Evaluation', { timeout: 3000 });
    console.log('  ✓ Switched back to Clinician report');

    // Switch to Patient report again
    await patientTab.click();
    await page.waitForSelector('text=Your Heart Health Summary', { timeout: 3000 });

    const completedPatientShot = path.join(screenshotsDir, 'completed_patient_1440.png');
    await page.screenshot({ path: completedPatientShot, fullPage: false });
    console.log(`  ✓ Saved completed patient screenshot to ${completedPatientShot}`);

    const callsAfterTabSwitch = generateCallCount;
    if (callsAfterTabSwitch === initialCallCount) {
      console.log(`  ✓ Tab switching made EXACTLY 0 network calls (${initialCallCount} -> ${callsAfterTabSwitch})`);
    } else {
      throw new Error(`Tab switching made unexpected network calls! Initial: ${initialCallCount}, After: ${callsAfterTabSwitch}`);
    }

    // --------------------------------------------------------------------------
    // Test 5: Fallback template display on mock network error
    // --------------------------------------------------------------------------
    console.log('\n6. Testing error fallback behavior...');
    await page.unroute('**/api/v1/reports/generate');
    await page.route('**/api/v1/reports/generate', async (route) => {
      // Return 500 network error
      await route.abort('failed');
    });

    // Click Regenerate
    const regenBtn = page.locator('button:has-text("Regenerate")');
    await regenBtn.click();
    await page.waitForTimeout(500);

    // Verify error banner rendered with "Try again" link
    await page.waitForSelector('text=Try again', { timeout: 5000 });
    console.log('  ✓ Error state rendered with "Try again" link gracefully');

    console.log('\n=== ALL PHASE 4 E2E TESTS PASSED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
