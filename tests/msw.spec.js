import { test, expect } from '@playwright/test';

const text = {
  searchPlaceholder: '\uC885\uBAA9 \uB610\uB294 \uB274\uC2A4 \uAC80\uC0C9',
  search: '\uAC80\uC0C9',
  login: '\uB85C\uADF8\uC778',
  signup: '\uD68C\uC6D0\uAC00\uC785',
  username: '\uC544\uC774\uB514',
  password: '\uBE44\uBC00\uBC88\uD638',
  name: '\uC774\uB984',
  email: '\uC774\uBA54\uC77C',
  phone: '\uD734\uB300\uD3F0 \uBC88\uD638',
  submitSignup: '\uAC00\uC785\uD558\uAE30',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('API returns market data', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Bitcoin' })).toBeVisible();
  const data = await page.evaluate(async () => (await fetch('/api/crypto')).json());
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});

test('deep link to detail page loads detail modal', async ({ page }) => {
  await page.goto('/detail/news/1');
  await page.waitForSelector('div.fixed.inset-0, div.bg-gray-950', { timeout: 10000 });
  expect(page.url()).toContain('/detail/news/1');
});

test('search filters stocks', async ({ page }) => {
  await page.getByPlaceholder(text.searchPlaceholder).fill('Apple');
  await page.getByRole('button', { name: text.search }).click();
  await expect(page.getByRole('table').getByText('AAPL')).toBeVisible();
  await expect(page.getByRole('table').getByText('GOOGL')).toHaveCount(0);
});

test('signup saves a user and the saved password can log in', async ({ page }) => {
  const suffix = Date.now();
  const username = `user${suffix}`;
  await page.getByRole('button', { name: text.signup }).click();
  await page.getByPlaceholder(text.username).fill(username);
  await page.getByPlaceholder(text.password, { exact: true }).fill('password123');
  await page.getByPlaceholder('\uBE44\uBC00\uBC88\uD638 \uD655\uC778').fill('password123');
  await page.getByPlaceholder(text.name).fill('\uD14C\uC2A4\uD2B8 \uC0AC\uC6A9\uC790');
  await page.getByPlaceholder(text.email).fill(`${username}@example.com`);
  await page.getByPlaceholder(text.phone).fill('010-1234-5678');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: text.submitSignup }).click();
  await expect(page.getByText(username)).toBeVisible();

  await page.getByRole('button', { name: '\uB85C\uADF8\uC544\uC6C3' }).click();
  await page.getByRole('button', { name: text.login }).click();
  await page.getByPlaceholder(text.username).fill(username);
  await page.getByPlaceholder(text.password, { exact: true }).fill('wrong-password');
  await page.locator('form').getByRole('button', { name: text.login }).click();
  await expect(page.getByText(/\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638/)).toBeVisible();

  await page.getByPlaceholder(text.password, { exact: true }).fill('password123');
  await page.locator('form').getByRole('button', { name: text.login }).click();
  await expect(page.getByText(username)).toBeVisible();
});
