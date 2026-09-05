import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function addObjective(page: import('@playwright/test').Page, title: string, asChild = false) {
  await page.getByRole('button', { name: asChild ? 'Add sub-objective' : /Add (your first )?objective/ }).first().click();
  await page.getByRole('textbox', { name: 'Objective', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'One recall question' }).fill(`What must you recall for ${title}?`);
  await page.getByRole('textbox', { name: 'What would count as evidence?' }).fill('A correct explanation with one concrete example.');
  await page.getByRole('button', { name: 'Save objective' }).click();
}

test('@claim:demo-sandbox opens, resets, and leaves the real map unchanged', async ({ page }) => {
  await page.goto('/map');
  await addObjective(page, 'Explain my private test objective');
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved to your map')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explain why planets stay in orbit' })).toBeVisible();
  await addObjective(page, 'Temporary demo objective');
  await expect(page.getByRole('heading', { name: 'Temporary demo objective' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Temporary demo objective' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByRole('heading', { name: 'Explain my private test objective' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explain why planets stay in orbit' })).toHaveCount(0);
});

test('@claim:nested-objectives adds a child under its selected objective', async ({ page }) => {
  await page.goto('/demo');
  await addObjective(page, 'Explain the role of orbital radius', true);
  const firstRoot = page.locator('.tree > .tree-node').first();
  await expect(firstRoot.locator('ul').getByRole('button', { name: /Explain the role of orbital radius/ })).toBeVisible();
});

test('@claim:manual-evidence records a recall answer, type, strength, and note', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Compare orbital energy changes/ }).click();
  await page.getByRole('button', { name: 'Check recall' }).click();
  await page.getByLabel('Your answer from memory').fill('A forward burn adds energy and raises the opposite side of the orbit.');
  await page.getByRole('button', { name: 'Reveal evidence guide' }).click();
  await page.getByLabel('Recognize').check();
  await page.getByLabel('Building').check();
  await page.getByLabel('Evidence note').fill('I still need to explain retrograde burns.');
  await page.getByRole('button', { name: 'Attach evidence' }).click();
  await expect(page.getByRole('heading', { name: 'Check complete' })).toBeVisible();
  await page.getByRole('button', { name: 'Objective map', exact: true }).click();
  await page.getByRole('button', { name: /Compare orbital energy changes/ }).click();
  await expect(page.getByText('I still need to explain retrograde burns.')).toBeVisible();
  await expect(page.locator('.history-item .stamp').first()).toHaveText('recognize');
});

test('@claim:weak-ranking shows the two objectives with the thinnest recent evidence', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Weak-objective map' }).click();
  const names = await page.locator('.weak-callout h3').allTextContents();
  expect(names).toEqual(['Compare orbital energy changes', 'Explain why planets stay in orbit']);
  await expect(page.locator('.weak-table tbody tr')).toHaveCount(4);
});

test('@claim:browser-persistence keeps a real objective after reload', async ({ page }) => {
  await page.goto('/map');
  await addObjective(page, 'Compare mitosis and meiosis');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Compare mitosis and meiosis' })).toBeVisible();
  expect(await page.evaluate(async () => (await indexedDB.databases()).map(item => item.name))).toContain('recall-objective-map');
});

test('@claim:offline-reload reopens the sample in a dedicated offline context', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/demo`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Review recall against your objectives' })).toBeVisible();
    await expect(page.getByText('Offline · changes stay on this device')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explain why planets stay in orbit' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:json-export downloads every sample objective and check', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Data tools' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all data (JSON)' }).click();
  const path = await (await downloadPromise).path();
  const exported = JSON.parse(await readFile(path!, 'utf8'));
  expect(exported.objectives).toHaveLength(4);
  expect(exported.checks).toHaveLength(4);
  expect(exported.objectives.find((item: { id: string }) => item.id === 'sample-speed').parentId).toBe('sample-orbits');
});

test('@claim:csv-export downloads one row for every sample objective', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Weak-objective map' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export weak map (CSV)' }).click();
  const path = await (await downloadPromise).path();
  const csv = await readFile(path!, 'utf8');
  expect(csv.trim().split('\n')).toHaveLength(5);
  expect(csv).toContain('"objective","parent","evidence_band","checks_in_window","missing_evidence","last_check"');
  expect(csv).toContain('"Solve circular orbit speed","Explain why planets stay in orbit"');
});

test('@claim:safe-import rejects malformed data and confirms valid replacement', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Data tools' }).click();
  const input = page.locator('#import-file');
  await input.setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, objectives: [{ id: 'bad', title: 'Missing fields', prompt: 'Question' }], checks: [], updatedAt: new Date().toISOString() })) });
  await expect(page.locator('#import-error')).toContainText('incomplete or invalid');
  await expect(page.getByText('This sample uses a separate browser store.')).toBeVisible();

  const replacement = { version: 1, objectives: [{ id: 'new', title: 'Explain plate boundaries', description: '', parentId: null, prompt: 'How do convergent boundaries differ?', evidenceTarget: 'Compare collision and subduction.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], checks: [], updatedAt: new Date().toISOString() };
  page.once('dialog', dialog => dialog.dismiss());
  await input.setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(replacement)) });
  await expect(page.getByText('This sample uses a separate browser store.')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await input.setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(replacement)) });
  await expect(page.getByRole('heading', { name: 'Explain plate boundaries' })).toBeVisible();
});

test('@claim:evidence-windows includes older evidence in the 30-day view', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Weak-objective map' }).click();
  const energyRow = page.getByRole('row').filter({ hasText: 'Compare orbital energy changes' });
  await expect(energyRow.getByText('0', { exact: true })).toBeVisible();
  await page.getByLabel('Evidence window').selectOption('30');
  await expect(energyRow.getByText('1', { exact: true })).toBeVisible();
});

test('@claim:private-requests completes a recall check without third-party requests', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Check recall' }).click();
  await page.getByLabel('Your answer from memory').fill('Gravity bends the path while sideways speed carries the planet forward.');
  await page.getByRole('button', { name: 'Reveal evidence guide' }).click();
  await page.getByLabel('Explain').check();
  await page.getByLabel('Building').check();
  await page.getByRole('button', { name: 'Attach evidence' }).click();
  await expect(page.getByRole('heading', { name: 'Check complete' })).toBeVisible();
  const expectedOrigin = new URL(baseURL!).origin;
  expect([...new Set(requests.map(url => new URL(url).origin))]).toEqual([expectedOrigin]);
});

test('@claim:free-no-account completes the real workflow without sign-in or payment', async ({ page }) => {
  await page.goto('/map');
  await addObjective(page, 'Explain supply and demand equilibrium');
  await page.getByRole('button', { name: 'Check recall' }).click();
  await page.getByLabel('Your answer from memory').fill('Price moves until quantity supplied equals quantity demanded.');
  await page.getByRole('button', { name: 'Reveal evidence guide' }).click();
  await page.getByLabel('Explain').check();
  await page.getByLabel('Supported').check();
  await page.getByRole('button', { name: 'Attach evidence' }).click();
  await expect(page.getByRole('heading', { name: 'Check complete' })).toBeVisible();
  await expect(page.getByText(/sign in|buy|payment/i)).toHaveCount(0);
});
