import { Close } from 'pixelarticons/react/Close';
import { Collapse } from 'pixelarticons/react/Collapse';
import { Expand } from 'pixelarticons/react/Expand';
import { Map as MapGlyph } from 'pixelarticons/react/Map';
import { Redo } from 'pixelarticons/react/Redo';
import { SettingsCog } from 'pixelarticons/react/SettingsCog';
import { Undo } from 'pixelarticons/react/Undo';
import { Volume2 } from 'pixelarticons/react/Volume2';
import { VolumeX } from 'pixelarticons/react/VolumeX';
import { useEffect, useRef, type ReactNode } from 'react';
import type { IslandSpec } from '@/game/logic/layout';
import { gameStore, useGame, type GameStore, type Interactable } from '@/game/store';
import { settingsStore, useSettings } from '@/os/kernel/settings';
import { useT } from '@/os/lib/i18n';
import type { ProjectSummary } from '@/os/types';
import { Glyph } from '@/os/ui/primitives';

export interface HudActions {
  goToIsland: (index: number) => void;
  rotate: (direction: 1 | -1) => void;
  openProject: (slug: string, app: 'reader' | 'demo' | 'repo') => void;
  toggleFullscreen: () => void;
  exit: () => void;
  focusGame: () => void;
}

/** A panel that takes focus when it opens and gives it back to the game when it closes. */
function Panel({
  className,
  label,
  onClose,
  children,
}: {
  className: string;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
  }, []);
  return (
    <section ref={ref} className={`hud-panel px-shell ${className}`} aria-label={label}>
      <p className="window-titlebar dialog-titlebar">
        <span className="window-title">{label}</span>
        <button
          type="button"
          className="window-control"
          aria-label={t('career.close')}
          onClick={onClose}
        >
          <Glyph icon={Close} />
        </button>
      </p>
      <div className="hud-panel-body">{children}</div>
    </section>
  );
}

export function Hud({
  islands,
  projects,
  visited,
  currentIsland,
  fullscreen,
  touch,
  actions,
}: {
  islands: IslandSpec[];
  projects: ProjectSummary[];
  visited: number;
  currentIsland: number;
  fullscreen: boolean;
  /** Touch screens: the hint explains the joystick, the prompt becomes the action button. */
  touch: boolean;
  actions: HudActions;
}) {
  const t = useT();
  const prompt = useGame((s) => s.prompt);
  const panel = useGame((s) => s.panel);
  const map = useGame((s) => s.map);
  const paused = useGame((s) => s.paused);
  const graphics = useGame((s) => s.graphics);
  const hint = useGame((s) => s.hint);
  const flash = useGame((s) => s.flash);
  const sound = useSettings((s) => s.sound);
  const quality = useSettings((s) => s.quality);
  const dithering = useSettings((s) => s.dithering);
  const total = islands.filter((i) => i.kind === 'project').length;
  const project = panel?.slug ? projects.find((p) => p.slug === panel.slug) : undefined;

  const close = (patch: Partial<Pick<GameStore, 'panel' | 'map' | 'paused' | 'graphics'>>) => {
    gameStore.getState().set(patch);
    actions.focusGame();
  };

  const islandName = (island: IslandSpec) =>
    island.kind === 'porto'
      ? t('career.porto')
      : island.kind === 'next'
        ? t('career.next')
        : (projects.find((p) => p.slug === island.slug)?.title ?? island.id);

  return (
    <div className="career-hud">
      <div className="hud-top-left">
        <p className="hud-title">{t('app.career')}</p>
        <p>{t('career.visited', { n: visited, total })}</p>
      </div>

      <div className="hud-top-right">
        <button
          type="button"
          className="px-btn icon-btn"
          aria-label={t('career.map')}
          title={t('career.map')}
          onClick={() => {
            gameStore.getState().set({ map: true, paused: false });
          }}
        >
          <Glyph icon={MapGlyph} />
        </button>
        <button
          type="button"
          className="px-btn icon-btn"
          aria-pressed={sound}
          aria-label={sound ? t('tray.soundOn') : t('tray.soundOff')}
          title={sound ? t('tray.soundOn') : t('tray.soundOff')}
          onClick={() => {
            settingsStore.getState().set('sound', !sound);
          }}
        >
          <Glyph icon={sound ? Volume2 : VolumeX} />
        </button>
        <button
          type="button"
          className="px-btn icon-btn"
          aria-label={t('career.graphics')}
          title={t('career.graphics')}
          onClick={() => {
            gameStore.getState().set({ graphics: true });
          }}
        >
          <Glyph icon={SettingsCog} />
        </button>
        <button
          type="button"
          className="px-btn icon-btn"
          aria-label={fullscreen ? t('career.exitFullscreen') : t('career.fullscreen')}
          title={fullscreen ? t('career.exitFullscreen') : t('career.fullscreen')}
          onClick={actions.toggleFullscreen}
        >
          <Glyph icon={fullscreen ? Collapse : Expand} />
        </button>
        <button type="button" className="px-btn" onClick={actions.exit}>
          {t('career.exit')}
        </button>
      </div>

      {hint && <p className="hud-hint">{t(touch ? 'career.hintTouch' : 'career.hint')}</p>}

      <div className="hud-prompt" aria-live="polite">
        {prompt?.kind === 'next' && <p className="hud-sign">{t('career.nextSign')}</p>}
        {prompt ? (
          <p>{t(touch ? 'career.promptTouch' : 'career.prompt', { name: prompt.label })}</p>
        ) : null}
      </div>

      <div className="hud-rotate">
        <button
          type="button"
          className="px-btn icon-btn"
          aria-label={t('career.rotateLeft')}
          title={`${t('career.rotateLeft')} (Z)`}
          onClick={() => {
            actions.rotate(-1);
          }}
        >
          <Glyph icon={Undo} />
        </button>
        <button
          type="button"
          className="px-btn icon-btn"
          aria-label={t('career.rotateRight')}
          title={`${t('career.rotateRight')} (C)`}
          onClick={() => {
            actions.rotate(1);
          }}
        >
          <Glyph icon={Redo} />
        </button>
      </div>

      {project && panel && (
        <Panel
          className="hud-sheet"
          label={project.title}
          onClose={() => {
            close({ panel: null });
          }}
        >
          <img
            src={project.cover.src}
            width={project.cover.width}
            height={project.cover.height}
            alt={project.cover.alt}
          />
          <p className="hud-meta">
            {project.year} · {project.role}
          </p>
          <p className="hud-summary">{project.summary}</p>
          {project.outcomes.length > 0 && (
            <ul className="hud-outcomes">
              {project.outcomes.slice(0, 3).map((o) => (
                <li key={o.label}>
                  <strong>{o.value}</strong> {o.label}
                </li>
              ))}
            </ul>
          )}
          <p className="hud-actions">
            {project.demo.kind !== 'none' && (
              <button
                type="button"
                className="px-btn px-btn-primary"
                onClick={() => {
                  actions.openProject(project.slug, 'demo');
                }}
              >
                {t('action.tryDemo')}
              </button>
            )}
            <button
              type="button"
              className={project.demo.kind === 'none' ? 'px-btn px-btn-primary' : 'px-btn'}
              onClick={() => {
                actions.openProject(project.slug, 'reader');
              }}
            >
              {t('action.readCaseStudy')}
            </button>
            {project.links.repo && (
              <button
                type="button"
                className="px-btn"
                onClick={() => {
                  actions.openProject(project.slug, 'repo');
                }}
              >
                {t('action.code')}
              </button>
            )}
          </p>
        </Panel>
      )}

      {map && (
        <Panel
          className="hud-map"
          label={t('career.mapTitle')}
          onClose={() => {
            close({ map: false });
          }}
        >
          <ol className="hud-map-list">
            {islands.map((island, i) => {
              const p = island.slug ? projects.find((x) => x.slug === island.slug) : undefined;
              return (
                <li key={island.id}>
                  <button
                    type="button"
                    className="hud-map-item"
                    aria-current={i === currentIsland ? 'location' : undefined}
                    onClick={() => {
                      gameStore.getState().set({ map: false });
                      actions.goToIsland(i);
                      actions.focusGame();
                    }}
                  >
                    <span className="hud-map-year">{p ? p.year : ''}</span>
                    <span>{islandName(island)}</span>
                    {i === currentIsland && (
                      <span className="hud-map-here">{t('career.here')}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>
      )}

      {graphics && (
        <Panel
          className="hud-graphics"
          label={t('career.graphics')}
          onClose={() => {
            close({ graphics: false });
          }}
        >
          <fieldset className="settings-group">
            <legend>{t('settings.quality')}</legend>
            {(['auto', 'high', 'low'] as const).map((q) => (
              <label key={q} className="choice">
                <input
                  type="radio"
                  name="career-quality"
                  checked={quality === q}
                  onChange={() => {
                    settingsStore.getState().set('quality', q);
                  }}
                />
                {t(`settings.quality.${q}`)}
              </label>
            ))}
          </fieldset>
          <label className="choice">
            <input
              type="checkbox"
              checked={dithering}
              onChange={(e) => {
                settingsStore.getState().set('dithering', e.target.checked);
              }}
            />
            {t('settings.dithering')}
          </label>
        </Panel>
      )}

      {paused && (
        <Panel
          className="hud-pause"
          label={t('career.pause')}
          onClose={() => {
            close({ paused: false });
          }}
        >
          <p className="hud-pause-list">
            <button
              type="button"
              className="px-btn px-btn-primary"
              onClick={() => {
                close({ paused: false });
              }}
            >
              {t('career.resume')}
            </button>
            <button
              type="button"
              className="px-btn"
              onClick={() => {
                gameStore.getState().set({ paused: false, map: true });
              }}
            >
              {t('career.map')}
            </button>
            <button
              type="button"
              className="px-btn"
              onClick={() => {
                gameStore.getState().set({ paused: false, graphics: true });
              }}
            >
              {t('career.graphics')}
            </button>
            <button type="button" className="px-btn" onClick={actions.exit}>
              {t('career.exitDesktop')}
            </button>
          </p>
        </Panel>
      )}

      {flash > 0 && <div key={flash} className="hud-flash" aria-hidden="true" />}
    </div>
  );
}

export type { Interactable };
