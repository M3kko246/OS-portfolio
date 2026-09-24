import './career.css';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { type OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { timeOfDay } from '@/design/time';
import type { AppId } from '@/os/apps/ids';
import { useOsIndex } from '@/os/context';
import { openApp, openExternal } from '@/os/kernel/launcher';
import { useSession } from '@/os/kernel/session';
import { isHandheld } from '@/os/kernel/mode';
import { useSettings } from '@/os/kernel/settings';
import { useShell } from '@/os/kernel/shell';
import { useT, type Translate } from '@/os/lib/i18n';
import { useReducedMotion } from '@/os/lib/motion';
import type { OsIndex } from '@/os/types';
import { GameEngine } from './engine';
import { PerfProbe } from './fx/PerfProbe';
import { PixelPipeline } from './fx/PixelPipeline';
import { Hud, type HudActions } from './hud/Hud';
import { TouchControls } from './hud/Touch';
import { applyKey, releaseAll } from './logic/input';
import { layoutWorld, NEXT, PORTO, toWorld, type WorldLayout } from './logic/layout';
import { Player } from './player/Player';
import { gameStore, useGame, type Interactable } from './store';
import { MaterialKit } from './world/materials';
import { World } from './world/World';

function buildInteractables(layout: WorldLayout, index: OsIndex, t: Translate): Interactable[] {
  const list: Interactable[] = [];
  layout.islands.forEach((island, i) => {
    if (island.kind === 'project' && island.slug) {
      const title = index.projects.find((p) => p.slug === island.slug)?.title ?? island.slug;
      list.push({
        id: island.id,
        kind: 'project',
        label: title,
        position: island.spot,
        island: i,
        slug: island.slug,
      });
    } else if (island.kind === 'porto') {
      list.push(
        {
          id: 'hut',
          kind: 'about',
          label: t('app.about'),
          position: toWorld(island, PORTO.hut.spot),
          island: i,
        },
        {
          id: 'mailbox',
          kind: 'mail',
          label: t('app.mail'),
          position: toWorld(island, PORTO.mailbox.spot),
          island: i,
        },
        {
          id: 'sign',
          kind: 'controls',
          label: t('career.controls'),
          position: toWorld(island, PORTO.sign.spot),
          island: i,
        },
      );
    } else {
      list.push({
        id: 'next',
        kind: 'next',
        label: t('app.mail'),
        position: toWorld(island, NEXT.sign.spot),
        island: i,
      });
    }
  });
  return list;
}

function subscribeVisibility(listener: () => void) {
  document.addEventListener('visibilitychange', listener);
  return () => {
    document.removeEventListener('visibilitychange', listener);
  };
}

/** Runs the engine once per frame, before the render pass (priority 1). */
function GameLoop({ engine, reduced }: { engine: GameEngine; reduced: boolean }) {
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const height = useThree((s) => s.size.height);
  useFrame((_, delta) => {
    engine.step(delta, camera, height, reduced);
  });
  return null;
}

export interface CareerGameProps {
  island?: string;
  minimized: boolean;
  onExit: () => void;
}

export default function CareerGame({ island: targetSlug, minimized, onExit }: CareerGameProps) {
  const t = useT();
  const index = useOsIndex();
  const reduced = useReducedMotion();
  const quality = useSettings((s) => s.quality);
  const dithering = useSettings((s) => s.dithering);
  const visited = useSession((s) => s.visitedIslands);
  const shutdown = useShell((s) => s.shutdown);
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );

  const layout = useMemo(
    () =>
      layoutWorld(index.projects.map((p) => ({ slug: p.slug, order: p.order, island: p.island }))),
    [index],
  );
  const interactables = useMemo(() => buildInteractables(layout, index, t), [layout, index, t]);
  const [kit] = useState(() => new MaterialKit());
  const [time] = useState(() => timeOfDay());
  const [currentIsland, setCurrentIsland] = useState(0);
  const [engine] = useState(() => {
    const start = Math.max(
      0,
      layout.islands.findIndex((i) => i.slug !== undefined && i.slug === targetSlug),
    );
    return new GameEngine(
      layout,
      interactables,
      layout.islands[start]?.spot ?? { x: 0, z: 0 },
      setCurrentIsland,
    );
  });
  const threeRef = useRef<RootState | null>(null);
  const perfRef = useRef<HTMLParagraphElement>(null);
  const [debugPerf] = useState(
    () => new URLSearchParams(window.location.search).get('debug') === 'perf',
  );
  const writeStats = useCallback((text: string) => {
    if (perfRef.current) perfRef.current.textContent = text;
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTargetRef = useRef(targetSlug);
  const [autoLow, setAutoLow] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [paused, setPaused] = useState(false);
  // Touch controls show on coarse pointers and in handheld mode, or from the first touch.
  const [touch, setTouch] = useState(
    () => window.matchMedia('(pointer: coarse)').matches || isHandheld(),
  );
  const pinchRef = useRef({
    points: new Map<number, { x: number; y: number }>(),
    base: 0,
    used: false,
  });
  const prompt = useGame((s) => s.prompt);
  // Lost WebGL context: the fallback shows until the browser restores it, then the canvas is rebuilt.
  const [lost, setLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const effective = quality === 'auto' ? (autoLow ? 'low' : 'high') : quality;

  useEffect(() => {
    engine.setInteractables(interactables);
  }, [engine, interactables]);

  useEffect(() => {
    gameStore.getState().reset();
    containerRef.current?.focus();
    const unsubscribe = gameStore.subscribe((s) => {
      setPaused(s.paused);
    });
    return () => {
      unsubscribe();
      gameStore.getState().reset();
      kit.dispose();
    };
  }, [kit]);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, []);

  // "Visita l'isola" while the game is already open moves the player there.
  useEffect(() => {
    if (targetSlug === lastTargetRef.current) return;
    lastTargetRef.current = targetSlug;
    const to = layout.islands.findIndex((i) => i.slug === targetSlug);
    if (to >= 0) engine.goToIsland(to, reduced);
  }, [targetSlug, layout, engine, reduced]);

  const leaveFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
  };

  const openFromGame = (appId: AppId, params: Record<string, string> = {}) => {
    // Windows of the system cannot show over a full-screen game.
    leaveFullscreen();
    openApp(appId, params);
  };

  const interact = () => {
    const prompt = gameStore.getState().prompt;
    if (!prompt) return;
    if (prompt.kind === 'project') gameStore.getState().set({ panel: prompt });
    else if (prompt.kind === 'about') openFromGame('about');
    else if (prompt.kind === 'mail' || prompt.kind === 'next') openFromGame('mail');
    else gameStore.getState().set({ hint: true });
  };

  const actions: HudActions = {
    goToIsland: (to) => {
      engine.goToIsland(to, reduced);
    },
    rotate: (direction) => {
      engine.rotate(direction);
    },
    openProject: (slug, kind) => {
      if (kind === 'repo') {
        const repo = index.projects.find((p) => p.slug === slug)?.links.repo;
        if (repo) openExternal(repo);
      } else openFromGame(kind, { slug });
    },
    toggleFullscreen: () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void containerRef.current?.requestFullscreen();
    },
    exit: () => {
      leaveFullscreen();
      onExit();
    },
    focusGame: () => {
      containerRef.current?.focus();
    },
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const game = gameStore.getState();
    if (event.key === 'Escape') {
      event.preventDefault();
      if (game.panel || game.map || game.graphics) {
        game.set({ panel: null, map: false, graphics: false });
      } else game.set({ paused: !game.paused });
      containerRef.current?.focus();
      return;
    }
    // Keys pressed inside panels belong to their buttons.
    if (event.target !== event.currentTarget || game.paused) return;
    if (applyKey(engine.input, event.code, true)) {
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.key === 'Enter') {
      event.preventDefault();
      interact();
    } else if (event.code === 'KeyZ') engine.rotate(-1);
    else if (event.code === 'KeyC') engine.rotate(1);
  };

  // Two fingers on the world zoom in steps; a pinch never counts as a tap to walk.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    if (!touch) setTouch(true);
    if (!(event.target instanceof HTMLCanvasElement)) return;
    const pinch = pinchRef.current;
    pinch.points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.points.size === 2) {
      const [a, b] = [...pinch.points.values()];
      pinch.base = a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
      pinch.used = true;
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pinch = pinchRef.current;
    if (!pinch.points.has(event.pointerId)) return;
    pinch.points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [a, b] = [...pinch.points.values()];
    if (pinch.points.size !== 2 || !a || !b || pinch.base === 0) return;
    const ratio = Math.hypot(a.x - b.x, a.y - b.y) / pinch.base;
    if (ratio > 1.25 || ratio < 0.8) {
      engine.zoomBy(ratio > 1 ? 1 : -1);
      pinch.base = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pinch = pinchRef.current;
    pinch.points.delete(event.pointerId);
    if (pinch.used) {
      if (pinch.points.size === 0) pinch.used = false;
      return;
    }
    const state = threeRef.current;
    if (!state || event.button !== 0 || gameStore.getState().paused) return;
    if (!(event.target instanceof HTMLCanvasElement)) return;
    const box = event.target.getBoundingClientRect();
    const ndc = new Vector2(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      -((event.clientY - box.top) / box.height) * 2 + 1,
    );
    const raycaster = new Raycaster();
    raycaster.setFromCamera(ndc, state.camera);
    const hit = raycaster.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), new Vector3());
    if (hit) engine.moveTo({ x: hit.x, z: hit.z });
  };

  const onPixelSize = useCallback(
    (_: number, gameRows: number) => {
      engine.setGameRows(gameRows);
    },
    [engine],
  );

  const visitedCount = layout.islands.filter(
    (i) => i.kind === 'project' && i.slug !== undefined && visited.includes(i.slug),
  ).length;

  return (
    // A game surface: it takes keyboard focus to receive the controls.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
    <div
      ref={containerRef}
      className="career"
      data-touch={touch ? '' : undefined}
      // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex
      tabIndex={0}
      role="application"
      aria-label={t('career.canvas')}
      onKeyDown={onKeyDown}
      onKeyUp={(e) => {
        applyKey(engine.input, e.code, false);
      }}
      onBlur={() => {
        releaseAll(engine.input);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={(e) => {
        pinchRef.current.points.delete(e.pointerId);
      }}
      onWheel={(e) => {
        engine.zoomBy(e.deltaY > 0 ? -1 : 1);
      }}
    >
      <Canvas
        key={canvasKey}
        orthographic
        flat
        dpr={effective === 'low' ? 1 : [1, 2]}
        // Hard shadow edges: they belong in pixel art (and PCF soft shadows are gone in three).
        shadows={effective === 'high' ? 'basic' : false}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        frameloop={minimized || hidden || paused || shutdown ? 'never' : 'always'}
        camera={{ near: 1, far: 250, position: [0, 50, 50], zoom: 20 }}
        onCreated={(state) => {
          threeRef.current = state;
          const canvas = state.gl.domElement;
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', t('career.canvas'));
          canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            setLost(true);
          });
          canvas.addEventListener('webglcontextrestored', () => {
            setLost(false);
            setCanvasKey((k) => k + 1);
          });
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setAutoLow(true);
          }}
          onIncline={() => {
            setAutoLow(false);
          }}
        />
        <World
          layout={layout}
          projects={index.projects}
          kit={kit}
          time={time}
          reducedMotion={reduced}
          shadows={effective === 'high'}
        />
        <Player engine={engine} kit={kit} />
        <GameLoop engine={engine} reduced={reduced} />
        <PixelPipeline dither={dithering} onPixelSize={onPixelSize} />
        {debugPerf && <PerfProbe onStats={writeStats} />}
      </Canvas>
      {debugPerf && <p ref={perfRef} className="career-perf" aria-hidden="true" />}
      {lost && (
        <div className="career-lost app-state" role="alert">
          <p className="text-read">{t('career.noWebgl')}</p>
          <p>
            <button
              type="button"
              className="px-btn px-btn-primary"
              onClick={() => {
                openFromGame('explorer');
              }}
            >
              {t('career.openProjects')}
            </button>
          </p>
        </div>
      )}
      {touch && (
        <TouchControls
          engine={engine}
          actionLabel={prompt ? t('career.openNamed', { name: prompt.label }) : t('career.jump')}
          onAction={() => {
            if (gameStore.getState().prompt) interact();
            else engine.jump();
          }}
        />
      )}
      <Hud
        islands={layout.islands}
        projects={index.projects}
        visited={visitedCount}
        currentIsland={currentIsland}
        fullscreen={fullscreen}
        touch={touch}
        actions={actions}
      />
    </div>
  );
}
