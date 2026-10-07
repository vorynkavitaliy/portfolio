import { Color } from 'three';

import type { Rgb } from '@/scene/world/palette';

export const colorOf = (rgb: Rgb): Color => {
  return new Color().setRGB(rgb[0], rgb[1], rgb[2]);
};
