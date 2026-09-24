/**
 * Subsets the two font families from their official sources in art/fonts:
 * - woff2 for the site (loaded through Astro's Fonts API);
 * - static sfnt files for build-time social images (Satori cannot read woff2 or variable fonts).
 * Fails if a font lacks a character Italian copy needs.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Blob, Face } from 'harfbuzzjs';
import subsetFont from 'subset-font';

const REQUIRED = ['à', 'è', 'é', 'ì', 'ò', 'ù', 'È', '€'];

function range(from: number, to: number): string {
  let out = '';
  for (let cp = from; cp <= to; cp++) out += String.fromCodePoint(cp);
  return out;
}

// Latin, Latin-1, curly quotes, ellipsis, bullet, euro, arrows. En and em dashes are left out on
// purpose: visible copy must not use them (PROMPT.md §4.13).
const TEXT = [range(0x20, 0x7e), range(0xa0, 0xff), '‘’“”…•€', range(0x2190, 0x2193)].join('');

// Box drawing and block elements for the terminal and the ASCII mark.
const PIXEL_TEXT = TEXT + range(0x2500, 0x259f);

const root = new URL('../', import.meta.url);
const src = (name: string) => new URL(`art/fonts/${name}`, root);
const out = (name: string) => new URL(`src/assets/fonts/${name}`, root);

function assertCoverage(file: URL, font: Buffer): void {
  const face = new Face(new Blob(new Uint8Array(font)), 0);
  const codepoints = new Set(face.collectUnicodes());
  const missing = REQUIRED.filter((ch) => !codepoints.has(ch.codePointAt(0) ?? -1));
  if (missing.length > 0) {
    throw new Error(`${file.pathname} is missing: ${missing.join(' ')}`);
  }
}

await mkdir(out('og/'), { recursive: true });

const departure = await readFile(src('DepartureMono-Regular.otf'));
const atkinson = await readFile(src('AtkinsonHyperlegibleNext[wght].ttf'));
assertCoverage(src('DepartureMono-Regular.otf'), departure);
assertCoverage(src('AtkinsonHyperlegibleNext[wght].ttf'), atkinson);

const jobs: [string, Promise<Buffer>][] = [
  ['DepartureMono-Regular.woff2', subsetFont(departure, PIXEL_TEXT, { targetFormat: 'woff2' })],
  ['AtkinsonHyperlegibleNext.woff2', subsetFont(atkinson, TEXT, { targetFormat: 'woff2' })],
  ['og/DepartureMono-Regular.otf', subsetFont(departure, TEXT, { targetFormat: 'sfnt' })],
  [
    'og/AtkinsonHyperlegibleNext-Regular.ttf',
    subsetFont(atkinson, TEXT, { targetFormat: 'sfnt', variationAxes: { wght: 400 } }),
  ],
  [
    'og/AtkinsonHyperlegibleNext-Bold.ttf',
    subsetFont(atkinson, TEXT, { targetFormat: 'sfnt', variationAxes: { wght: 700 } }),
  ],
];

for (const [name, job] of jobs) {
  const data = await job;
  await writeFile(out(name), data);
  console.log(`${name.padEnd(42)} ${(data.byteLength / 1024).toFixed(1)} KB`);
}
