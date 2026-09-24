import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Plain Vitest (not Astro's getViteConfig): the Cloudflare adapter would move tests into workerd.
// Unit tests cover pure modules, which only need the `@` alias.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
