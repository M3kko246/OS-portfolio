import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { brandSvgFlat } from '@/design/brand';
import { palette } from '@/design/palette';

// 16x16 mark scaled 2x with nearest neighbour: every art pixel stays a crisp 2x2 block.
export const GET = (async () => {
  const png = await sharp(Buffer.from(brandSvgFlat(palette.ink, palette.sun)))
    .resize(32, 32, { kernel: 'nearest' })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}) satisfies APIRoute;
