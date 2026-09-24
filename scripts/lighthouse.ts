/**
 * Lighthouse (mobile profile, simulated 4G) against the built site, with the thresholds of
 * PROMPT.md §1.3. Uses Playwright's Chromium over CDP, which avoids chrome-launcher's profile
 * clean-up failures on Windows. Run after `pnpm build`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { preview } from 'astro';
import lighthouse from 'lighthouse';

const PORT = 4323;
const CDP_PORT = 9223;
const base = `http://localhost:${PORT}`;

type Category = 'performance' | 'accessibility' | 'best-practices' | 'seo';
const strict: Record<Category, number> = {
  performance: 0.95,
  accessibility: 1,
  'best-practices': 0.95,
  seo: 1,
};
const targets: { path: string; min: Partial<Record<Category, number>> }[] = [
  { path: '/', min: { performance: 0.85, accessibility: 0.95 } },
  { path: '/classica', min: strict },
  { path: '/progetti/progetto-1', min: strict },
];

const server = await preview({ server: { port: PORT }, logLevel: 'error' });
const failures: string[] = [];
try {
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${CDP_PORT}`] });
  await mkdir('.lighthouseci', { recursive: true });
  try {
    for (const target of targets) {
      const result = await lighthouse(`${base}${target.path}`, {
        port: CDP_PORT,
        output: 'html',
        logLevel: 'error',
      });
      if (!result) throw new Error(`No result for ${target.path}`);
      const name = target.path === '/' ? 'home' : target.path.replaceAll('/', '_').slice(1);
      await writeFile(`.lighthouseci/${name}.html`, result.report as string);
      const scores = Object.entries(result.lhr.categories).map(([id, category]) => {
        const score = category.score ?? 0;
        const min = target.min[id as Category];
        const ok = min === undefined || score >= min;
        if (!ok) failures.push(`${target.path} ${id}`);
        return `${id} ${Math.round(score * 100)}${min === undefined ? '' : ` (min ${min * 100})`}${ok ? '' : ' FAIL'}`;
      });
      const lcp = result.lhr.audits['largest-contentful-paint']?.displayValue ?? '?';
      const cls = result.lhr.audits['cumulative-layout-shift']?.displayValue ?? '?';
      console.log(`${target.path.padEnd(24)} ${scores.join(' | ')} | LCP ${lcp} | CLS ${cls}`);
      for (const category of Object.values(result.lhr.categories)) {
        for (const ref of category.auditRefs) {
          const audit = result.lhr.audits[ref.id];
          if (
            ref.weight > 0 &&
            audit?.score !== null &&
            audit?.score !== undefined &&
            audit.score < 1
          ) {
            console.log(`  ${category.id}: ${audit.id} (${audit.title})`);
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
} finally {
  await server.stop();
}
process.exit(failures.length > 0 ? 1 : 0);
