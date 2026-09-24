export const appIds = [
  'welcome',
  'career',
  'explorer',
  'project',
  'reader',
  'demo',
  'photos',
  'about',
  'cv',
  'mail',
  'terminal',
  'settings',
  'trash',
] as const;

export type AppId = (typeof appIds)[number];

export type AppParams = Readonly<Record<string, string>>;

export function isAppId(value: string): value is AppId {
  return (appIds as readonly string[]).includes(value);
}
