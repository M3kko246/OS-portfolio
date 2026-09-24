import { DataTexture, MeshToonMaterial, NearestFilter, RedFormat, type Texture } from 'three';
import { palette, type PaletteName } from '@/design/palette';

/**
 * Toon materials with a three-step gradient: flat bands of light that the palette pass turns
 * into clean pixel-art shading. One material per palette colour, shared by the whole world.
 */
function gradientMap(): DataTexture {
  const texture = new DataTexture(new Uint8Array([90, 170, 255]), 3, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export class MaterialKit {
  private readonly gradient: Texture = gradientMap();
  private readonly cache = new Map<string, MeshToonMaterial>();

  get(color: PaletteName, options: { emissive?: boolean } = {}): MeshToonMaterial {
    const key = `${color}:${options.emissive ? 'e' : ''}`;
    let material = this.cache.get(key);
    if (!material) {
      material = new MeshToonMaterial({ color: palette[color], gradientMap: this.gradient });
      if (options.emissive) {
        material.emissive.set(palette[color]);
        material.emissiveIntensity = 0.9;
      }
      this.cache.set(key, material);
    }
    return material;
  }

  dispose(): void {
    for (const material of this.cache.values()) material.dispose();
    this.cache.clear();
    this.gradient.dispose();
  }
}
