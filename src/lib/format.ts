import { t } from '@/i18n';

/** `2020-2022`, `2023-oggi`, or a single year. */
export function formatPeriod(start: string, end: string | null): string {
  const from = start.slice(0, 4);
  const to = end === null ? t('path.present') : end.slice(0, 4);
  return from === to ? from : `${from}-${to}`;
}
