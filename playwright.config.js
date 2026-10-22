// Browser tests: accessibility (axe), keyboard play-through, storage, pause,
// file:// loading and the Storyline harness. Run: npm run test:browser
// (first time only: npx playwright install chromium)

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/browser',
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/',
  },
  webServer: {
    command: 'node scripts/serve.js --port 4173',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
