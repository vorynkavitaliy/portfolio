import { linearFromHex } from '@/scene/world/palette';

export const ENVIRONMENT_COLORS = {
  skyTop: linearFromHex('#03050c'),
  water: linearFromHex('#2c5f94'),
  cloud: linearFromHex('#c9d2ea'),
  cloudEmissive: linearFromHex('#1a2140'),
  hemisphereSky: linearFromHex('#93a6dd'),
  hemisphereGround: linearFromHex('#3a2c1e'),
  moonLight: linearFromHex('#dce4ff'),
  stationLight: linearFromHex('#ffb347'),
  star: linearFromHex('#dfe6ff'),
  glowBase: [1, 1, 1],
  moonDisc: [1.6, 1.55, 1.35],
} as const;

export const SKY_RADIUS = 600;
export const SKY_SEGMENTS = { width: 32, height: 16 } as const;
export const MOON_DIRECTION = { x: -0.55, y: 0.42, z: -0.72 } as const;
export const MOON_DISTANCE = 480;
export const MOON_RADIUS = 16;
export const MOON_SEGMENTS = 32;
export const MOON_LIGHT_DISTANCE = 100;

export const STAR_SIZE = 1.6;
export const STAR_OPACITY = 0.85;

export const WATER_OPACITY = 0.84;
export const WATER_DROP = 0.15;
export const WATER_SPAN_FACTOR = 3;
export const WATER_SCROLL = { x: 0.05, y: 0.03 } as const;

export const CLOUD_SIZE = { x: 4, y: 2, z: 4 } as const;
export const CLOUD_OPACITY = 0.55;
export const CLOUD_DRIFT_SPEED = 0.8;
export const CLOUD_DRIFT_SPAN = 60;

export const HEMISPHERE_INTENSITY = 1.25;
export const MOON_LIGHT_INTENSITY = 1.5;
export const AMBIENT_INTENSITY = 0.12;
export const AMBIENT_WHITE = 0xffffff;
export const STATION_LIGHT = { intensity: 40, distance: 22, decay: 1.6, lift: 2 } as const;
export const STATION_LIGHT_COUNT = 9;
