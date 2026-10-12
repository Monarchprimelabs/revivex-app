import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests run against the exported web builds of both apps
 * (npm run export:web) at phone width. Native-only paths (GPS, Health, maps,
 * purchases) are out of scope here and covered by the device checklist.
 */
const chromium = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '.report' }]],
  outputDir: '.results',
  use: {
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: existsSync(chromium) ? { executablePath: chromium } : undefined,
  },
  projects: [
    { name: 'direction-a', testMatch: /direction-a\.spec\.ts/, use: { baseURL: 'http://127.0.0.1:4311' } },
    { name: 'direction-b', testMatch: /direction-b\.spec\.ts/, use: { baseURL: 'http://127.0.0.1:4312' } },
    // Real Supabase project; skipped unless REVIVEX_LIVE=1 (npm run e2e:live).
    { name: 'live', testMatch: /live-sync\.spec\.ts/ },
  ],
  webServer: [
    { command: 'node serve.mjs .build/web-a 4311', url: 'http://127.0.0.1:4311', reuseExistingServer: true, timeout: 30_000 },
    { command: 'node serve.mjs .build/web-b 4312', url: 'http://127.0.0.1:4312', reuseExistingServer: true, timeout: 30_000 },
    // Local Supabase stand-in for npm run e2e:mock (builds exported against http://127.0.0.1:54329).
    ...(process.env.REVIVEX_MOCK === '1'
      ? [{ command: 'node mock-supabase.mjs 54329', url: 'http://127.0.0.1:54329/health', reuseExistingServer: false, timeout: 30_000 }]
      : []),
  ],
});
