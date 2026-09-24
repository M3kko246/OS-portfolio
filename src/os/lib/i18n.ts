import { useCallback } from 'react';
import { t, type MessageKey } from '@/i18n';
import { useSettings } from '@/os/kernel/settings';

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** UI strings in the language chosen in Settings. */
export function useT(): Translate {
  const lang = useSettings((s) => s.lang);
  return useCallback((key, vars = {}) => t(key, vars, lang), [lang]);
}

export function shortcutLabel(key: string): string {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  return `${mac ? 'Cmd' : 'Ctrl'}+${key}`;
}
