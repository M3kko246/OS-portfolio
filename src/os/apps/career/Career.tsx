import { useEffect, useState, type ComponentType } from 'react';
import type { CareerGameProps } from '@/game/CareerGame';
import type { AppProps } from '@/os/apps/manifest';
import { closeWindow, openApp } from '@/os/kernel/launcher';
import { useWindows, windowStore } from '@/os/kernel/windows';
import { useT } from '@/os/lib/i18n';
import { ErrorState } from '@/os/ui/States';

interface ChunkManifest {
  files: { url: string; size: number }[];
}

function hasWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/**
 * The game is a separate bundle. Its chunk list (written at build time) is downloaded first as a
 * stream, so the bar shows real bytes; the import that follows comes from the HTTP cache.
 */
async function loadGame(onProgress: (value: number) => void) {
  try {
    const response = await fetch('/career-manifest.json');
    if (response.ok) {
      const { files } = (await response.json()) as ChunkManifest;
      const total = files.reduce((sum, f) => sum + f.size, 0) || 1;
      let loaded = 0;
      await Promise.all(
        files.map(async (file) => {
          const body = (await fetch(file.url)).body;
          if (!body) return;
          const reader = body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.byteLength;
            onProgress(Math.min(0.99, loaded / total));
          }
        }),
      );
    }
  } catch {
    // No manifest (development) or a network hiccup: the plain import still works.
  }
  const module = await import('@/game/CareerGame');
  onProgress(1);
  return module.default;
}

type Phase =
  | { kind: 'loading'; progress: number }
  | { kind: 'ready' }
  | { kind: 'error' }
  | { kind: 'unsupported' };

// The game component, once loaded. Module level: it is created once, never during a render.
let LoadedGame: ComponentType<CareerGameProps> | null = null;

function GameSlot(props: CareerGameProps) {
  return LoadedGame ? <LoadedGame {...props} /> : null;
}

export default function Career({ windowId, params }: AppProps) {
  const t = useT();
  const minimized = useWindows((s) => s.windows[windowId]?.minimized ?? false);
  const [phase, setPhase] = useState<Phase>(() =>
    !hasWebGL2()
      ? { kind: 'unsupported' }
      : LoadedGame
        ? { kind: 'ready' }
        : { kind: 'loading', progress: 0 },
  );
  const [attempt, setAttempt] = useState(0);
  const loading = phase.kind === 'loading';

  useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    loadGame((progress) => {
      if (!cancelled) setPhase({ kind: 'loading', progress });
    }).then(
      (Game) => {
        LoadedGame = Game;
        if (!cancelled) setPhase({ kind: 'ready' });
      },
      () => {
        if (!cancelled) setPhase({ kind: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loading, attempt]);

  const openProjects = (
    <button
      type="button"
      className="px-btn px-btn-primary"
      onClick={() => {
        openApp('explorer');
      }}
    >
      {t('career.openProjects')}
    </button>
  );

  if (phase.kind === 'unsupported') {
    return <ErrorState message={t('career.noWebgl')}>{openProjects}</ErrorState>;
  }
  if (phase.kind === 'error') {
    return (
      <ErrorState
        message={t('career.loadError')}
        retry={() => {
          setPhase({ kind: 'loading', progress: 0 });
          setAttempt((n) => n + 1);
        }}
      >
        {openProjects}
      </ErrorState>
    );
  }
  if (phase.kind === 'loading') {
    const percent = Math.round(phase.progress * 100);
    return (
      <div className="career-loading">
        <p className="font-pixel text-ui">{t('career.loading')}</p>
        <div
          className="career-progress"
          role="progressbar"
          aria-label={t('career.loading')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          {/* Twenty steps: the bar fills in blocks, like everything else in the frame. */}
          <span
            className="career-progress-bar"
            style={{ transform: `scaleX(${Math.round(phase.progress * 20) / 20})` }}
          />
        </div>
      </div>
    );
  }

  return (
    <GameSlot
      {...(params.island ? { island: params.island } : {})}
      minimized={minimized}
      onExit={() => {
        const win = windowStore.getState().windows[windowId];
        if (win) closeWindow(win);
      }}
    />
  );
}
