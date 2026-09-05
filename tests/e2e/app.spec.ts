import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing, routes, metadata, history, and 404 have the required structure', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Recall Objective Map — map recall to objectives');
  await expect(page.getByRole('heading', { level: 1, name: 'Map recall checks to learning objectives' })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://recall-objective-map.sociobot.in/');
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  await expect(page).toHaveTitle('Privacy — Recall Objective Map');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Map recall checks to learning objectives' })).toBeFocused();
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Recall Objective Map');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
});

test('rejects whitespace-only objective fields and announces recovery', async ({ page }) => {
  await page.goto('/map');
  await page.getByRole('button', { name: 'Add your first objective' }).click();
  await page.getByRole('textbox', { name: 'Objective', exact: true }).fill('   ');
  await page.getByRole('textbox', { name: 'One recall question' }).fill('\t');
  await page.getByRole('textbox', { name: 'What would count as evidence?' }).fill(' \n ');
  await page.getByRole('button', { name: 'Save objective' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter an objective, a recall question, and an evidence target.');
  await expect(page.getByRole('dialog', { name: 'Add objective' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Objective', exact: true })).toBeFocused();
});

test('landing and app states have no serious accessibility issues on phone and desktop', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', error => browserErrors.push(error.message));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page: page as never }).analyze();
      expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? '')), `${path} at ${width}px`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  }
  await page.goto('/');
  const footerLinks = page.locator('.footer-links a');
  for (let index = 0; index < await footerLinks.count(); index++) expect((await footerLinks.nth(index).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(browserErrors).toEqual([]);
});

test('supports keyboard focus, reduced motion, and route-specific PWA metadata', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const duration = await page.locator('.button').first().evaluate(element => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.01);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.start_url).toBe('/map?source=installed-v2');
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true);
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/apple-touch-icon.png');
});
