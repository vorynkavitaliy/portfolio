export type TerrainChunk = Readonly<{
  positions: Float32Array;
  normals: Int8Array;
  uvs: Uint8Array;
  colors: Uint8Array;
  indices: Uint16Array;
}>;

export type WorldData = Readonly<{
  heights: Int16Array;
  stationTops: Float32Array;
  chunks: readonly TerrainChunk[];
  glow: Readonly<{ positions: Float32Array; colors: Float32Array; scales: Float32Array }>;
  clouds: Float32Array;
  stars: Float32Array;
  burst: Float32Array;
  aiNodes: Float32Array;
  mast: Float32Array;
  fireflies: Readonly<{ positions: Float32Array; seeds: Float32Array }>;
  letters: Readonly<{ targets: Float32Array; starts: Float32Array; delays: Float32Array }>;
  pixelTexture: Uint8Array;
  minimap: Uint8ClampedArray;
  generationMs: number;
}>;

export type WorldRequest = Readonly<{ skyName: readonly string[] }>;

export type WorldMessage =
  { type: 'progress'; value: number } | { type: 'done'; data: WorldData } | { type: 'error' };
