import { noisePrimary, noiseRidge } from '@/scene/world/heightmap-math';
import { createRng } from '@/scene/world/rng';
import {
  BURST_COUNT,
  CLOUD_BASE_Y,
  CLOUD_EXTENT,
  CLOUD_STEP,
  CLOUD_THRESHOLD,
  CLOUD_Y_SPREAD,
  FIREFLY_COUNT,
  MAP_HALF,
  RNG_SEEDS,
  SEA_LEVEL,
  STAR_COUNT,
  STAR_RADIUS,
} from '@/scene/world/world.constants';

import type { Terrain } from '@/scene/flight/flight.types';

const FIREFLY_MARGIN = 6;
const FIREFLY_TRIES = 20;
const FIREFLY_TOP_MAX = 22;
const FIREFLY_LIFT = 4;

export const generateClouds = (): Float32Array => {
  const cells: number[] = [];

  for (let gx = -CLOUD_EXTENT; gx < CLOUD_EXTENT; gx += CLOUD_STEP) {
    for (let gz = -CLOUD_EXTENT; gz < CLOUD_EXTENT; gz += CLOUD_STEP) {
      if (noiseRidge(gx * 0.03 + 9, gz * 0.03) > CLOUD_THRESHOLD) {
        cells.push(
          gx,
          CLOUD_BASE_Y + Math.floor(noisePrimary(gx * 0.1, gz * 0.1) * CLOUD_Y_SPREAD),
          gz,
        );
      }
    }
  }

  return Float32Array.from(cells);
};

export const generateStars = (): Float32Array => {
  const random = createRng(RNG_SEEDS.stars);
  const stars = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i++) {
    const u = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const y = Math.abs(u) * 0.9 + 0.08;
    const radius = Math.sqrt(1 - y * y);

    stars[i * 3] = Math.cos(angle) * radius * STAR_RADIUS;
    stars[i * 3 + 1] = y * STAR_RADIUS;
    stars[i * 3 + 2] = Math.sin(angle) * radius * STAR_RADIUS;
  }

  return stars;
};

export const generateBurst = (): Float32Array => {
  const random = createRng(RNG_SEEDS.burst);
  const burst = new Float32Array(BURST_COUNT * 3);

  for (let i = 0; i < BURST_COUNT; i++) {
    const angle = random() * Math.PI * 2;
    const up = 0.4 + random() * 1.4;
    const speed = 0.6 + random() * 1.4;

    burst[i * 3] = Math.cos(angle) * speed;
    burst[i * 3 + 1] = up;
    burst[i * 3 + 2] = Math.sin(angle) * speed;
  }

  return burst;
};

export const generateFireflies = (
  terrain: Terrain,
): Readonly<{ positions: Float32Array; seeds: Float32Array }> => {
  const random = createRng(RNG_SEEDS.fireflies);
  const positions = new Float32Array(FIREFLY_COUNT * 3);
  const seeds = new Float32Array(FIREFLY_COUNT);
  const span = MAP_HALF - FIREFLY_MARGIN;

  for (let i = 0; i < FIREFLY_COUNT; i++) {
    let x = 0;
    let z = 0;
    let height = 0;
    let tries = 0;

    do {
      x = (random() * 2 - 1) * span;
      z = (random() * 2 - 1) * span;
      height = terrain.heightAt(x, z);
      tries++;
    } while ((height <= SEA_LEVEL + 1 || height > FIREFLY_TOP_MAX) && tries < FIREFLY_TRIES);

    positions[i * 3] = x;
    positions[i * 3 + 1] = height + 1 + random() * FIREFLY_LIFT;
    positions[i * 3 + 2] = z;
    seeds[i] = random();
  }

  return { positions, seeds };
};
