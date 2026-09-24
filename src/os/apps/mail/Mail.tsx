import '../apps.css';
import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';
import {
  CONTACT_LIMITS,
  validateContact,
  type ContactErrorCode,
  type ContactErrors,
  type ContactField,
  type ContactInput,
  type ContactResponse,
} from '@/lib/contact';
import { useOsIndex } from '@/os/context';
import type { AppProps } from '@/os/apps/manifest';
import { announce } from '@/os/lib/announce';
import { useT, type Translate } from '@/os/lib/i18n';
import { cx } from '@/os/ui/primitives';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; reason: 'failed' | 'rate' | 'unavailable' | 'network' };

function errorText(t: Translate, field: ContactField, code: ContactErrorCode): string {
  switch (code) {
    case 'required':
      return field === 'name'
        ? t('mail.err.required.name')
        : field === 'email'
          ? t('mail.err.required.email')
          : t('mail.err.required.message');
    case 'email':
      return t('mail.err.email');
    case 'tooShort':
      return t('mail.err.tooShort', { min: CONTACT_LIMITS.messageMin });
    case 'tooLong':
      return t('mail.err.tooLong', { max: CONTACT_LIMITS[field] });
  }
}

export default function Mail({ params }: AppProps) {
  const t = useT();
  const { profile } = useOsIndex();
  const baseId = useId();
  const startedAtRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ContactInput>({
    name: '',
    email: '',
    subject: params.subject ?? '',
    message: params.body ?? '',
  });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);

  // The time on screen before sending is one of the anti-spam signals.
  useEffect(() => {
    startedAtRef.current = performance.now();
  }, []);

  const set = (field: ContactField) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const copyEmail = () => {
    void navigator.clipboard.writeText(profile.email).then(() => {
      setCopied(true);
      announce(t('mail.copied'));
    });
  };

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    const first = (Object.keys(found) as ContactField[])[0];
    if (first) {
      announce(t('mail.error.fields'));
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus({ kind: 'sending' });
    const website =
      formRef.current?.querySelector<HTMLInputElement>('[name="website"]')?.value ?? '';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          website,
          elapsed: Math.round(performance.now() - startedAtRef.current),
        }),
      });
      const result = (await response.json()) as ContactResponse;
      if (result.ok) {
        setStatus({ kind: 'sent' });
        announce(t('mail.sent'));
      } else if (result.reason === 'invalid') {
        setErrors(result.errors);
        setStatus({ kind: 'idle' });
      } else {
        setStatus({ kind: 'error', reason: result.reason === 'spam' ? 'failed' : result.reason });
      }
    } catch {
      setStatus({ kind: 'error', reason: 'network' });
    }
  };

  const direct = (
    <aside className="mail-direct" aria-labelledby={`${baseId}-direct`}>
      <h3 id={`${baseId}-direct`} className="font-bold">
        {t('mail.direct')}
      </h3>
      <p>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
      <p>
        <button type="button" className="px-btn" onClick={copyEmail}>
          {copied ? t('mail.copied') : t('mail.copyEmail')}
        </button>
      </p>
      {profile.socials.length > 0 && (
        <ul className="mail-socials">
          {profile.socials.map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="me noopener noreferrer" target="_blank">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  if (status.kind === 'sent') {
    return (
      <div className="app-mail">
        <div className="mail-sent" role="status">
          <h3 className="text-read-lg font-bold">{t('mail.sent')}</h3>
          <p>{t('mail.sentBody')}</p>
          <p>
            <button
              type="button"
              className="px-btn"
              onClick={() => {
                setValues({ name: values.name, email: values.email, subject: '', message: '' });
                startedAtRef.current = performance.now();
                setStatus({ kind: 'idle' });
              }}
            >
              {t('mail.again')}
            </button>
          </p>
        </div>
        {direct}
      </div>
    );
  }

  const field = (name: ContactField, label: string, multiline = false) => {
    const id = `${baseId}-${name}`;
    const error = errors[name];
    const props = {
      id,
      name,
      value: values[name],
      className: cx('px-field', error && 'has-error'),
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-error` : undefined,
      maxLength: CONTACT_LIMITS[name] * 2,
    };
    return (
      <div className="field">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {multiline ? (
          <textarea
            {...props}
            rows={7}
            onChange={(e) => {
              set(name)(e.target.value);
            }}
          />
        ) : (
          <input
            {...props}
            type={name === 'email' ? 'email' : 'text'}
            autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : 'off'}
            onChange={(e) => {
              set(name)(e.target.value);
            }}
          />
        )}
        {error && (
          <p id={`${id}-error`} className="px-error field-error">
            {errorText(t, name, error)}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="app-mail">
      <form
        ref={formRef}
        className="mail-form"
        noValidate
        onSubmit={(e) => {
          void submit(e);
        }}
      >
        {field('name', t('mail.name'))}
        {field('email', t('mail.email'))}
        {field('subject', t('mail.subject'))}
        {field('message', t('mail.message'), true)}
        {/* Honeypot: hidden from people and assistive tech, filled only by bots. */}
        <div className="mail-trap" aria-hidden="true">
          <label>
            {t('mail.website')}
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {status.kind === 'error' && (
          <div className="mail-error" role="alert">
            <p className="font-bold">{t('mail.errorTitle')}</p>
            <p>{t(`mail.error.${status.reason}`)}</p>
            <p>{t('mail.alternative', { email: profile.email })}</p>
            <p className="flex flex-wrap gap-8">
              <button type="button" className="px-btn" onClick={copyEmail}>
                {copied ? t('mail.copied') : t('mail.copyEmail')}
              </button>
              <a className="px-btn" href={`mailto:${profile.email}`}>
                {t('mail.openClient')}
              </a>
            </p>
          </div>
        )}
        <p>
          <button
            type="submit"
            className="px-btn px-btn-primary"
            disabled={status.kind === 'sending'}
          >
            {status.kind === 'sending' ? t('mail.sending') : t('mail.send')}
          </button>
        </p>
      </form>
      {direct}
    </div>
  );
}
