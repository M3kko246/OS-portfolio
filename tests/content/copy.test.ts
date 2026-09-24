import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '../..');
const TEXT_FILE = /\.(astro|ts|tsx|md|json)$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return TEXT_FILE.test(name) ? [path] : [];
  });
}

const files = ['src/content', 'src/data', 'src/i18n', 'src/pages', 'src/components', 'src/assets']
  .map((dir) => join(root, dir))
  .flatMap(walk);

describe('visible copy (PROMPT.md §4.13)', () => {
  it.each(files.map((file) => [relative(root, file), file]))(
    '%s has no en or em dashes',
    (_name, file) => {
      const lines = readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => [i + 1, line] as const)
        .filter(([, line]) => /[–—]/.test(line));
      expect(lines).toEqual([]);
    },
  );
});
