// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// The real domain is still [DA COMPILARE] (CONTENT_TODO.md): set SITE_URL when deploying.
const site = process.env.SITE_URL ?? 'https://example.com';

export default defineConfig({
  site,
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-src 'none'",
        "manifest-src 'self'",
        "worker-src 'self'",
      ],
    },
  },
  markdown: {
    // Shiki writes inline styles, which the CSP forbids; Prism only adds classes.
    syntaxHighlight: 'prism',
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Departure Mono',
      cssVariable: '--ff-pixel',
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/DepartureMono-Regular.woff2'],
            weight: 400,
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Atkinson Hyperlegible Next',
      cssVariable: '--ff-read',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/AtkinsonHyperlegibleNext.woff2'],
            weight: '200 800',
            style: 'normal',
          },
        ],
      },
    },
  ],
});
