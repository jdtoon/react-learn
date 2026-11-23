import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:4173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm preview',
    cwd: '../..',
    url: 'http://localhost:4173/react-learn/',
    reuseExistingServer: !process.env.CI,
  },
});
