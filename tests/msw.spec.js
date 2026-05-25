import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('MSW worker starts and /api/crypto returns mocked data', async ({ page }) => {
  // wait for MSW startup log in console
  const started = await page.waitForEvent('console', {
    predicate: (msg) => msg.text().includes('[MSW] worker started'),
    timeout: 8000,
  });
  expect(started).toBeTruthy();

  // fetch via page context (should be intercepted by SW)
  const data = await page.evaluate(async () => {
    const res = await fetch('/api/crypto');
    return res.json();
  });

  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});

test('deep link to detail page loads and shows detail modal', async ({ page }) => {
  await page.goto('/detail/news/1');
  // modal overlay selector from DetailModal: fixed inset-0
  await page.waitForSelector('div.fixed.inset-0, div.bg-gray-950', { timeout: 10000 });
  expect(page.url()).toContain('/detail/news/1');
});
