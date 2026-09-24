import type { APIRoute } from 'astro';
import { brandSvg } from '@/design/brand';

export const GET = (() =>
  new Response(brandSvg(), { headers: { 'Content-Type': 'image/svg+xml' } })) satisfies APIRoute;
