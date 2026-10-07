export const CAMERA_BACK = 11;
export const CAMERA_UP = 3.8;
export const LOOK_AHEAD = 9;
export const LOOK_STATION_BLEND = 0.6;
export const LOOK_LIFT = { home: 10, station: 6 } as const;
export const CAMERA_POS_RATE = { normal: 4, reduced: 12 } as const;
export const CAMERA_LOOK_RATE = { normal: 6, reduced: 20 } as const;
export const NAV_BLEND_RATE = 1.6;

export const INTRO_FROM = { x: -30, y: 90, z: 60 } as const;
export const INTRO_LOOK_LIFT = 10;

export const FOV = { desktop: 52, narrow: 62 } as const;
export const FOV_KICK = 8;
export const FOV_RESPONSE = 3;
export const FOV_EPSILON = 0.01;

export const FOG_COLOR = 0x1d2748;
export const FOG_DENSITY = 0.0105;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 900;

export const VIEW_OFFSET = 0.17;
export const NARROW_MAX_WIDTH = 860;
export const DPR_CAP = { desktop: 1.75, narrow: 1.5 } as const;
export const FPS_FLOOR = { desktop: 45, narrow: 26 } as const;
export const FPS_WINDOW_MS = 2000;
export const FPS_GRACE_MS = 2000;
export const FPS_SLOW_WINDOWS = 2;
export const FPS_SAMPLE_CAPACITY = 1024;
export const LOWEST_TIER = 2;

export const DOCK_EFFECT = { beam: 2.6, ring: 18, bloom: 0.7, shake: 0.35 } as const;
export const SEND_EFFECT = { beam: 5, ring: 60, bloom: 2, shake: 0.6 } as const;
export const TAKE_OFF_BLOOM = 0.6;
export const EFFECT_DECAY = { beam: 0.965, bloom: 0.94, shake: 0.9 } as const;
export const SHAKE_MIN = 0.01;
export const RING_LIFT = 0.15;
export const BURST_LIFT = 1.2;
export const BURST_END = 1.2;
export const SEND_STATION = 8;
export const BLOOM_BASE = 0.7;
export const BLOOM_GAIN = 0.55;

export const SEND_CHIMES: readonly Readonly<{ index: number; delay: number }>[] = [
  { index: 0, delay: 0 },
  { index: 2, delay: 0.12 },
  { index: 4, delay: 0.24 },
];
