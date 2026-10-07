import { createNoise } from '@/scene/world/noise';
import { MAP_HALF, NOISE_SEEDS } from '@/scene/world/world.constants';

export const noisePrimary = createNoise(NOISE_SEEDS.primary);
export const noiseRidge = createNoise(NOISE_SEEDS.ridge);

export const clamp01 = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};

export const smooth = (from: number, to: number, value: number): number => {
  const t = clamp01((value - from) / (to - from));

  return t * t * (3 - 2 * t);
};

const fbm = (x: number, z: number, octaves: number): number => {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;

  for (let octave = 0; octave < octaves; octave++) {
    sum += amplitude * noisePrimary(x * frequency, z * frequency);
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return sum / norm;
};

export const rawHeight = (x: number, z: number): number => {
  const base = 11 + 8 * fbm(x * 0.022, z * 0.022, 4);
  const mountainNoise = Math.max(0, fbm(x * 0.013 + 40, z * 0.013 - 30, 3));
  const ridge = 1 - Math.abs(noiseRidge(x * 0.035, z * 0.035));
  const mountain = mountainNoise * mountainNoise * 46 * (0.55 + 0.45 * ridge);
  const edge = Math.max(Math.abs(x), Math.abs(z)) / MAP_HALF;
  const falloff = smooth(0.8, 1, edge);

  return (base + mountain) * (1 - falloff) + 2 * falloff;
};
