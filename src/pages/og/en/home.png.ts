import type { APIRoute } from 'astro';
import { homeImage } from '@/lib/endpoints';

export const GET = (() => homeImage('en')) satisfies APIRoute;
