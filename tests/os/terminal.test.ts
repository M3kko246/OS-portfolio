import { describe, expect, it } from 'vitest';
import { t as translate } from '@/i18n';
import {
  COMMANDS,
  complete,
  execute,
  initialShell,
  promptFor,
  tokenize,
  type Line,
  type ShellContext,
  type ShellState,
} from '@/os/apps/terminal/shell';
import { buildVfs } from '@/os/kernel/vfs';
import { osIndex } from './fixtures';

const ctx: ShellContext = {
  root: buildVfs(osIndex),
  index: osIndex,
  t: (key, vars) => translate(key, vars, 'it'),
  appNames: { career: 'Carriera', explorer: 'Progetti', cv: 'CV.pdf', mail: 'Contatti' },
  now: new Date(2026, 8, 24, 21, 30),
  lang: 'it',
  system: { screen: '1920x1080', theme: 'Auto' },
};

const text = (line: Line | undefined) => line?.segments.map((s) => s.text).join('') ?? '';
const run = (input: string, state: ShellState = initialShell) => execute(input, state, ctx);

describe('terminal parser', () => {
  it('splits arguments and keeps quoted spaces', () => {
    expect(tokenize('echo "a  b" c')).toEqual(['echo', 'a  b', 'c']);
    expect(tokenize("  cd  'foto'  ")).toEqual(['cd', 'foto']);
  });

  it('answers unknown commands with the way out', () => {
    const { lines } = run('pippo');
    expect(lines[0]?.tone).toBe('error');
    expect(text(lines[0])).toContain('help');
  });

  it('lists every command in help', () => {
    const { lines } = run('help');
    for (const cmd of COMMANDS) expect(lines.some((l) => text(l).startsWith(cmd))).toBe(true);
  });

  it('records history once per repeated command', () => {
    let state = run('pwd').state;
    state = run('pwd', state).state;
    state = run('ls', state).state;
    expect(state.history).toEqual(['pwd', 'ls']);
    expect(text(run('history', state).lines[0])).toContain('1  pwd');
  });

  it('lists folders with clickable names', () => {
    const [line] = run('ls').lines;
    const items = line?.segments.filter((s) => s.text.trim() !== '') ?? [];
    expect(items.map((s) => s.text)).toEqual(['Leggimi.txt', 'CV.pdf', 'progetti/', 'foto/']);
    expect(items[0]?.open).toEqual({ appId: 'welcome', params: {} });
    expect(items[2]?.run).toBe('ls ~/progetti');
  });

  it('moves between folders, forgiving the case', () => {
    const inside = run('cd PROGETTI').state;
    expect(inside.cwd).toEqual(['progetti']);
    expect(promptFor(inside)).toBe('~/progetti $');
    expect(run('cd beta', inside).state.cwd).toEqual(['progetti', 'beta']);
    expect(run('cd ..', inside).state.cwd).toEqual([]);
    expect(run('cd', inside).state.cwd).toEqual([]);
    expect(run('cd Leggimi.txt').lines[0]?.tone).toBe('error');
    expect(run('cd nessuna').lines[0]?.tone).toBe('error');
  });

  it('prints text files and explains the others', () => {
    expect(run('cat Leggimi.txt').lines.map(text)).toEqual(['# Nome Cognome', 'Ruolo', '', 'Bio']);
    const binary = run('cat CV.pdf').lines;
    expect(binary[0]?.tone).toBe('error');
    expect(binary[1]?.segments[0]?.open).toEqual({ appId: 'cv', params: {} });
    expect(text(run('cat progetti').lines[0])).toContain('ls progetti');
    expect(text(run('cat').lines[0])).toContain('cat <file>');
  });

  it('opens files, apps and projects', () => {
    expect(run('open CV.pdf').effects).toEqual([
      { type: 'open', intent: { appId: 'cv', params: {} } },
    ]);
    expect(run('open carriera').effects).toEqual([
      { type: 'open', intent: { appId: 'career', params: {} } },
    ]);
    expect(run('open beta').effects).toEqual([
      { type: 'open', intent: { appId: 'project', params: { slug: 'beta' } } },
    ]);
    expect(run('open progetti/beta/codice.url').effects).toEqual([
      { type: 'href', url: 'https://example.com/r' },
    ]);
    expect(run('open niente').lines[0]?.tone).toBe('error');
  });

  it('lists projects in route order with clickable titles', () => {
    const { lines } = run('progetti');
    expect(lines.slice(0, 2).map(text)).toEqual(['2021  Progetto alfa', '2022  Progetto beta']);
    expect(lines[0]?.segments[1]?.open).toEqual({ appId: 'project', params: { slug: 'alfa' } });
  });

  it('shows contacts with a mail link', () => {
    const [email] = run('contatti').lines;
    expect(email?.segments[1]).toEqual({
      text: 'nome@example.com',
      href: 'mailto:nome@example.com',
    });
  });

  it('changes theme and language only with valid values', () => {
    expect(run('theme notte').effects).toEqual([{ type: 'theme', value: 'dark' }]);
    expect(run('theme giorno').effects).toEqual([{ type: 'theme', value: 'light' }]);
    expect(run('theme blu').lines[0]?.tone).toBe('error');
    expect(run('lang en').effects).toEqual([{ type: 'lang', value: 'en' }]);
    expect(run('lang fr').effects).toEqual([]);
  });

  it('has the small commands', () => {
    expect(run('clear').effects).toEqual([{ type: 'clear' }]);
    expect(run('exit').effects).toEqual([{ type: 'exit' }]);
    expect(text(run('echo "due  spazi"').lines[0])).toBe('due  spazi');
    expect(text(run('sudo rm -rf /').lines[0])).toBe('Permesso negato.');
    expect(text(run('date').lines[0])).toContain('2026');
    expect(text(run('whoami').lines[0])).toBe('ospite');
  });

  it('prints the system card with the ASCII mark', () => {
    const [card] = run('info').lines;
    expect(card?.pre).toBe(true);
    expect(text(card)).toContain('Nome@NomeOS');
    expect(text(card)).toContain('@@@@');
    expect(text(card)).toContain('1920x1080');
  });

  it('points albums to Foto instead of listing nothing', () => {
    const [line] = run('ls foto/viaggi').lines;
    expect(line?.segments[1]?.open).toEqual({ appId: 'photos', params: { album: 'viaggi' } });
  });
});

describe('terminal completion', () => {
  it('completes a single command', () => {
    expect(complete('he', initialShell, ctx)).toEqual({ input: 'help ', options: [] });
  });

  it('offers the choices when a prefix is ambiguous', () => {
    const result = complete('c', initialShell, ctx);
    expect(result.input).toBe('c');
    expect(result.options).toEqual(['cd', 'cat', 'cv', 'contatti', 'clear']);
  });

  it('completes paths and fixed arguments', () => {
    expect(complete('cd pro', initialShell, ctx).input).toBe('cd progetti/');
    expect(complete('cat progetti/be', initialShell, ctx).input).toBe('cat progetti/beta/');
    expect(complete('theme n', initialShell, ctx).input).toBe('theme notte ');
    expect(complete('open car', initialShell, ctx).input).toBe('open carriera ');
    expect(complete('ls zz', initialShell, ctx)).toEqual({ input: 'ls zz', options: [] });
  });
});
