const { chromium } = require('playwright-core');

async function runTests() {
  console.log('--- RUNNING PHASE 1 EMPTY FORM AUTOMATED VERIFICATION ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Fresh browser context (no storage)
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();

  console.log('1. Checking /welcome in fresh context...');
  await page1.goto('http://localhost:5173/welcome');
  const welcomeText = await page1.textContent('body');
  if (welcomeText.includes('in progress')) {
    throw new Error('FAILED: /welcome contains text "in progress"');
  }
  const checkbox = page1.locator('#welcome-understand-checkbox');
  const isChecked = await checkbox.isChecked();
  if (isChecked) {
    throw new Error('FAILED: acknowledgement checkbox is pre-ticked');
  }
  const startBtn = page1.locator('#start-assessment-btn');
  const isDisabled = await startBtn.isDisabled();
  if (!isDisabled) {
    throw new Error('FAILED: Start button should be disabled when checkbox is unticked');
  }
  console.log('  -> /welcome passed: unticked, no "in progress", Start button disabled');

  // 2. Tick and start
  console.log('2. Ticking checkbox and clicking Start...');
  await checkbox.check();
  await startBtn.click();
  await page1.waitForURL('**/enter-data');

  // 3. /enter-data initial empty state
  console.log('3. Checking /enter-data empty state...');
  await page1.waitForSelector('.sticky-action-bar');
  const enterDataText = await page1.textContent('body');
  if (!enterDataText.includes('0 of 55 entered')) {
    throw new Error('FAILED: /enter-data does not show "0 of 55 entered"');
  }

  // Helper line under title
  if (!enterDataText.includes('Enter each measurement, or load a sample patient.')) {
    throw new Error('FAILED: helper text under title does not match "Enter each measurement, or load a sample patient."');
  }

  // Check input values are empty
  const numInputs = await page1.locator('input[type="number"]').all();
  for (const input of numInputs) {
    const val = await input.inputValue();
    if (val !== '') {
      const id = await input.getAttribute('id');
      throw new Error(`FAILED: input #${id} has value "${val}" (expected empty)`);
    }
  }

  // Check segmented buttons: aria-pressed="false" on all
  const segButtons = await page1.locator('button[aria-pressed]').all();
  for (const btn of segButtons) {
    const pressed = await btn.getAttribute('aria-pressed');
    if (pressed !== 'false') {
      const text = await btn.textContent();
      throw new Error(`FAILED: segmented button "${text}" has aria-pressed="${pressed}" (expected false)`);
    }
  }

  // Check select fields: disabled placeholder "Select"
  const selects = await page1.locator('.section-field-grid select').all();
  for (const sel of selects) {
    const val = await sel.inputValue();
    if (val !== '') {
      throw new Error(`FAILED: select has value "${val}" (expected empty/placeholder)`);
    }
  }

  // Check no red/amber dots or errors initially
  const redDotsBefore = await page1.locator('span[style*="var(--high)"]').all();
  if (redDotsBefore.length > 0) {
    throw new Error('FAILED: red dots present on pristine form');
  }
  if (enterDataText.includes('need attention')) {
    throw new Error('FAILED: "need attention" link visible on pristine form');
  }
  console.log('  -> /enter-data empty state verified: 0 of 55, empty inputs, no pressed buttons, no errors');

  // 4. Predict on empty form: must make NO api call to /analyze, show error and focus first invalid
  console.log('4. Testing Predict on empty form...');
  let analyzeCalled = false;
  page1.on('request', (req) => {
    if (req.url().includes('/api/v1/analyze')) {
      analyzeCalled = true;
    }
  });

  const predictBtn = page1.locator('#predict-button');
  await predictBtn.click();
  await page1.waitForTimeout(300);

  if (analyzeCalled) {
    throw new Error('FAILED: Predict on empty form called /api/v1/analyze!');
  }

  const postPredictText = await page1.textContent('body');
  if (!postPredictText.includes('need attention')) {
    throw new Error('FAILED: "need attention" link missing after Predict attempt on incomplete form');
  }
  if (!postPredictText.includes('Required')) {
    throw new Error('FAILED: "Required" error message not displayed');
  }

  // Verify focus on first invalid field
  const focusedId = await page1.evaluate(() => document.activeElement ? document.activeElement.id : null);
  console.log('  -> Focused element after Predict:', focusedId);
  if (!focusedId || !focusedId.includes('field-')) {
    throw new Error(`FAILED: expected focus on invalid field, got "${focusedId}"`);
  }
  console.log('  -> Predict validation passed: no API call, errors shown, first field focused');

  // 5. Choosing a preset gives "55 of 55 entered" and placeholder reset
  console.log('5. Choosing a sample patient...');
  const sampleSelect = page1.locator('#sample-patient-select');
  await sampleSelect.selectOption({ index: 1 });
  await page1.waitForTimeout(200);

  const postSampleText = await page1.textContent('body');
  if (!postSampleText.includes('All 55 entered') && !postSampleText.includes('55 of 55 entered')) {
    throw new Error('FAILED: choosing sample patient did not result in 55 of 55 entered');
  }
  const sampleVal = await sampleSelect.inputValue();
  if (sampleVal !== '') {
    throw new Error(`FAILED: sample select did not return to placeholder option (current value: "${sampleVal}")`);
  }
  console.log('  -> Sample patient loaded: 55 of 55 entered, select returned to placeholder');

  // 6. Reload keeps the values in the same session
  console.log('6. Reloading in same session...');
  await page1.reload();
  await page1.waitForTimeout(300);
  const reloadText = await page1.textContent('body');
  if (!reloadText.includes('All 55 entered') && !reloadText.includes('55 of 55 entered')) {
    throw new Error('FAILED: reload in same session lost entered values');
  }
  console.log('  -> Same session reload kept values');

  // 7. Clear form button
  console.log('7. Testing Clear form button...');
  const clearFormBtn = page1.locator('#clear-form-button');
  const clearDisabled = await clearFormBtn.isDisabled();
  if (clearDisabled) {
    throw new Error('FAILED: Clear form button should be enabled when form is dirty');
  }
  await clearFormBtn.click();
  const clearDialog = page1.locator('dialog[open]');
  if ((await clearDialog.count()) === 0) {
    throw new Error('FAILED: Clear form dialog did not open');
  }
  const confirmClearBtn = page1.locator('dialog[open] button:has-text("Clear values")');
  await confirmClearBtn.click();
  await page1.waitForTimeout(200);

  const clearedText = await page1.textContent('body');
  if (!clearedText.includes('0 of 55 entered')) {
    throw new Error('FAILED: Clear values did not reset form to 0 of 55 entered');
  }
  console.log('  -> Clear form passed: reset form to 0 of 55 entered');

  await context1.close();

  // 8. New context is empty again
  console.log('8. Checking new fresh context is empty again...');
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto('http://localhost:5173/welcome');
  const textWelcome2 = await page2.textContent('body');
  if (textWelcome2.includes('in progress')) {
    throw new Error('FAILED: New context /welcome has "in progress"');
  }
  const checkbox2 = page2.locator('#welcome-understand-checkbox');
  if (await checkbox2.isChecked()) {
    throw new Error('FAILED: New context checkbox is checked');
  }
  await checkbox2.check();
  await page2.click('#start-assessment-btn');
  await page2.waitForURL('**/enter-data');
  await page2.waitForSelector('.sticky-action-bar');
  const textEnter2 = await page2.textContent('body');
  if (!textEnter2.includes('0 of 55 entered')) {
    throw new Error('FAILED: New context /enter-data not 0 of 55 entered');
  }
  console.log('  -> New context verified completely empty');

  await context2.close();
  await browser.close();
  console.log('ALL PHASE 1 TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
