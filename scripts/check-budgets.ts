/**
 * JavaScript budgets from PROMPT.md §3.16, measured on the build: the gzip size of every script
 * `/` loads before any interaction (entry scripts and islands plus their static imports), and,
 * from T4, the Carriera bundle loaded on demand.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// With the Cloudflare adapter static files live in dist/client.
const dist = existsSync(join(process.cwd(), 'dist', 'client'))
  ? join(process.cwd(), 'dist', 'client')
  : join(process.cwd(), 'dist');
const BUDGET_INITIAL = 180 * 1024;

const STATIC_IMPORT = /(?:import|export)\s*(?:[\w*{}\s,$]*from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g;

async function gzipSize(file: string): Promise<number> {
  return gzipSync(await readFile(file), { level: 9 }).byteLength;
}

/** Follows static imports only: dynamic `import()` chunks load on demand. */
async function closure(entries: string[]): Promise<Set<string>> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const code = await readFile(file, 'utf8');
    for (const match of code.matchAll(STATIC_IMPORT)) {
      const spec = match[1];
      if (spec) queue.push(join(file, '..', spec));
    }
  }
  return seen;
}

const html = await readFile(join(dist, 'index.html'), 'utf8');
const urls = new Set<string>();
for (const match of html.matchAll(/(?:src|component-url|renderer-url)="(\/[^"]+\.js)"/g)) {
  if (match[1]) urls.add(match[1]);
}
for (const match of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="(\/[^"]+\.js)"/g)) {
  if (match[1]) urls.add(match[1]);
}
// Inline module scripts import chunks too.
for (const match of html.matchAll(/import\s*["'(](\/_astro\/[^"')]+\.js)["')]/g)) {
  if (match[1]) urls.add(match[1]);
}

const files = await closure([...urls].map((url) => join(dist, url)));
let total = 0;
const rows: [string, number][] = [];
for (const file of files) {
  const size = await gzipSize(file);
  total += size;
  rows.push([file.slice(dist.length), size]);
}
rows.sort((a, b) => b[1] - a[1]);
for (const [file, size] of rows.slice(0, 8)) {
  console.log(`${(size / 1024).toFixed(1).padStart(7)} KB  ${file}`);
}
const ok = total <= BUDGET_INITIAL;
console.log(
  `Initial JS on /: ${(total / 1024).toFixed(1)} KB gzip (budget ${BUDGET_INITIAL / 1024} KB) ${ok ? 'OK' : 'OVER BUDGET'}`,
);
if (!ok) process.exit(1);
