import type { APIRoute } from 'astro';
import { CONTACT_FROM, CONTACT_TO, RESEND_API_KEY } from 'astro:env/server';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import { CONTACT_LIMITS, MIN_FILL_MS, validateContact, type ContactResponse } from '@/lib/contact';
import { limitContact } from '@/lib/rate-limit';

// The only on-demand route: everything else is prerendered.
export const prerender = false;

const body = z.object({
  name: z.string().max(CONTACT_LIMITS.name * 2),
  email: z.string().max(CONTACT_LIMITS.email * 2),
  subject: z
    .string()
    .max(CONTACT_LIMITS.subject * 2)
    .default(''),
  message: z.string().max(CONTACT_LIMITS.message * 2),
  // Honeypot: humans never see this field, bots fill it.
  website: z.string().default(''),
  // Milliseconds the form was on screen before sending.
  elapsed: z.number().int().nonnegative(),
});

function reply(result: ContactResponse, status: number): Response {
  return new Response(JSON.stringify(result), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST = (async ({ request, clientAddress }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ ok: false, reason: 'failed' }, 400);
  const input = parsed.data;

  // Bots get a success-shaped answer and nothing is sent.
  if (input.website !== '' || input.elapsed < MIN_FILL_MS) return reply({ ok: true }, 200);

  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) return reply({ ok: false, reason: 'invalid', errors }, 422);

  if (!(await limitContact(clientAddress))) return reply({ ok: false, reason: 'rate' }, 429);

  if (!RESEND_API_KEY || !CONTACT_TO) return reply({ ok: false, reason: 'unavailable' }, 503);

  const { error } = await new Resend(RESEND_API_KEY).emails.send({
    from: CONTACT_FROM,
    to: CONTACT_TO,
    replyTo: input.email.trim(),
    subject: input.subject.trim() || `Messaggio da ${input.name.trim()}`,
    text: `${input.message.trim()}\n\n${input.name.trim()} <${input.email.trim()}>`,
  });
  if (error) return reply({ ok: false, reason: 'failed' }, 502);
  return reply({ ok: true }, 200);
}) satisfies APIRoute;
