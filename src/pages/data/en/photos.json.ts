import type { APIRoute } from 'astro';
import { photos } from '@/lib/endpoints';

export const GET = (() => photos('en')) satisfies APIRoute;
