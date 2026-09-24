import { describe, expect, it } from 'vitest';
import { profile, profileSchema } from '@/data/profile';
import { t } from '@/i18n';
import { en } from '@/i18n/en';
import { it as italian } from '@/i18n/it';
import { formatPeriod } from '@/lib/format';

describe('profile', () => {
  it('is valid', () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it('rejects a short bio longer than 20 words', () => {
    const bioShort = Array.from({ length: 21 }, (_, i) => `parola${i}`).join(' ');
    expect(profileSchema.safeParse({ ...profile, bioShort }).success).toBe(false);
  });

  it('keeps the CV inside public/cv', () => {
    expect(profileSchema.safeParse({ ...profile, cv: { it: '/altro/CV.pdf' } }).success).toBe(
      false,
    );
  });
});

describe('i18n', () => {
  it('has the same keys in every language', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(italian).sort());
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(t('boot.projectsFound', { count: 6 })).toBe('Progetti trovati: 6');
    expect(t('nav.openOs')).toBe('Apri {os}');
    expect(t('nav.openOs', { os: 'PortoOS' }, 'en')).toBe('Open PortoOS');
  });
});

describe('formatPeriod', () => {
  it.each([
    ['2020-03', '2022-12', '2020-2022'],
    ['2023-01', null, '2023-oggi'],
    ['2021-02', '2021-09', '2021'],
  ])('%s to %s is %s', (start, end, expected) => {
    expect(formatPeriod(start, end)).toBe(expected);
  });
});
