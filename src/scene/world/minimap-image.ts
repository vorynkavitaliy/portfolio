import { MINIMAP_COLORS, type Rgb } from '@/scene/world/palette';
import {
  MAP_SIZE,
  MINIMAP_GRASS_MAX,
  MINIMAP_SHADE_BASE,
  MINIMAP_SHADE_RANGE,
  MINIMAP_SHADE_SPAN,
  MINIMAP_STONE_MAX,
  SAND_MAX,
  SEA_LEVEL,
} from '@/scene/world/world.constants';
import { clamp01 } from '@/scene/world/heightmap-math';

const bandColor = (height: number): Rgb => {
  if (height <= SEA_LEVEL) {
    return MINIMAP_COLORS.sea;
  }

  if (height <= SAND_MAX) {
    return MINIMAP_COLORS.sand;
  }

  if (height < MINIMAP_GRASS_MAX) {
    return MINIMAP_COLORS.grass;
  }

  return height < MINIMAP_STONE_MAX ? MINIMAP_COLORS.stone : MINIMAP_COLORS.snow;
};

export const drawMinimapImage = (heights: Int16Array): Uint8ClampedArray => {
  const image = new Uint8ClampedArray(MAP_SIZE * MAP_SIZE * 4);

  for (let column = 0; column < MAP_SIZE; column++) {
    for (let row = 0; row < MAP_SIZE; row++) {
      const height = heights[column * MAP_SIZE + row] ?? 1;
      const color = bandColor(height);

      const shade =
        MINIMAP_SHADE_BASE +
        MINIMAP_SHADE_RANGE * clamp01((height - SEA_LEVEL) / MINIMAP_SHADE_SPAN);

      const offset = (row * MAP_SIZE + column) * 4;

      image[offset] = color[0] * shade;
      image[offset + 1] = color[1] * shade;
      image[offset + 2] = color[2] * shade;
      image[offset + 3] = 255;
    }
  }

  return image;
};
