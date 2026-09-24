import { describe, expect, it } from 'vitest';
import { CONTACT_LIMITS, validateContact } from '@/lib/contact';

const valid = {
  name: 'Ada',
  email: 'ada@example.org',
  subject: '',
  message: 'Vorrei parlare di un progetto.',
};

describe('contact rules', () => {
  it('accepts a complete message with an optional empty subject', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('reports every missing required field', () => {
    expect(validateContact({ name: ' ', email: '', subject: '', message: '' })).toEqual({
      name: 'required',
      email: 'required',
      message: 'required',
    });
  });

  it.each(['ada', 'ada@', 'ada@example', 'ada example@x.it'])('rejects the email %s', (email) => {
    expect(validateContact({ ...valid, email }).email).toBe('email');
  });

  it('enforces the length limits', () => {
    expect(validateContact({ ...valid, message: 'corto' }).message).toBe('tooShort');
    expect(
      validateContact({ ...valid, message: 'x'.repeat(CONTACT_LIMITS.message + 1) }).message,
    ).toBe('tooLong');
    expect(validateContact({ ...valid, name: 'x'.repeat(CONTACT_LIMITS.name + 1) }).name).toBe(
      'tooLong',
    );
    expect(
      validateContact({ ...valid, subject: 'x'.repeat(CONTACT_LIMITS.subject + 1) }).subject,
    ).toBe('tooLong');
  });
});
