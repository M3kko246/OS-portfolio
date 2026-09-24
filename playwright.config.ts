import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // WebGL in headless Chromium runs on SwiftShader, which needs an explicit opt-in.
        launchOptions: { args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
  ],
});
