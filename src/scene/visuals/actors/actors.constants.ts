import { GLOW_COLORS, PLANE_COLORS, type Rgb } from '@/scene/world/palette';

import type { BoxPart } from '@/scene/visuals/actors/box-geometry';

const { hull: HULL, wing: WING, nose: NOSE, canopy: CANOPY, prop: PROP } = PLANE_COLORS;

const ENGINE_GLOW: Rgb = [2.4, 1.3, 0.15];
const PORT_LAMP: Rgb = [3, 0.2, 0.2];
const STARBOARD_LAMP: Rgb = [0.2, 3, 0.6];
const STROBE_GLOW: Rgb = [3, 3, 3];

export const PLANE_BODY_PARTS: readonly BoxPart[] = [
  { size: [0.7, 0.7, 2.8], at: [0, 0, 0], color: HULL },
  { size: [0.5, 0.5, 0.5], at: [0, 0, 1.6], color: NOSE },
  { size: [0.5, 0.28, 0.8], at: [0, 0.45, 0.35], color: CANOPY },
  { size: [3.2, 0.12, 1.0], at: [0, -0.08, 0.15], color: WING },
  { size: [0.1, 0.9, 0.7], at: [0, 0.7, -1.25], color: WING },
  { size: [1.5, 0.1, 0.55], at: [0, 0.12, -1.3], color: WING },
];

export const PLANE_GLOW_PARTS: readonly BoxPart[] = [
  { size: [0.74, 0.12, 2.0], at: [0, 0.02, -0.1], color: ENGINE_GLOW },
  { size: [0.18, 0.18, 0.18], at: [1.62, -0.08, 0.15], color: PORT_LAMP },
  { size: [0.18, 0.18, 0.18], at: [-1.62, -0.08, 0.15], color: STARBOARD_LAMP },
];

export const PLANE_PROP_PARTS: readonly BoxPart[] = [
  { size: [2.0, 0.14, 0.06], at: [0, 0, 0], color: PROP },
  { size: [0.14, 2.0, 0.06], at: [0, 0, 0], color: PROP },
  { size: [0.2, 0.2, 0.16], at: [0, 0, 0], color: NOSE },
];

export const PLANE_STROBE_PARTS: readonly BoxPart[] = [
  { size: [0.16, 0.16, 0.16], at: [0, 1.2, -1.45], color: STROBE_GLOW },
];

export const PLANE_PROP_OFFSET_Z = 1.95;
export const PLANE_PROP_SPIN = { base: 30, perSpeed: 2 } as const;
export const STROBE = { period: 1.4, on: 0.1 } as const;

export const BEAM_COLOR: Rgb = [1.0, 0.55, 0.08];
export const BEAM_HEIGHT = 90;
export const BEAM_CENTER_LIFT = 45.5;
export const BEAM_CORE = { radius: 0.28, segments: 10, base: 0.55 } as const;
export const BEAM_HALO = {
  radius: 1.1,
  segments: 16,
  base: 0.16,
  activeGain: 0.3,
  boostGain: 0.4,
  timeOffset: 1.3,
} as const;
export const BEAM_DOCKED_ACTIVE = 0.6;
export const BEAM_TARGET_ACTIVE = 0.3;

export const LINK_RADIUS = 0.11;
export const LINK_SEGMENTS = 6;
export const LINK_LIFT = 3;
export const LINK_MIN_LENGTH = 0.05;
export const LINK_PULSE = { base: 0.7, amplitude: 0.25, rate: 5 } as const;
export const LINK_COLOR: Rgb = GLOW_COLORS.link;
export const LINK_PACKET_COUNT = 5;
export const LINK_PACKET_RATE = 0.8;
export const LINK_PACKET_SCALE = { base: 0.18, swing: 0.32 } as const;
export const LINK_PACKET_COLOR: Rgb = [3, 2.2, 0.7];

export const AI_NODE_SCALE = 1.2;
export const AI_NODE_COLOR: Rgb = [2.4, 1.3, 0.15];
export const AI_LINE_COLOR: Rgb = [1.4, 0.8, 0.1];
export const AI_LINE_OPACITY = 0.8;
export const AI_PACKET = { count: 6, segments: 3, rate: 0.55, scale: 0.45 } as const;
export const AI_PACKET_COLOR: Rgb = [1.5, 2.2, 3];

export const MAST_SIZE = 0.7;
export const MAST_COLOR: Rgb = [3, 0.25, 0.2];
export const MAST_BLINK_HZ = 1.2;

export const LETTER_COLOR: Rgb = [1.05, 0.98, 0.88];
export const LETTER_SETTLE = 0.45;
export const LETTER_START_SCALE = 0.4;
export const LETTER_INTRO_K_SCALE = 1.6;
export const LETTER_DONE_K = 2;
export const LETTER_BOB = { rate: 0.8, amplitude: 0.25 } as const;

export const RING = {
  baseScale: 0.5,
  opacity: 0.9,
  innerRadius: 0.92,
  outerRadius: 1,
  segments: 96,
  color: [2.2, 1.2, 0.2],
} as const;

export const BURST_COLOR: Rgb = [2.4, 1.4, 0.35];
export const BURST_ORIGIN_TIME = 2;
export const BURST_SIZE = { scale: 0.22, travel: 9, drop: 4 } as const;

export const BLOOM = { radius: 0.42, threshold: 0.86 } as const;
