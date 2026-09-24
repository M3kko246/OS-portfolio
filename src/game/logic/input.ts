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

export function releaseAll(input: InputState): void {
  input.up = input.down = input.left = input.right = input.run = input.jump = false;
}
