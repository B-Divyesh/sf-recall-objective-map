import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = (process.argv[2] ?? 'https://recall-objective-map.sociobot.in').replace(/\/$/, '');
const evidenceDir = process.argv[3] ?? '/work/.evidence/recall-objective-map/live';
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  const requests = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const heading = await page.locator('h1').innerText();
  const action = await page.getByRole('link', { name: 'Try it with sample data' }).boundingBox();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.getByText('Demo — sample data, nothing is saved to your map').waitFor();
  const demoObjectives = await page.locator('.tree .tree-node').count();

  await page.getByRole('button', { name: 'Add objective', exact: true }).click();
  await page.getByLabel('Objective', { exact: true }).fill('Temporary live check');
  await page.getByLabel('One recall question').fill('What should reset remove?');
  await page.getByLabel('What would count as evidence?').fill('The temporary item disappears.');
  await page.getByRole('button', { name: 'Save objective' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  const temporaryAfterReset = await page.getByRole('button', { name: /Temporary live check/ }).count();

  await page.getByRole('button', { name: 'Start for real' }).click();
  const realEmpty = await page.getByRole('heading', { name: 'Add your first learning objective' }).isVisible();
  await page.goto(`${baseUrl}/demo`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${evidenceDir}/${viewport.name}-demo.png`, fullPage: true });

  results.push({
    viewport: viewport.name,
    heading,
    primaryActionBottom: action ? action.y + action.height : null,
    viewportHeight: viewport.height,
    demoObjectives,
    temporaryAfterReset,
    realEmpty,
    requestOrigins: [...new Set(requests.map(url => new URL(url).origin))],
    errors,
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
  });
  await context.close();
}

const offlineContext = await browser.newContext();
const offlinePage = await offlineContext.newPage();
offlinePage.setDefaultTimeout(10_000);
const offlineErrors = [];
offlinePage.on('console', message => { if (message.type() === 'error') offlineErrors.push(message.text()); });
offlinePage.on('pageerror', error => offlineErrors.push(error.message));
await offlinePage.goto(`${baseUrl}/demo`, { waitUntil: 'networkidle' });
await offlinePage.evaluate(() => Promise.race([
  navigator.serviceWorker.ready,
  new Promise((_, reject) => setTimeout(() => reject(new Error('service worker was not ready within 10 seconds')), 10_000)),
]));
await offlinePage.reload();
await offlineContext.setOffline(true);
await offlinePage.reload();
results.push({
  offline: {
    heading: await offlinePage.locator('h1').innerText(),
    sample: await offlinePage.getByRole('button', { name: /Explain why planets stay in orbit/ }).isVisible(),
    flag: await offlinePage.getByText('Offline · changes stay on this device').isVisible(),
    errors: offlineErrors,
  },
});
await offlineContext.close();

for (const path of ['/demo', '/map', '/privacy', '/terms', '/no-such-page']) {
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
  results.push({ path, status: response?.status(), title: await page.title(), h1: await page.locator('h1').innerText(), h1Count: await page.locator('h1').count() });
  await page.close();
}

await browser.close();
await writeFile(`${evidenceDir}/browser-check.json`, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
