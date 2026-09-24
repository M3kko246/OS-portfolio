import { describe, expect, it } from 'vitest';
import { applyStick, createInput, releaseAll } from '@/game/logic/input';

describe('virtual joystick', () => {
  it('ignores a resting thumb inside the dead zone', () => {
    const input = createInput();
    applyStick(input, 0.05, -0.1);
    expect(input.stick).toEqual({ x: 0, y: 0 });
    expect(input.touched).toBe(false);
  });

  it('turns screen offsets into a push up and right, clamped to the rim', () => {
    const input = createInput();
    applyStick(input, 0, -0.5);
    expect(input.stick).toEqual({ x: 0, y: 0.5 });
    applyStick(input, 3, 4);
    expect(input.stick.x).toBeCloseTo(0.6);
    expect(input.stick.y).toBeCloseTo(-0.8);
    expect(input.touched).toBe(true);
  });

  it('lets go with everything else', () => {
    const input = createInput();
    applyStick(input, 1, 0);
    releaseAll(input);
    expect(input.stick).toEqual({ x: 0, y: 0 });
  });
});
