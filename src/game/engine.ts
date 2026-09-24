import type { OrthographicCamera } from 'three';
import { sessionStore } from '@/os/kernel/session';
import { playSound } from '@/os/lib/sound';
import { cameraBasis, cameraOffset, snapToPixelGrid, ZOOM_LEVELS } from './logic/camera';
import { createInput, type InputState } from './logic/input';
import { PLAYER_RADIUS, type WorldLayout } from './logic/layout';
import { angleDelta, distance, type Vec2 } from './logic/math';
import { islandAt, routeLength, routeToIsland } from './logic/pathfinding';
import { canStand, slideMove } from './logic/walkable';
import { createPlayerState, type PlayerState } from './player/Player';
import { gameStore, type Interactable } from './store';

const WALK = 4.2;
const RUN = 7;
/** World units visible vertically at the default zoom. */
const VIEW_HEIGHT = 19;
/** Routes longer than this teleport instead of walking. */
const LONG_TRIP = 70;

/**
 * The imperative core of Carriera, outside React: input, movement with sliding collisions,
 * automatic walks along routes, jump, proximity prompts and the pixel-snapped camera. React
 * components call `step` once per frame and read `player` to draw the character.
 */
export class GameEngine {
  readonly input: InputState = createInput();
  readonly player: PlayerState;
  private route: Vec2[] = [];
  private yaw = 0;
  private zoom = 2;
  private target: Vec2;
  private gameRows = 270;
  private stuck = 0;
  private lastPrompt = '';
  private lastIsland = -1;
  private jumpQueued = false;

  constructor(
    private readonly layout: WorldLayout,
    private interactables: Interactable[],
    start: Vec2,
    private readonly onIsland: (index: number) => void,
  ) {
    this.player = createPlayerState(start);
    this.target = start;
  }

  setInteractables(list: Interactable[]): void {
    this.interactables = list;
    this.lastPrompt = '';
  }

  setGameRows(rows: number): void {
    this.gameRows = Math.max(1, rows);
  }

  rotate(direction: 1 | -1): void {
    this.yaw = (this.yaw + direction + 4) % 4;
  }

  /** One jump, from a button rather than a held key. */
  jump(): void {
    this.jumpQueued = true;
  }

  zoomBy(direction: 1 | -1): void {
    this.zoom = Math.min(ZOOM_LEVELS.length - 1, Math.max(0, this.zoom + direction));
  }

  teleport(index: number): void {
    const spot = this.layout.islands[index]?.spot;
    if (!spot) return;
    playSound('splash');
    this.route = [];
    this.player.position = spot;
    this.target = spot;
    const game = gameStore.getState();
    game.set({ flash: game.flash + 1 });
  }

  /** Walks to an island; with reduced motion or on long trips, teleports with a stepped fade. */
  goToIsland(index: number, reduced: boolean): void {
    const path = routeToIsland(this.layout, this.player.position, index);
    if (reduced || routeLength(this.player.position, path) > LONG_TRIP) this.teleport(index);
    else this.route = path;
  }

  /** Click to move: the same routes, ending on the clicked point. */
  moveTo(point: Vec2): void {
    if (!canStand(this.layout.area, point, PLAYER_RADIUS)) return;
    const target = islandAt(this.layout, point);
    const here = islandAt(this.layout, this.player.position);
    const path =
      here === target ? [] : routeToIsland(this.layout, this.player.position, target).slice(0, -1);
    this.route = [...path, point];
    this.input.touched = true;
  }

  step(delta: number, camera: OrthographicCamera, viewportHeight: number, reduced: boolean): void {
    // Capped step: no jumps after a background tab comes back.
    const dt = Math.min(delta, 1 / 30);
    const s = this.player;
    const keys = this.input;
    const basis = cameraBasis(this.yaw);

    let dx = (keys.up ? basis.forward[0] : 0) - (keys.down ? basis.forward[0] : 0);
    let dz = (keys.up ? basis.forward[2] : 0) - (keys.down ? basis.forward[2] : 0);
    dx += (keys.right ? basis.right[0] : 0) - (keys.left ? basis.right[0] : 0);
    dz += (keys.right ? basis.right[2] : 0) - (keys.left ? basis.right[2] : 0);
    // The joystick adds an analog push: a light touch walks slowly, the rim runs.
    const push = Math.hypot(keys.stick.x, keys.stick.y);
    dx += basis.forward[0] * keys.stick.y + basis.right[0] * keys.stick.x;
    dz += basis.forward[2] * keys.stick.y + basis.right[2] * keys.stick.x;

    let speed = 0;
    if (dx !== 0 || dz !== 0) {
      this.route = [];
      const l = Math.hypot(dx, dz);
      dx /= l;
      dz /= l;
      const keyboard = keys.up || keys.down || keys.left || keys.right;
      if (keys.run || (!keyboard && push > 0.92)) speed = RUN;
      else speed = keyboard ? WALK : WALK * Math.max(0.4, push);
    } else if (this.route.length > 0) {
      const next = this.route[0] as Vec2;
      const tx = next.x - s.position.x;
      const tz = next.z - s.position.z;
      const d = Math.hypot(tx, tz);
      if (d < 0.12) this.route.shift();
      else {
        dx = tx / d;
        dz = tz / d;
        speed = Math.min(WALK, d / dt);
      }
    }

    if (speed > 0) {
      const next = slideMove(
        this.layout.area,
        s.position,
        { x: dx * speed * dt, z: dz * speed * dt },
        PLAYER_RADIUS,
      );
      const moved = distance(next, s.position);
      s.position = next;
      s.speed = moved / dt;
      s.phase += moved * 2.8;
      s.heading += angleDelta(s.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 12);
      // A route that stops making progress (something in the way) is dropped.
      if (this.route.length > 0 && moved < speed * dt * 0.2) {
        this.stuck += dt;
        if (this.stuck > 0.6) this.route = [];
      } else this.stuck = 0;
    } else {
      s.speed = 0;
    }

    // Jump: visual only, gravity on y, squash and stretch on landing.
    if ((keys.jump || this.jumpQueued) && s.y === 0 && s.vy === 0) s.vy = 5.2;
    this.jumpQueued = false;
    if (s.y > 0 || s.vy !== 0) {
      s.vy -= 18 * dt;
      s.y += s.vy * dt;
      if (s.y <= 0) {
        if (s.vy < -2 && !reduced) s.squash = 1;
        s.y = 0;
        s.vy = 0;
      }
    }
    s.squash = Math.max(0, s.squash - dt * 6);

    const game = gameStore.getState();
    if (keys.touched && game.hint) game.set({ hint: false });

    let nearest: Interactable | null = null;
    let best = 2.4;
    for (const item of this.interactables) {
      const d = distance(item.position, s.position);
      if (d < best) {
        best = d;
        nearest = item;
      }
    }
    if ((nearest?.id ?? '') !== this.lastPrompt) {
      this.lastPrompt = nearest?.id ?? '';
      game.set({ prompt: nearest });
      if (nearest?.kind === 'project' && nearest.slug)
        sessionStore.getState().visitIsland(nearest.slug);
    }

    const island = islandAt(this.layout, s.position);
    if (island !== this.lastIsland) {
      this.lastIsland = island;
      this.onIsland(island);
    }

    // Camera: damped follow, then snapped to whole game pixels on its own plane.
    const viewHeight = VIEW_HEIGHT / (ZOOM_LEVELS[this.zoom] ?? 1);
    const zoom = viewportHeight / viewHeight;
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
    const k = reduced ? 1 : 1 - Math.exp(-dt * 6);
    this.target = {
      x: this.target.x + (s.position.x - this.target.x) * k,
      z: this.target.z + (s.position.z - this.target.z) * k,
    };
    const snapped = snapToPixelGrid(
      [this.target.x, 0.8, this.target.z],
      this.yaw,
      viewHeight / this.gameRows,
    );
    const offset = cameraOffset(this.yaw, 60);
    camera.position.set(snapped[0] + offset[0], snapped[1] + offset[1], snapped[2] + offset[2]);
    camera.lookAt(snapped[0], snapped[1], snapped[2]);
  }
}
