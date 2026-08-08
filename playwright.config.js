import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node server/auth-server.js',
      url: 'http://127.0.0.1:3001/api/auth/health',
      reuseExistingServer: true,
    },
    {
      command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  ],
});
