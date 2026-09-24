import { readFile, writeFile } from 'node:fs/promises';
import { renderTokensCss } from '../src/design/tokens';

const target = new URL('../src/styles/tokens.css', import.meta.url);
const next = renderTokensCss();

if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8').catch(() => '');
  if (current !== next) {
    console.error('src/styles/tokens.css is out of date: run `pnpm tokens`.');
    process.exit(1);
  }
  console.log('tokens.css is up to date.');
} else {
  await writeFile(target, next);
  console.log('Wrote src/styles/tokens.css');
}
