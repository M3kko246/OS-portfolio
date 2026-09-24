import { env } from 'cloudflare:workers';

interface RateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

/**
 * Cloudflare's rate limiting binding (wrangler.jsonc, `CONTACT_LIMITER`): a few messages per
 * minute per address. Without the binding (local tools, another host) every request passes.
 */
export async function limitContact(address: string): Promise<boolean> {
  const limiter = (env as Record<string, unknown>).CONTACT_LIMITER as RateLimiter | undefined;
  if (!limiter) return true;
  const { success } = await limiter.limit({ key: address });
  return success;
}
