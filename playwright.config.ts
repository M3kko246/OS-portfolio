import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // A stuck run fails in minutes instead of holding the runner for hours.
  globalTimeout: CI ? 15 * 60_000 : 0,
  // In CI the list reporter shows progress in the live log; github adds annotations.
  reporter: CI ? [['list'], ['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 120_000,
    // SIGTERM lets astro preview stop workerd itself; a SIGKILL to the process group can leave
    // it holding the pipes open on Linux, and the test run never exits.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
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
