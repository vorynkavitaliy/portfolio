export type EnvironmentCaseSource =
  'prototype' | 'spec' | 'scene-rule' | 'owner-2026-10-07' | 'three-docs';

export type EnvironmentCase = Readonly<{
  id: string;
  source: EnvironmentCaseSource;
  reference: string;
  expected: string;
}>;

const CLOUDS = 'prototype :1036–1039 (blocks), :1553 (drift); plan S17 drift ((t·0.8) mod 60) − 30';
const FIREFLIES = 'prototype :1083–1101 (fireflies), :1552 (frozen time); spec FR-039, FR-040';
const WATER = 'prototype :1000–1002 (plane, map), :1555 (offset)';
const SKY = 'prototype :1005–1013 (dome, moon), :1554 (follows the camera)';
const STARS = 'prototype :1015–1021';
const GLOW = 'prototype :990–999 (instanced emissive cubes, setColorAt)';
const LIGHTS = 'prototype :1023–1027; spec FR-040 (no per-station point lights on narrow)';
const BUDGET = 'scene-3d.md §3 (draw calls), plan S17 review focus (one draw call per module)';
const DISPOSE = 'scene-3d.md §4 (dispose every geometry, material, texture)';

export const ENVIRONMENT_CASES = [
  { id: 'math.cloud.start', source: 'prototype', reference: CLOUDS, expected: 'time 0 → −30' },
  { id: 'math.cloud.middle', source: 'prototype', reference: CLOUDS, expected: 'time 37.5 → 0' },
  {
    id: 'math.cloud.wrap',
    source: 'prototype',
    reference: CLOUDS,
    expected: 'time 75 → −30 again',
  },
  {
    id: 'math.firefly.count',
    source: 'spec',
    reference: FIREFLIES,
    expected: 'desktop 520, narrow 260, never more than available',
  },
  {
    id: 'math.firefly.time',
    source: 'spec',
    reference: FIREFLIES,
    expected: 'reduced motion → 0, otherwise the frame time',
  },
  { id: 'math.water.offset', source: 'prototype', reference: WATER, expected: '0.05·t, 0.03·t' },
  {
    id: 'glow.instances',
    source: 'prototype',
    reference: GLOW,
    expected: 'one instance per glow entry, scale and position in the matrix, colour per instance',
  },
  {
    id: 'glow.material',
    source: 'prototype',
    reference: GLOW,
    expected: 'basic material, white base, not tone mapped',
  },
  {
    id: 'glow.dispose',
    source: 'scene-rule',
    reference: DISPOSE,
    expected: 'geometry and material released',
  },
  {
    id: 'water.plane',
    source: 'prototype',
    reference: WATER,
    expected: 'plane 384 × 384 flat at sea level − 0.15, opacity 0.84, repeating own texture clone',
  },
  {
    id: 'water.scroll',
    source: 'prototype',
    reference: WATER,
    expected: 'update moves the texture offset, the shared pixel texture stays untouched',
  },
  {
    id: 'water.dispose',
    source: 'scene-rule',
    reference: DISPOSE,
    expected: 'geometry, material and the clone released',
  },
  {
    id: 'sky.dome',
    source: 'prototype',
    reference: SKY,
    expected: 'sphere radius 600, back side, no depth write, no fog, three uniforms',
  },
  {
    id: 'sky.follows',
    source: 'prototype',
    reference: SKY,
    expected: 'dome sits on the camera',
  },
  {
    id: 'moon.disc',
    source: 'prototype',
    reference: SKY,
    expected: 'circle radius 16 / 32 segments, bright, no fog, not tone mapped',
  },
  {
    id: 'moon.follows',
    source: 'prototype',
    reference: SKY,
    expected: '480 along the moon direction from the camera, facing the camera',
  },
  {
    id: 'stars.points',
    source: 'prototype',
    reference: STARS,
    expected: 'one point per star, size 1.6 without attenuation, opacity 0.85, no fog',
  },
  {
    id: 'clouds.instances',
    source: 'prototype',
    reference: CLOUDS,
    expected: 'one 4×2×4 instance per cloud cell, translucent 0.55',
  },
  {
    id: 'clouds.drift',
    source: 'prototype',
    reference: CLOUDS,
    expected: 'update sets x from the drift formula',
  },
  {
    id: 'fireflies.range',
    source: 'spec',
    reference: FIREFLIES,
    expected: 'draw range 520 desktop, 260 narrow',
  },
  {
    id: 'fireflies.uniforms',
    source: 'spec',
    reference: FIREFLIES,
    expected:
      'time uniform frozen at 0 under reduced motion, scale uniform follows viewport height',
  },
  {
    id: 'lights.desktop',
    source: 'prototype',
    reference: LIGHTS,
    expected: 'hemisphere, moon, ambient and nine station point lights 2 above the tops',
  },
  {
    id: 'lights.narrow',
    source: 'spec',
    reference: LIGHTS,
    expected: 'hemisphere, moon and ambient only',
  },
  {
    id: 'lights.values',
    source: 'prototype',
    reference: LIGHTS,
    expected: 'intensities 1.25 / 1.5 / 0.12, station light 40 / 22 / 1.6',
  },
  {
    id: 'env.draw-calls',
    source: 'scene-rule',
    reference: BUDGET,
    expected: 'seven renderable modules plus lights, identical on both profiles',
  },
  {
    id: 'env.dispose',
    source: 'scene-rule',
    reference: DISPOSE,
    expected: 'every module disposes its geometries and materials',
  },
] as const satisfies readonly EnvironmentCase[];

export type EnvironmentCaseId = (typeof ENVIRONMENT_CASES)[number]['id'];
