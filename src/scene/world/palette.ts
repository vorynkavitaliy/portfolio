export type Rgb = readonly [number, number, number];

const srgbChannelToLinear = (channel: number): number => {
  return channel < 0.04045
    ? channel * 0.0773993808
    : Math.pow(channel * 0.9478672986 + 0.0521327014, 2.4);
};

export const linearFromHex = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16);

  return [
    srgbChannelToLinear(((value >> 16) & 255) / 255),
    srgbChannelToLinear(((value >> 8) & 255) / 255),
    srgbChannelToLinear((value & 255) / 255),
  ];
};

export const PALETTE = {
  grass: linearFromHex('#58a043'),
  dirt: linearFromHex('#7a5232'),
  sand: linearFromHex('#d9c487'),
  sandSide: linearFromHex('#c4ae72'),
  stone: linearFromHex('#7f848c'),
  stoneDark: linearFromHex('#5d626b'),
  snow: linearFromHex('#f1f5f9'),
  snowSide: linearFromHex('#c4cbd4'),
  plate: linearFromHex('#a6a9b0'),
  plateSide: linearFromHex('#6c7079'),
  trunk: linearFromHex('#6b4a2b'),
  trunkTop: linearFromHex('#9a7a4f'),
  leaf: linearFromHex('#2f7a3a'),
  leafDark: linearFromHex('#25602e'),
} as const;

export const GLOW_COLORS = {
  lantern: [1.8, 1.25, 0.55],
  post: [2.2, 1.55, 0.6],
  centre: [3.0, 1.6, 0.2],
  pillar: [0.6, 1.6, 2.4],
  sculpture: [0.5, 2.2, 2.6],
} as const satisfies Record<string, Rgb>;

export const MINIMAP_COLORS = {
  sea: [40, 86, 140],
  sand: [200, 184, 130],
  grass: [70, 128, 60],
  stone: [120, 124, 130],
  snow: [235, 240, 245],
} as const satisfies Record<string, Rgb>;
