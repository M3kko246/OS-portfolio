import { en } from './en';
import { it } from './it';

export type Lang = 'it' | 'en';
export type MessageKey = keyof typeof it;
export type Messages = Record<MessageKey, string>;

const dictionaries: Record<Lang, Messages> = { it, en };

/** Looks up a UI string and fills `{name}` placeholders. */
export function t(key: MessageKey, vars: Record<string, string | number> = {}, lang: Lang = 'it') {
  return dictionaries[lang][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
