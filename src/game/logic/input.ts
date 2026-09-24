/** Held keys, read once per frame by the game loop. Filled by the game container's handlers. */
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean;
  /** Any movement key was pressed since the game started (hides the hint). */
  touched: boolean;
  /** Virtual joystick on touch screens: screen right and up, length 0 to 1. */
  stick: { x: number; y: number };
}

export function createInput(): InputState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    touched: false,
    stick: { x: 0, y: 0 },
  };
}

const MOVES: Record<string, keyof Pick<InputState, 'up' | 'down' | 'left' | 'right'>> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

/** Updates held keys; returns true when the key belongs to the game (and should not scroll). */
export function applyKey(input: InputState, code: string, pressed: boolean): boolean {
  const move = MOVES[code];
  if (move) {
    input[move] = pressed;
    if (pressed) input.touched = true;
    return true;
  }
  if (code === 'ShiftLeft' || code === 'ShiftRight') {
    input.run = pressed;
    return true;
  }
  if (code === 'Space') {
    input.jump = pressed;
    return true;
  }
  return false;
}

const DEAD_ZONE = 0.15;

/**
 * Joystick offset from its centre, in radii (x right, y down as on screen): clamped to the unit
 * circle, with a small dead zone so a resting thumb does not walk.
 */
export function applyStick(input: InputState, x: number, y: number): void {
  const length = Math.hypot(x, y);
  if (length < DEAD_ZONE) {
    input.stick = { x: 0, y: 0 };
    return;
  }
  const scale = Math.min(1, length) / length;
  input.stick = { x: x * scale, y: -y * scale };
  input.touched = true;
}

export function releaseAll(input: InputState): void {
  input.up = input.down = input.left = input.right = input.run = input.jump = false;
  input.stick = { x: 0, y: 0 };
}
