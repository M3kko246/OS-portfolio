import { Vector3 } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { hexToRgb, paletteOklab } from '@/design/color';
import { palette, paletteNames } from '@/design/palette';
import { BAYER_GLSL, OKLAB_GLSL, QUANTIZE_GLSL } from './glsl';

/** Palette uniforms computed on the CPU from src/design/palette.ts: OKLab and sRGB. */
export function paletteUniforms() {
  return {
    uPaletteLab: { value: paletteNames.map((name) => new Vector3(...paletteOklab[name])) },
    uPaletteRgb: { value: paletteNames.map((name) => new Vector3(...hexToRgb(palette[name]))) },
  };
}

/**
 * Last pass: snaps every pixel to the 16 system colours. The frame arrives in sRGB (after
 * OutputPass), goes to linear and OKLab, and the nearest palette colour is written as stored,
 * with no colour-space conversion (no colorspace_fragment). Optional ordered dithering works on
 * game pixels.
 */
export class PaletteQuantizePass extends ShaderPass {
  constructor(pixelSize: number, dither: boolean) {
    super({
      name: 'PaletteQuantizeShader',
      uniforms: {
        tDiffuse: { value: null },
        uPixelSize: { value: pixelSize },
        uDither: { value: dither ? 1 : 0 },
        ...paletteUniforms(),
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float uPixelSize;
        uniform float uDither;
        varying vec2 vUv;
        ${OKLAB_GLSL}
        ${QUANTIZE_GLSL}
        ${BAYER_GLSL}
        void main() {
          vec3 srgb = texture2D(tDiffuse, vUv).rgb;
          vec3 lab = linearToOklab(srgbToLinear(clamp(srgb, 0.0, 1.0)));
          if (uDither > 0.5) {
            lab.x += (bayer4(floor(gl_FragCoord.xy / uPixelSize)) - 0.5) * 0.06;
          }
          gl_FragColor = vec4(nearestPaletteColor(lab), 1.0);
        }
      `,
    });
  }

  setPixelSize(pixelSize: number): void {
    const uniform = this.uniforms.uPixelSize;
    if (uniform) uniform.value = pixelSize;
  }

  setDither(on: boolean): void {
    const uniform = this.uniforms.uDither;
    if (uniform) uniform.value = on ? 1 : 0;
  }
}
