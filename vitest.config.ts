import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Plain Vitest (not Astro's getViteConfig): the Cloudflare adapter would move tests into workerd.
// Unit tests run in Node; `*.browser.test.ts` run in Chromium for real WebGL.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/**/*.browser.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['tests/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: { args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
