/**
 * Renders the four desktop wallpapers (dawn, day, dusk, night) from the game world and writes
 * them into src/assets/wallpapers with wallpapers.json (sea colours, night-light positions). Also keeps the unquantized
 * first render for the Cestino, as a real discarded draft.
 *
 * Runs `astro dev` (the /dev/wallpaper route only exists there) and headless Chromium with
 * SwiftShader, so it needs no GPU. Run it again after changing projects: `pnpm wallpapers`.
 * The build fails while the wallpapers do not match the content (src/pages/index.astro).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { dev } from 'astro';
import { format } from 'prettier';
import sharp from 'sharp';
import { hexToOklab, hexToRgb } from '../src/design/color';
import { palette, paletteNames } from '../src/design/palette';
import { timesOfDay } from '../src/design/time';

const WIDTH = 480;
const HEIGHT = 270;
const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = new URL('../src/assets/wallpapers/', import.meta.url);
const trashDir = new URL('../src/assets/trash/', import.meta.url);

const paletteRgb = paletteNames.map((name) =>
  hexToRgb(palette[name]).map((v) => Math.round(v * 255)),
);
const paletteLab = paletteNames.map((name) => hexToOklab(palette[name]));

/** Every pixel to the nearest palette colour in OKLab. Returns how many were not exact. */
function snapToPalette(pixels: Buffer): number {
  let off = 0;
  for (let i = 0; i < pixels.length; i += 3) {
    const [r = 0, g = 0, b = 0] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    if (paletteRgb.some(([pr, pg, pb]) => pr === r && pg === g && pb === b)) continue;
    off++;
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    const [l, a, bb] = hexToOklab(hex);
    let best = 0;
    let bestDistance = Infinity;
    paletteLab.forEach(([pl, pa, pb], k) => {
      const d = (l - pl) ** 2 + (a - pa) ** 2 + (bb - pb) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = k;
      }
    });
    pixels.set(paletteRgb[best] ?? [0, 0, 0], i);
  }
  return off;
}

/**
 * The one colour along the whole border (open sea). The desktop fills the space around the
 * wallpaper with it, so the image can keep a whole-number scale without cropping the islands.
 */
function edgeColor(pixels: Buffer): string {
  const colors = new Set<string>();
  const at = (x: number, y: number) => {
    const i = (y * WIDTH + x) * 3;
    colors.add(
      `#${[pixels[i], pixels[i + 1], pixels[i + 2]].map((v = 0) => v.toString(16).padStart(2, '0')).join('')}`,
    );
  };
  for (let x = 0; x < WIDTH; x++) {
    at(x, 0);
    at(x, HEIGHT - 1);
  }
  for (let y = 0; y < HEIGHT; y++) {
    at(0, y);
    at(WIDTH - 1, y);
  }
  const [color, ...others] = colors;
  if (!color || others.length > 0)
    throw new Error(`The border is not open sea: ${[...colors].join(', ')}`);
  return color;
}

/** Indexed PNG when it keeps every colour exact, true colour otherwise. */
async function encode(pixels: Buffer): Promise<Buffer> {
  const raw = { raw: { width: WIDTH, height: HEIGHT, channels: 3 as const } };
  const indexed = await sharp(pixels, raw)
    .png({ palette: true, colours: 16, dither: 0, compressionLevel: 9, effort: 10 })
    .toBuffer();
  const check = await sharp(indexed).removeAlpha().raw().toBuffer();
  if (check.equals(pixels)) return indexed;
  return sharp(pixels, raw).png({ compressionLevel: 9 }).toBuffer();
}

const server = await dev({ root, logLevel: 'warn', server: { port: 4399 } });
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const base = `http://localhost:${String(server.address.port)}/dev/wallpaper`;
  await mkdir(outDir, { recursive: true });
  await mkdir(trashDir, { recursive: true });

  const capture = async (query: string) => {
    await page.goto(`${base}?${query}`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, {
      timeout: 120_000,
    });
    // Straight from the drawing buffer: a screenshot would go through the compositor's colour
    // management and shift some pixels off the palette.
    const dataUrl = await page.evaluate(() => document.querySelector('canvas')?.toDataURL() ?? '');
    const png = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    const pixels = await sharp(png).removeAlpha().raw().toBuffer();
    const result = await page.evaluate(() => window.__wallpaper);
    if (!result) throw new Error('The studio did not report its lights.');
    return { png, pixels, result };
  };

  let lights: Record<string, [number, number]> = {};
  let key = '';
  const sea: Record<string, string> = {};
  for (const time of timesOfDay) {
    const { pixels, result } = await capture(`time=${time}`);
    const off = snapToPalette(pixels);
    // The quantize pass already writes palette colours: more than a trace means a broken pipeline.
    if (off > pixels.length / 3 / 200) {
      throw new Error(`${time}: ${String(off)} pixels outside the palette.`);
    }
    sea[time] = edgeColor(pixels);
    await writeFile(new URL(`${time}.png`, outDir), await encode(pixels));
    ({ lights, key } = result);
    console.log(`${time}.png written (${String(off)} pixels snapped to the palette).`);
  }
  await writeFile(
    new URL('wallpapers.json', outDir),
    await format(JSON.stringify({ key, width: WIDTH, height: HEIGHT, sea, lights }), {
      parser: 'json',
    }),
  );

  const draft = await capture('time=day&raw=1');
  await writeFile(
    new URL('sfondo-senza-palette.png', trashDir),
    await sharp(draft.png).png({ compressionLevel: 9 }).toBuffer(),
  );
  console.log('wallpapers.json and the unquantized draft for the Cestino written.');
} finally {
  await browser.close();
  await server.stop();
}
