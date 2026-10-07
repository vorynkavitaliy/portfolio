export const MAP_HALF = 64;
export const MAP_SIZE = 128;
export const SEA_LEVEL = 7;
export const WORLD_HEIGHT = 64;
export const CHUNK_SIZE = 32;
export const CHUNKS_PER_SIDE = MAP_SIZE / CHUNK_SIZE;

export const STATION_COUNT = 9;

export const STATION_POSITIONS: readonly (readonly [number, number])[] = [
  [-46, 40],
  [-42, 8],
  [-20, -30],
  [8, -44],
  [26, -20],
  [46, 6],
  [24, 26],
  [-2, 4],
  [44, 46],
];

export const STATION_INDEX = {
  systems: 5,
  thisWorld: 7,
  aiEngineering: 4,
  contact: 8,
} as const;

export const NOISE_SEEDS = { primary: 1907, ridge: 4411 } as const;

export const RNG_SEEDS = {
  trees: 7091,
  texture: 7092,
  stars: 7093,
  fireflies: 7094,
  burst: 7095,
  letters: 7096,
} as const;

export const STATION_BASE_MIN = SEA_LEVEL + 2;
export const STATION_BASE_MAX = 24;
export const FLATTEN_OUTER = 11;
export const FLATTEN_INNER = 5.5;
export const PLATE_RADIUS = 4.2;

export const TREE_CHANCE = 0.022;
export const TREE_STATION_CLEARANCE = 9;
export const TREE_TOP_MIN = SEA_LEVEL + 2;
export const TREE_TOP_MAX = 21;
export const TREE_HEIGHT_MIN = 3;
export const TREE_HEIGHT_SPREAD = 3;
export const TREE_LEAF_RADIUS = 3;
export const TREE_LEAF_KEEP = 0.12;
export const TREE_LEAF_DARK = 0.3;
export const TREE_LANTERN_CHANCE = 0.25;

export const SAND_MAX = SEA_LEVEL + 1;
export const STONE_FROM = 22;
export const SNOW_FROM = 30;
export const DEPTH_SHADE = 0.1;
export const DEPTH_SHADE_MAX_DEPTH = 4;

export const FACE_SHADE = { top: 1, bottom: 0.55, x: 0.86, z: 1 } as const;

export const CLOUD_STEP = 4;
export const CLOUD_EXTENT = MAP_HALF * 1.5;
export const CLOUD_THRESHOLD = 0.38;
export const CLOUD_BASE_Y = 46;
export const CLOUD_Y_SPREAD = 2;

export const STAR_COUNT = 1600;
export const STAR_RADIUS = 520;
export const FIREFLY_COUNT = 520;
export const FIREFLY_COUNT_NARROW = 260;
export const BURST_COUNT = 220;

export const LETTER_SCALE = 0.72;
export const LETTER_LIFT = 17;
export const LETTER_ADVANCE = 6;
export const LETTER_LINE_GAP = 9;
export const LETTER_ROWS = 7;

export const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
};

export const AI_NODE_OFFSETS_X: readonly number[] = [-6, -2, 2, 6];
export const AI_NODE_UP = 7;
export const AI_NODE_DZ = -3;
export const MAST_OFFSET = [2.5, 17.5, -1.5] as const;

export const MINIMAP_SHADE_BASE = 0.7;
export const MINIMAP_SHADE_RANGE = 0.3;
export const MINIMAP_SHADE_SPAN = 30;
export const MINIMAP_GRASS_MAX = 20;
export const MINIMAP_STONE_MAX = 28;

export const PIXEL_TEXTURE_SIZE = 16;

export const PROGRESS = { heights: 0.4, chunks: 0.95, done: 1 } as const;
