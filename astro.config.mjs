// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';

// The real domain is still [DA COMPILARE] (CONTENT_TODO.md): set SITE_URL when deploying.
const site = process.env.SITE_URL ?? 'https://example.com';

/**
 * Origins of demos declared as embeddable in the projects (`demo.kind: embed`): the only
 * third-party frames the CSP allows.
 */
function demoOrigins() {
  const dir = new URL('./src/content/projects/', import.meta.url);
  const origins = new Set();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const frontmatter = readFileSync(new URL(file, dir), 'utf8').split('---')[1] ?? '';
    const demo = /^demo:\s*\n((?:[ \t]+.*\n?)+)/m.exec(frontmatter)?.[1] ?? '';
    const url = /url:\s*["']?([^"'\s]+)/.exec(demo)?.[1];
    if (/kind:\s*["']?embed/.test(demo) && url) origins.add(new URL(url).origin);
  }
  return [...origins];
}

export default defineConfig({
  site,
  // `/classica.html` is served at `/classica` without a redirect, matching the canonical URLs.
  build: { format: 'file' },
  trailingSlash: 'never',
  adapter: cloudflare({
    // Build-time pages use Node APIs (fs, sharp, Satori); only /api/contact runs on workerd.
    prerenderEnvironment: 'node',
    imageService: 'compile',
  }),
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/data/') })],
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM: envField.string({
        context: 'server',
        access: 'secret',
        default: 'Portfolio <onboarding@resend.dev>',
      }),
    },
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
        /** @type {`frame-src ${string}`} */ (`frame-src 'self' ${demoOrigins().join(' ')}`.trim()),
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
