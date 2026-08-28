import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('maps an objective, records recall evidence, and survives reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.getByRole('button', { name: 'Add your first objective' }).click();
  await page.getByRole('textbox', { name: 'Objective', exact: true }).fill('Explain photosynthesis');
  await page.getByRole('textbox', { name: /Context/ }).fill('Plant energy fundamentals');
  await page.getByRole('textbox', { name: 'One recall question' }).fill('How does a plant turn light into stored chemical energy?');
  await page.getByRole('textbox', { name: 'What would count as evidence?' }).fill('Connect light reactions, ATP, and carbon fixation.');
  await page.getByRole('button', { name: 'Save objective' }).click();
  await expect(page.getByRole('heading', { name: 'Explain photosynthesis' })).toBeVisible();

  await page.getByRole('button', { name: 'Check recall' }).click();
  await page.getByLabel('Your answer from memory').fill('Light reactions make ATP, then the Calvin cycle fixes carbon into sugars.');
  await page.getByRole('button', { name: 'Reveal evidence guide' }).click();
  await page.getByLabel('Explain').check();
  await page.getByLabel('Building').check();
  await page.getByLabel('Evidence note').fill('Need to explain NADPH next time.');
  await page.getByRole('button', { name: 'Attach evidence' }).click();
  await expect(page.getByText('Check complete')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Weak-skill map' }).click();
  await expect(page.getByText('Explain photosynthesis').first()).toBeVisible();
  await expect(page.getByText('thin', { exact: true })).toBeVisible();
});

test('has no serious accessibility violations at empty state and works at 390px', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Add your first objective' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Add objective' })).toBeVisible();
  await page.keyboard.press('Escape');
  // @axe-core/playwright accepts a compatible Playwright Page but declares its own
  // bundled minor version, so bridge the structurally equivalent test fixture here.
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await expect(page.getByRole('button', { name: 'Add your first objective' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(browserErrors).toEqual([]);
});

test('reopens the app shell offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Recall Objective Map' })).toBeVisible();
  await expect(page.getByText('Offline · changes stay local')).toBeVisible();
});
