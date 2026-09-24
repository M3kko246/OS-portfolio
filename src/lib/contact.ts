/**
 * Contact form rules shared by the Contatti app (instant feedback) and /api/contact (the
 * authority). Plain functions, no Zod on the client, so the form costs almost nothing.
 */
export const CONTACT_LIMITS = {
  name: 80,
  email: 254,
  subject: 120,
  message: 4000,
  messageMin: 10,
} as const;

/** Submissions faster than this after the form appeared are treated as bots. */
export const MIN_FILL_MS = 3000;

export type ContactField = 'name' | 'email' | 'subject' | 'message';

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;
export type ContactErrorCode = 'required' | 'tooLong' | 'tooShort' | 'email';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!name) errors.name = 'required';
  else if (name.length > CONTACT_LIMITS.name) errors.name = 'tooLong';

  if (!email) errors.email = 'required';
  else if (email.length > CONTACT_LIMITS.email) errors.email = 'tooLong';
  else if (!EMAIL.test(email)) errors.email = 'email';

  if (subject.length > CONTACT_LIMITS.subject) errors.subject = 'tooLong';

  if (!message) errors.message = 'required';
  else if (message.length < CONTACT_LIMITS.messageMin) errors.message = 'tooShort';
  else if (message.length > CONTACT_LIMITS.message) errors.message = 'tooLong';

  return errors;
}

export type ContactResponse =
  | { ok: true }
  | { ok: false; reason: 'invalid'; errors: ContactErrors }
  | { ok: false; reason: 'spam' | 'rate' | 'unavailable' | 'failed' };
