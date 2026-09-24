import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { GameEngine } from '@/game/engine';
import type { Vec2 } from '@/game/logic/math';
import type { MaterialKit } from '@/game/world/materials';
import { useSettings, type HatId } from '@/os/kernel/settings';
import { playSound } from '@/os/lib/sound';

export interface PlayerState {
  position: Vec2;
  y: number;
  vy: number;
  heading: number;
  /** Horizontal speed this frame, drives the walk cycle. */
  speed: number;
  phase: number;
  /** 0..1 squash after landing. */
  squash: number;
}

export function createPlayerState(position: Vec2): PlayerState {
  return { position, y: 0, vy: 0, heading: 0, speed: 0, phase: 0, squash: 0 };
}

const SCALE = 1.35;

const LIMBS = [
  { key: 'legL', x: -0.13, y: 0.69, color: 'night', w: 0.19, h: 0.48, sign: 1 },
  { key: 'legR', x: 0.13, y: 0.69, color: 'night', w: 0.19, h: 0.48, sign: -1 },
  { key: 'armL', x: -0.34, y: 1.24, color: 'brick', w: 0.14, h: 0.5, sign: -0.8 },
  { key: 'armR', x: 0.34, y: 1.24, color: 'brick', w: 0.14, h: 0.5, sign: 0.8 },
] as const;

/** Cosmetic hats unlocked by achievements, built from boxes like the rest of the character. */
function Hat({ hat, kit }: { hat: HatId; kit: MaterialKit }) {
  if (hat === 'captain') {
    return (
      <group position={[0, 1.8, 0]}>
        <mesh castShadow material={kit.get('paper')}>
          <boxGeometry args={[0.5, 0.14, 0.5]} />
        </mesh>
        <mesh position={[0, -0.05, 0.3]} material={kit.get('ink')}>
          <boxGeometry args={[0.46, 0.04, 0.16]} />
        </mesh>
        <mesh position={[0, 0.01, 0.255]} material={kit.get('sun')}>
          <boxGeometry args={[0.1, 0.07, 0.02]} />
        </mesh>
      </group>
    );
  }
  if (hat === 'nightcap') {
    return (
      <group position={[0, 1.8, 0]}>
        <mesh castShadow material={kit.get('plum')}>
          <boxGeometry args={[0.46, 0.14, 0.46]} />
        </mesh>
        <mesh position={[0, 0.13, -0.06]} material={kit.get('plum')}>
          <boxGeometry args={[0.32, 0.14, 0.32]} />
        </mesh>
        <mesh position={[0, 0.22, -0.2]} material={kit.get('plum')}>
          <boxGeometry args={[0.18, 0.12, 0.18]} />
        </mesh>
        <mesh position={[0, 0.2, -0.34]} material={kit.get('paper')}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
        </mesh>
      </group>
    );
  }
  return null;
}

/** Voxel character: boxes for head, body, arms and legs; limbs swing with speed. */
export function Player({ engine, kit }: { engine: GameEngine; kit: MaterialKit }) {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const limbsRef = useRef(new Map<string, Group>());
  const stepRef = useRef(0);
  const hat = useSettings((s) => s.hat);

  useFrame(({ clock }) => {
    const s = engine.player;
    const root = rootRef.current;
    if (!root) return;
    root.position.set(s.position.x, s.y, s.position.z);
    root.rotation.y = s.heading;
    const stride = Math.min(1, s.speed / 4);
    const swing = Math.sin(s.phase) * stride * 0.75;
    // A footstep each time the stride passes through zero, only on the ground.
    const side = Math.sign(Math.sin(s.phase));
    if (side !== 0 && side !== stepRef.current) {
      if (stepRef.current !== 0 && stride > 0.3 && s.y <= 0.01) playSound('step');
      stepRef.current = side;
    }
    for (const limb of LIMBS) {
      const group = limbsRef.current.get(limb.key);
      if (group) group.rotation.x = swing * limb.sign;
    }
    if (bodyRef.current) {
      const breathe = stride < 0.05 ? Math.sin(clock.elapsedTime * 2.2) * 0.025 : 0;
      bodyRef.current.scale.y = 1 + breathe;
    }
    // Scaled up so the character reads clearly at about 270 rows.
    root.scale.set(
      SCALE * (1 + s.squash * 0.35),
      SCALE * (1 - s.squash * 0.3),
      SCALE * (1 + s.squash * 0.35),
    );
  });

  return (
    <group ref={rootRef} dispose={null}>
      <group ref={bodyRef}>
        <mesh castShadow position={[0, 0.98, 0]} material={kit.get('brick')}>
          <boxGeometry args={[0.52, 0.58, 0.3]} />
        </mesh>
        <mesh castShadow position={[0, 1.48, 0]} material={kit.get('sand')}>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
        </mesh>
        <mesh position={[0, 1.72, -0.03]} material={kit.get('ink')}>
          <boxGeometry args={[0.46, 0.12, 0.46]} />
        </mesh>
        <mesh position={[0.1, 1.52, 0.215]} material={kit.get('ink')}>
          <boxGeometry args={[0.06, 0.08, 0.02]} />
        </mesh>
        <mesh position={[-0.1, 1.52, 0.215]} material={kit.get('ink')}>
          <boxGeometry args={[0.06, 0.08, 0.02]} />
        </mesh>
        <Hat hat={hat} kit={kit} />
      </group>
      {LIMBS.map((limb) => (
        <group
          key={limb.key}
          ref={(el) => {
            if (el) limbsRef.current.set(limb.key, el);
            else limbsRef.current.delete(limb.key);
          }}
          position={[limb.x, limb.y, 0]}
        >
          <mesh castShadow position={[0, -limb.h / 2, 0]} material={kit.get(limb.color)}>
            <boxGeometry args={[limb.w, limb.h, 0.2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
