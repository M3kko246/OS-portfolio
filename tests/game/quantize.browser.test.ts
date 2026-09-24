import { describe, expect, it } from 'vitest';
import { hexToOklab, hexToRgb, nearestPaletteName, paletteOklab } from '@/design/color';
import { palette, paletteNames } from '@/design/palette';
import { OKLAB_GLSL, QUANTIZE_GLSL } from '@/game/fx/glsl';

/**
 * Runs the game's quantization GLSL in real WebGL2 and checks it against the TypeScript
 * reference on sample colours: same conversion, same nearest palette entry.
 */
function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('no shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader) ?? '');
  return shader;
}

function quantizeOnGpu(samples: [number, number, number][]): [number, number, number][] {
  const canvas = document.createElement('canvas');
  canvas.width = samples.length;
  canvas.height = 1;
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 unavailable');

  const program = gl.createProgram();
  gl.attachShader(
    program,
    compile(
      gl,
      gl.VERTEX_SHADER,
      `#version 300 es
      in vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }`,
    ),
  );
  gl.attachShader(
    program,
    compile(
      gl,
      gl.FRAGMENT_SHADER,
      `#version 300 es
      precision highp float;
      uniform sampler2D uInput;
      out vec4 outColor;
      ${OKLAB_GLSL}
      ${QUANTIZE_GLSL}
      void main() {
        vec3 srgb = texelFetch(uInput, ivec2(gl_FragCoord.xy), 0).rgb;
        outColor = vec4(nearestPaletteColor(linearToOklab(srgbToLinear(srgb))), 1.0);
      }`,
    ),
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program) ?? '');
  gl.useProgram(program);

  const lab = paletteNames.flatMap((name) => [...paletteOklab[name]]);
  const rgb = paletteNames.flatMap((name) => [...hexToRgb(palette[name])]);
  gl.uniform3fv(gl.getUniformLocation(program, 'uPaletteLab'), lab);
  gl.uniform3fv(gl.getUniformLocation(program, 'uPaletteRgb'), rgb);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const pixels = new Uint8Array(samples.flatMap(([r, g, b]) => [r, g, b, 255]));
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    samples.length,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels,
  );
  gl.uniform1i(gl.getUniformLocation(program, 'uInput'), 0);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  gl.viewport(0, 0, samples.length, 1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  const out = new Uint8Array(samples.length * 4);
  gl.readPixels(0, 0, samples.length, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
  return samples.map((_, i) => [out[i * 4] ?? 0, out[i * 4 + 1] ?? 0, out[i * 4 + 2] ?? 0]);
}

const toHex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

describe('palette quantization shader', () => {
  it('matches the TypeScript reference on sample colours', () => {
    const samples: [number, number, number][] = [];
    for (let i = 0; i < 64; i++) {
      samples.push([(i * 53) % 256, (i * 97 + 31) % 256, (i * 151 + 77) % 256]);
    }
    for (const name of paletteNames) {
      const [r, g, b] = hexToRgb(palette[name]);
      samples.push([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]);
    }
    const gpu = quantizeOnGpu(samples);
    samples.forEach((sample, i) => {
      const expected = palette[nearestPaletteName(hexToOklab(toHex(sample)))];
      const got = toHex(gpu[i] ?? [0, 0, 0]);
      expect(got, `sample ${toHex(sample)}`).toBe(expected);
    });
  });
});
