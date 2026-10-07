import { createRng } from '@/scene/world/rng';
import { PIXEL_TEXTURE_SIZE, RNG_SEEDS } from '@/scene/world/world.constants';

const BASE_LEVEL = 200;
const LEVEL_SPREAD = 55;
const SPECKLE_CHANCE = 0.12;
const SPECKLE_DROP = 50;
const EDGE_KEEP = 0.78;

export const generatePixelTexture = (): Uint8Array => {
  const random = createRng(RNG_SEEDS.texture);
  const size = PIXEL_TEXTURE_SIZE;
  const texture = new Uint8Array(size * size * 4);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const level = BASE_LEVEL + Math.floor(random() * LEVEL_SPREAD);
      const value = level - (random() < SPECKLE_CHANCE ? SPECKLE_DROP : 0);
      const offset = (y * size + x) * 4;

      texture[offset] = value;
      texture[offset + 1] = value;
      texture[offset + 2] = value;
      texture[offset + 3] = 255;
    }
  }

  const darken = (x: number, y: number): void => {
    const offset = (y * size + x) * 4;

    for (let channel = 0; channel < 3; channel++) {
      texture[offset + channel] = Math.round((texture[offset + channel] ?? 0) * EDGE_KEEP);
    }
  };

  for (let x = 0; x < size; x++) {
    darken(x, size - 1);
  }

  for (let y = 0; y < size; y++) {
    darken(size - 1, y);
  }

  return texture;
};
