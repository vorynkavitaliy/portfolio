import type { Rgb } from '@/scene/world/palette';

export type GlowSet = Readonly<{
  positions: Float32Array;
  colors: Float32Array;
  scales: Float32Array;
}>;

export type GlowCollector = Readonly<{
  add: (x: number, y: number, z: number, color: Rgb, scale: number) => void;
  build: () => GlowSet;
}>;

export const createGlowCollector = (): GlowCollector => {
  const positions: number[] = [];
  const colors: number[] = [];
  const scales: number[] = [];

  const add = (x: number, y: number, z: number, color: Rgb, scale: number): void => {
    positions.push(x + 0.5, y + 0.5, z + 0.5);
    colors.push(color[0], color[1], color[2]);
    scales.push(scale);
  };

  const build = (): GlowSet => {
    return {
      positions: Float32Array.from(positions),
      colors: Float32Array.from(colors),
      scales: Float32Array.from(scales),
    };
  };

  return { add, build };
};
