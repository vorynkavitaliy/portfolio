export type WorldCaseSource = 'prototype' | 'spec' | 'owner-2026-10-07' | 'three-docs';

export type WorldCase = Readonly<{
  id: string;
  source: WorldCaseSource;
  reference: string;
  expected: string;
}>;

const NOISE = 'docs/prototype/index.html:766-783 (mulberry32, simplex noise, fbm)';

const HEIGHTS =
  'docs/prototype/index.html:785-812, :850-855 (rawHeight, heightFn, generateHeights)';

const STATION_RULES = 'docs/prototype/index.html:793-806 (stationBase, nearStation, flatten)';
const BLOCKS = 'docs/prototype/index.html:905-928 (block classes, depth shade, landing plate)';
const TREES = 'docs/prototype/index.html:930-940 (trees evaluated with a fresh stream seeded 7091)';

const STRUCTURES =
  'docs/prototype/index.html:946-963, :1166-1174 (station structures, AI nodes, mast)';

const SCATTER = 'docs/prototype/index.html:1019-1026, :1035-1041, :1064-1070, :1083-1092';

const LETTERS =
  'docs/prototype/index.html:1103-1124 (glyphs, letter cells, starts, targets, delays)';

const MINIMAP = 'docs/prototype/index.html:821-822 (minimap bands and shade)';
const MESHER = 'plan 0002 §9 S05 mesher (free-neighbour faces; outside the map empty; y < 1 solid)';
const SHADE = 'docs/prototype/index.html:972 (top 1, bottom 0.55, x 0.86, z 1)';
const FIXED_SEED = 'docs/spec/portfolio-spec.md FR-021 (identical on every visit and every device)';

export const WORLD_CASES = [
  {
    id: 'world.noise.stream-values',
    source: 'prototype',
    reference: NOISE,
    expected:
      'mulberry32(1907) first outputs and makeNoise(1907) and makeNoise(4411) samples equal the prototype functions evaluated in Node',
  },
  {
    id: 'world.height.checksum',
    source: 'prototype',
    reference: HEIGHTS,
    expected: 'sum of H[i] * ((i mod 97) + 1) mod 1000003 equals 798532',
  },
  {
    id: 'world.height.range',
    source: 'prototype',
    reference: HEIGHTS,
    expected: 'minimum height 2 and maximum height 40',
  },
  {
    id: 'world.height.sea-cells',
    source: 'prototype',
    reference: HEIGHTS,
    expected: 'exactly 3517 cells at or below sea level 7',
  },
  {
    id: 'world.height.sample-cells',
    source: 'prototype',
    reference: HEIGHTS,
    expected: 'H[0] is 2 and H[64 * 128 + 64] is 10',
  },
  {
    id: 'world.height.lookup',
    source: 'prototype',
    reference: 'docs/prototype/index.html:808-812 (hAt)',
    expected:
      'heightAt floors x and z, indexes ix * 128 + iz with ix = floor(x) + 64, and returns 1 outside the map on every side',
  },
  {
    id: 'world.station.bases',
    source: 'prototype',
    reference: STATION_RULES,
    expected: 'station bases are 14, 13, 13, 24, 9, 13, 9, 10, 9',
  },
  {
    id: 'world.station.tops',
    source: 'prototype',
    reference: 'docs/prototype/index.html:946-947 (stationTops)',
    expected: 'stationTops hold px + 0.5, base + 1, pz + 0.5 for the nine stations in order',
  },
  {
    id: 'world.station.flat-core',
    source: 'prototype',
    reference: STATION_RULES,
    expected:
      'every column whose centre lies within 5.5 of a station centre has height equal to that station base',
  },
  {
    id: 'world.station.plate',
    source: 'prototype',
    reference: BLOCKS,
    expected:
      'the top cell of every column within 4.2 of a station centre has the landing plate colours and no other column has them',
  },
  {
    id: 'world.blocks.classes',
    source: 'prototype',
    reference: BLOCKS,
    expected:
      'every terrain cell of the real map carries the prototype class colours (sand, snow, stone, grass, dirt, plate)',
  },
  {
    id: 'world.blocks.depth-shade',
    source: 'prototype',
    reference: BLOCKS,
    expected:
      'side colour is multiplied by 1 - 0.1 * min(depth, 4): depth 1 is 0.9, depth 4 and depth 6 are 0.6',
  },
  {
    id: 'world.blocks.linear-colors',
    source: 'three-docs',
    reference: 'three.js Color.setHex with SRGBColorSpace stores linear working-space values',
    expected: 'palette values equal THREE.Color linear r, g, b for the same hex strings',
  },
  {
    id: 'world.trees.count',
    source: 'prototype',
    reference: TREES,
    expected: '160 trees, 643 trunk cells, trunk column index sum 1235075, 40 lanterns',
  },
  {
    id: 'world.trees.rules',
    source: 'prototype',
    reference: TREES,
    expected:
      'every tree is more than 9 from every station, its ground top is in (9, 21) and its height is 3 to 5',
  },
  {
    id: 'world.trees.cells',
    source: 'prototype',
    reference: TREES,
    expected:
      'trunk cells fill top + 1 to top + height of the tree column and leaf cells stay within the diamond radius 3',
  },
  {
    id: 'world.struct.posts',
    source: 'prototype',
    reference: STRUCTURES,
    expected:
      'each station has four 3-block plate posts at (+-3, +-3) from base + 1, nothing above them, and four post glows plus one centre glow',
  },
  {
    id: 'world.struct.systems',
    source: 'prototype',
    reference: STRUCTURES,
    expected:
      'Systems has four 7-block stone pillars at (+-2, 0) and (0, +-2) with four cyan glows',
  },
  {
    id: 'world.struct.this-world',
    source: 'prototype',
    reference: STRUCTURES,
    expected: 'This world has seven sculpture blocks and six cyan glows at the listed offsets',
  },
  {
    id: 'world.struct.antenna',
    source: 'prototype',
    reference: STRUCTURES,
    expected:
      'Contact antenna is 16 cells at (+2, -2) from base + 1 with plate cells at every fourth height starting at 3, and the mast point at (+2.5, base + 17.5, -1.5)',
  },
  {
    id: 'world.struct.ai-nodes',
    source: 'prototype',
    reference: STRUCTURES,
    expected:
      'four AI nodes at x = top x + (-6, -2, 2, 6), y = top y + 7, z = top z - 3 and stone pillars from top y up to the node',
  },
  {
    id: 'world.struct.glow-total',
    source: 'prototype',
    reference: STRUCTURES,
    expected: '95 glow cubes: 55 structural and 40 tree lanterns, with the prototype scales',
  },
  {
    id: 'world.mesh.single-block',
    source: 'owner-2026-10-07',
    reference: MESHER,
    expected: 'one block on the ground at y 1 emits 5 faces, a block floating at y 2 emits 6',
  },
  {
    id: 'world.mesh.map-edge',
    source: 'owner-2026-10-07',
    reference: MESHER,
    expected:
      'a block in the first and in the last column of the map emits 5 faces including the outward one',
  },
  {
    id: 'world.mesh.stair',
    source: 'owner-2026-10-07',
    reference: MESHER,
    expected: 'a two-step stair (cells (0,1), (1,1), (1,2)) emits exactly 12 faces',
  },
  {
    id: 'world.mesh.chunk-border',
    source: 'owner-2026-10-07',
    reference: MESHER,
    expected:
      'two adjacent blocks across the 32-column chunk border emit 4 faces each in two chunks and the shared face is emitted by neither',
  },
  {
    id: 'world.mesh.naive-count',
    source: 'owner-2026-10-07',
    reference: MESHER,
    expected:
      'on the real map the face count equals an independent six-neighbour count over the same cells',
  },
  {
    id: 'world.mesh.chunk-limits',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §5.3 and §9 S05 (at most 16 chunks, Uint16 indices below 65536)',
    expected:
      'at most 16 chunks, none empty, each with fewer than 65536 vertices and every index below its vertex count',
  },
  {
    id: 'world.mesh.geometry',
    source: 'three-docs',
    reference: 'three.js front face is counter-clockwise; plan 0002 §5.3 chunk layout',
    expected:
      'every triangle winds counter-clockwise around its stored normal, positions are integer world corners, normals are unit axes at 127, uv corners are 0 or 255',
  },
  {
    id: 'world.mesh.cell-position',
    source: 'prototype',
    reference: 'docs/prototype/index.html:1002 (block translated to x + 0.5, y - 0.5, z + 0.5)',
    expected: 'the cell (ix, y, iz) spans x ix - 64 to +1, y y - 1 to y, z iz - 64 to +1',
  },
  {
    id: 'world.mesh.face-colors',
    source: 'prototype',
    reference: SHADE,
    expected:
      'top face uses the top colour times 1, bottom the side colour times 0.55, x faces times 0.86, z faces times 1, as rounded bytes',
  },
  {
    id: 'world.scatter.stars',
    source: 'prototype',
    reference: SCATTER,
    expected: '1600 stars with the first, last and radius from the prototype loop at seed 7093',
  },
  {
    id: 'world.scatter.clouds',
    source: 'prototype',
    reference: SCATTER,
    expected: '590 cloud cells, first three, last, and heights 44 to 47',
  },
  {
    id: 'world.scatter.burst',
    source: 'prototype',
    reference: SCATTER,
    expected: '220 burst directions with the first and last from the prototype loop at seed 7095',
  },
  {
    id: 'world.scatter.fireflies',
    source: 'prototype',
    reference: SCATTER,
    expected:
      '520 fireflies with the prototype first, second and last positions and seeds, each inside the margin 58 and 1 to 5 above the ground',
  },
  {
    id: 'world.letters.cells',
    source: 'prototype',
    reference: LETTERS,
    expected:
      '192 letter cells for VITALII and VORYNKA with the prototype first and last targets, first start and delays below 0.55',
  },
  {
    id: 'world.letters.unknown-glyph',
    source: 'prototype',
    reference: LETTERS,
    expected: 'a character without a glyph is rejected by generation and by the request schema',
  },
  {
    id: 'world.minimap.bands',
    source: 'prototype',
    reference: MINIMAP,
    expected:
      'every pixel of the 128 by 128 image at row z, column x has the band colour and height shade of its cell, alpha 255',
  },
  {
    id: 'world.texture.pixels',
    source: 'prototype',
    reference: 'docs/prototype/index.html:885-893 (16 by 16 pixel texture)',
    expected:
      '16 by 16 opaque grey pixels, values 150 to 254 in the body and the last row and column darkened to 0.78',
  },
  {
    id: 'world.gen.deterministic',
    source: 'spec',
    reference: FIXED_SEED,
    expected: 'two generations give byte-equal data in every array, only generationMs may differ',
  },
  {
    id: 'world.gen.progress',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §5.3 (progress: heights 0 to 0.4, chunks 0.4 to 0.95, scatter 1)',
    expected: 'progress never decreases, stays within 0 to 1 and ends at exactly 1 once',
  },
  {
    id: 'world.gen.transferables',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §5.3 (worldTransferables)',
    expected: 'transfer list holds each backing buffer of every array once and nothing else',
  },
  {
    id: 'world.gen.shape',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §5.3 (WorldData)',
    expected:
      'array types and lengths match the WorldData contract and generationMs is a finite number',
  },
  {
    id: 'world.request.schema',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §5.3 (the worker validates WorldRequest with zod/mini)',
    expected:
      'the name lines are accepted, empty, lowercase, too many lines and non-arrays are rejected',
  },
] as const satisfies readonly WorldCase[];

export type WorldCaseId = (typeof WORLD_CASES)[number]['id'];
