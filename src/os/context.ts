import { createContext, use } from 'react';
import type { OsIndex } from './types';

export const OsIndexContext = createContext<OsIndex | null>(null);

export function useOsIndex(): OsIndex {
  const index = use(OsIndexContext);
  if (!index) throw new Error('useOsIndex needs <OsIndexContext>');
  return index;
}
