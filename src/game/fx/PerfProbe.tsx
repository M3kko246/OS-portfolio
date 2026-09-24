import { useFrame, useThree } from '@react-three/fiber';
import { useState } from 'react';
import type { WebGLRenderer } from 'three';

/** Averages frames over half a second and formats renderer statistics. */
class Stats {
  private frames = 0;
  private time = 0;

  tick(delta: number, gl: WebGLRenderer): string | null {
    this.frames += 1;
    this.time += delta;
    if (this.time < 0.5) return null;
    const { render, memory } = gl.info;
    const text = [
      `fps ${Math.round(this.frames / this.time)}`,
      `draw ${render.calls}`,
      `tri ${render.triangles}`,
      `geo ${memory.geometries}`,
      `tex ${memory.textures}`,
    ].join('  ');
    this.frames = 0;
    this.time = 0;
    return text;
  }
}

/**
 * `?debug=perf`: frames per second, draw calls, triangles and GPU resources, reported twice a
 * second (no React state per frame). For checking 60 fps on real hardware.
 */
export function PerfProbe({ onStats }: { onStats: (text: string) => void }) {
  const gl = useThree((s) => s.gl);
  const [stats] = useState(() => new Stats());
  useFrame((_, delta) => {
    const text = stats.tick(delta, gl);
    if (text) onStats(text);
  }, 2);
  return null;
}
