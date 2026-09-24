import { describe, expect, it } from 'vitest';
import { parseSearch, projectPageUrl, searchFor } from '@/os/kernel/url';
import { buildVfs, nodeAt, resolvePath, walk } from '@/os/kernel/vfs';
import { osIndex } from './fixtures';

const slugs = new Set(['alfa', 'beta']);

describe('deep links', () => {
  it.each([
    ['?app=about', { appId: 'about', params: {} }],
    ['?progetto=alfa', { appId: 'project', params: { slug: 'alfa' } }],
    ['?app=career&isola=beta', { appId: 'career', params: { island: 'beta' } }],
    ['?app=career&isola=nessuna', { appId: 'career', params: {} }],
    ['?app=reader&progetto=alfa', { appId: 'reader', params: { slug: 'alfa' } }],
    ['?app=demo&progetto=beta', { appId: 'demo', params: { slug: 'beta' } }],
  ])('parses %s', (search, intent) => {
    expect(parseSearch(search, slugs)).toEqual(intent);
  });

  it.each(['', '?app=nope', '?progetto=nope', '?app=project', '?app=reader', '?app=demo'])(
    'ignores %s',
    (search) => {
      expect(parseSearch(search, slugs)).toBeNull();
    },
  );

  it('round-trips every intent it produces', () => {
    for (const search of [
      '?app=about',
      '?progetto=alfa',
      '?app=career&isola=beta',
      '?app=reader&progetto=alfa',
    ]) {
      expect(searchFor(parseSearch(search, slugs))).toBe(search);
    }
    expect(searchFor(null)).toBe('');
  });

  it('shares the static project page', () => {
    expect(projectPageUrl('https://example.com', 'alfa')).toBe('https://example.com/progetti/alfa');
  });
});

describe('virtual file system', () => {
  const root = buildVfs(osIndex);

  it('lists projects in route order with their files', () => {
    const progetti = nodeAt(root, ['progetti']);
    expect(progetti?.kind === 'folder' && progetti.children.map((c) => c.name)).toEqual([
      'alfa',
      'beta',
    ]);
    const beta = nodeAt(root, ['progetti', 'beta']);
    expect(beta?.kind === 'folder' && beta.children.map((c) => c.name)).toEqual([
      'Leggimi.md',
      'demo.lnk',
      'codice.url',
    ]);
  });

  it('resolves relative and home paths', () => {
    expect(resolvePath(root, ['progetti'], '../foto/viaggi')).toEqual(['foto', 'viaggi']);
    expect(resolvePath(root, ['progetti', 'alfa'], '~')).toEqual([]);
    expect(resolvePath(root, [], 'progetti/alfa/Leggimi.md')).toEqual([
      'progetti',
      'alfa',
      'Leggimi.md',
    ]);
    expect(resolvePath(root, [], 'progetti/zeta')).toBeNull();
  });

  it('walks every node once', () => {
    const paths = walk(root).map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('~/progetti/beta/demo.lnk');
  });
});
