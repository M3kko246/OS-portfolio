import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { pixelSizeFor } from '@/game/logic/camera';
import { PaletteQuantizePass } from './PaletteQuantizePass';

/**
 * Render pipeline (PROMPT.md §3.9): pixelated render with edge outlines, output conversion,
 * then palette quantization straight to the screen. Rendering happens here, at priority 1, so
 * React Three Fiber stops its own render.
 */
export function PixelPipeline({
  dither,
  onPixelSize,
}: {
  dither: boolean;
  onPixelSize: (pixelSize: number, gameRows: number) => void;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const { composer, pixelated, quantize } = useMemo(() => {
    const composer = new EffectComposer(gl);
    const pixelated = new RenderPixelatedPass(2, scene, camera, {
      normalEdgeStrength: 0.15,
      depthEdgeStrength: 0.5,
    });
    const quantize = new PaletteQuantizePass(2, false);
    composer.addPass(pixelated);
    composer.addPass(new OutputPass());
    composer.addPass(quantize);
    return { composer, pixelated, quantize };
  }, [gl, scene, camera]);

  useEffect(() => {
    const pixelSize = pixelSizeFor(size.height * dpr);
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
    pixelated.setPixelSize(pixelSize);
    quantize.setPixelSize(pixelSize);
    onPixelSize(pixelSize, Math.floor((size.height * dpr) / pixelSize));
  }, [composer, pixelated, quantize, size, dpr, onPixelSize]);

  useEffect(() => {
    quantize.setDither(dither);
  }, [quantize, dither]);

  useEffect(
    () => () => {
      composer.dispose();
      pixelated.dispose();
      quantize.dispose();
    },
    [composer, pixelated, quantize],
  );

  useFrame((_, delta) => {
    composer.render(delta);
  }, 1);

  return null;
}
