import type { APIRoute } from 'astro';
import { profile } from '@/data/profile';
import { renderOgPng } from '@/lib/og';

export const GET = (async () => {
  const png = await renderOgPng({
    window: profile.osName,
    title: profile.name,
    subtitle: profile.bioShort,
    footer: profile.role,
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}) satisfies APIRoute;
