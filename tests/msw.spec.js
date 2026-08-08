import { test, expect } from '@playwright/test';

const text = {
  searchPlaceholder: '\uC885\uBAA9 \uB610\uB294 \uB274\uC2A4 \uAC80\uC0C9',
  search: '\uAC80\uC0C9',
  login: '\uB85C\uADF8\uC778',
  signup: '\uD68C\uC6D0\uAC00\uC785',
  username: '\uC544\uC774\uB514',
  password: '\uBE44\uBC00\uBC88\uD638',
  name: '\uB2C9\uB124\uC784',
  email: '\uC774\uBA54\uC77C',
  phone: '\uD734\uB300\uD3F0 \uBC88\uD638',
  submitSignup: '\uAC00\uC785\uD558\uAE30',
  signupComplete: '\uD68C\uC6D0\uAC00\uC785\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
};

const deleteTestUser = async (request, username, password) => {
  if (!username) return;
  const login = await request.post('/api/auth/login', { data: { username, password } });
  if (!login.ok()) return;
  const { token } = await login.json();
  await request.delete('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
    data: { password },
  });
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('API returns market data', async ({ page }) => {
  await expect(page.getByRole('link', { name: /MoneyPlatform/ }).first()).toBeVisible();
  const data = await page.evaluate(async () => (await fetch('/api/crypto')).json());
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});

test('deep link to detail page loads detail view', async ({ page }) => {
  await page.goto('/detail/news/1');
  expect(page.url()).toContain('/detail/news/1');
  await expect(page.locator('article')).toBeVisible();
  await expect(page.getByRole('button', { name: '\uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30' })).toBeVisible();
});

test('search filters stocks', async ({ page }) => {
  await page.getByPlaceholder(text.searchPlaceholder).fill('Apple');
  await page.getByRole('button', { name: text.search }).click();
  await expect(page.getByRole('button', { name: /AAPL/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /GOOGL/ })).toHaveCount(0);
});

test('signup saves a user and the saved password can log in', async ({ page, request }) => {
  const suffix = Date.now();
  const username = `user${suffix}`;
  const password = 'password123';
  const nickname = '\uD14C\uC2A4\uD2B8 \uC0AC\uC6A9\uC790';
  try {
    await page.getByRole('button', { name: text.signup }).click();
    await page.getByPlaceholder(text.username).fill(username);
    await page.getByPlaceholder(text.password, { exact: true }).fill(password);
    await page.getByPlaceholder('\uBE44\uBC00\uBC88\uD638 \uD655\uC778').fill(password);
    await page.getByPlaceholder(text.name).fill(nickname);
    await page.getByPlaceholder(text.email).fill(`${username}@example.com`);
    await page.getByPlaceholder(text.phone).fill('010-1234-5678');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: text.submitSignup }).click();
    await expect(page.getByText(text.signupComplete)).toBeVisible();
    await expect(page.getByPlaceholder(text.username)).toHaveValue(username);
    await page.getByPlaceholder(text.password, { exact: true }).fill(password);
    await page.locator('form').getByRole('button', { name: text.login }).click();
    await expect(page.getByText(nickname)).toBeVisible();

    await page.getByRole('button', { name: '\uB85C\uADF8\uC544\uC6C3' }).click();
    await page.getByRole('button', { name: text.login }).click();
    await page.getByPlaceholder(text.username).fill(username);
    await page.getByPlaceholder(text.password, { exact: true }).fill('wrong-password');
    await page.locator('form').getByRole('button', { name: text.login }).click();
    await expect(page.getByText(/\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638/)).toBeVisible();

    await page.getByPlaceholder(text.password, { exact: true }).fill(password);
    await page.locator('form').getByRole('button', { name: text.login }).click();
    await expect(page.getByText(nickname)).toBeVisible();
  } finally {
    await deleteTestUser(request, username, password);
  }
});

test('guest-only and non-admin sessions do not reach protected admin data', async ({ page, request }) => {
  let adminRequests = 0;
  await page.route('**/api/admin/**', async (route) => {
    adminRequests += 1;
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"unexpected admin call"}' });
  });

  await page.goto('/portfolio');
  await expect(page.getByText('Portfolio')).toBeVisible();
  await expect(page.getByRole('heading', { name: /\uB85C\uADF8\uC778/ })).toBeVisible();

  await page.goto('/favorites');
  await expect(page.getByText('Watchlist')).toBeVisible();
  await expect(page.getByRole('heading', { name: /\uB85C\uADF8\uC778/ })).toBeVisible();

  await page.goto('/mypage');
  await expect(page.getByText('Account')).toBeVisible();
  await expect(page.getByRole('heading', { name: /\uB85C\uADF8\uC778/ })).toBeVisible();

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /\uAD00\uB9AC\uC790/ })).toBeVisible();
  expect(adminRequests).toBe(0);

  const suffix = Date.now();
  const username = `normal${suffix}`;
  const password = 'password123';
  const nickname = '\uC77C\uBC18 \uC0AC\uC6A9\uC790';
  try {
    await page.goto('/');
    await page.getByRole('button', { name: text.signup }).click();
    await page.getByPlaceholder(text.username).fill(username);
    await page.getByPlaceholder(text.password, { exact: true }).fill(password);
    await page.getByPlaceholder('\uBE44\uBC00\uBC88\uD638 \uD655\uC778').fill(password);
    await page.getByPlaceholder(text.name).fill(nickname);
    await page.getByPlaceholder(text.email).fill(`${username}@example.com`);
    await page.getByPlaceholder(text.phone).fill('010-0000-0000');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: text.submitSignup }).click();
    await expect(page.getByText(text.signupComplete)).toBeVisible();
    await expect(page.getByPlaceholder(text.username)).toHaveValue(username);
    await page.getByPlaceholder(text.password, { exact: true }).fill(password);
    await page.locator('form').getByRole('button', { name: text.login }).click();
    await expect(page.getByText(nickname)).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /\uAD00\uB9AC\uC790/ })).toBeVisible();
    expect(adminRequests).toBe(0);
  } finally {
    await deleteTestUser(request, username, password);
  }
});

test('AI endpoints are only called by explicit AI button clicks', async ({ page }) => {
  const aiCalls = [];
  await page.route('**/api/ai/**', async (route) => {
    aiCalls.push(route.request().url());
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'AI disabled in test', error: { code: 'AI_DISABLED' } }),
    });
  });

  await page.goto('/');
  await page.goto('/news');
  await page.goto('/detail/news/1');
  expect(aiCalls).toHaveLength(0);

  await page.getByRole('button', { name: '\u0041\u0049 \uC694\uC57D' }).click();
  await expect.poll(() => aiCalls.length).toBe(1);
});



test('unknown routes show a not found state', async ({ page }) => {
  await page.goto('/missing-route');
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByText('\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.')).toBeVisible();
  await expect(page.getByRole('link', { name: '\uD648\uC73C\uB85C \uC774\uB3D9' })).toBeVisible();
});
