import { Color } from 'three';
import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/world/world.case-test';
import {
  BURST_REFERENCE,
  CLOUDS_REFERENCE,
  FIREFLIES_REFERENCE,
  LETTERS_REFERENCE,
  NOISE_REFERENCE,
  STARS_REFERENCE,
  STATION_BASES,
  TEXTURE_BODY_VALUES,
  TREES_REFERENCE,
} from '@tests/back/scene/world/world.reference';
import {
  fullFixture,
  realData,
  SKY_NAME,
  terrainFixture,
} from '@tests/back/scene/world/world.fixture';
import { generateWorld, worldTransferables } from '@/scene/world/generate-world';
import { createTerrain } from '@/scene/world/heightmap';
import { noisePrimary, noiseRidge, rawHeight } from '@/scene/world/heightmap-math';
import { meshOccupancy } from '@/scene/world/mesher';
import { cellIndex, createMaterialTable, createOccupancy, setCell } from '@/scene/world/occupancy';
import { PALETTE } from '@/scene/world/palette';
import { createRng } from '@/scene/world/rng';
import { worldRequestSchema } from '@/scene/world/world.schema';

import type { MaterialEntry } from '@/scene/world/occupancy';
import type { Rgb } from '@/scene/world/palette';
import type { TerrainChunk } from '@/scene/world/world.types';

const MAP = 128;
const HALF = 64;

const STATIONS: readonly (readonly [number, number])[] = [
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

const linearOf = (hex: string): Rgb => {
  const color = new Color(hex);

  return [color.r, color.g, color.b];
};

const scaled = (color: Rgb, factor: number): Rgb => {
  return [color[0] * factor, color[1] * factor, color[2] * factor];
};

const expectColor = (actual: Rgb, expected: Rgb): void => {
  expect(actual[0]).toBeCloseTo(expected[0], 9);
  expect(actual[1]).toBeCloseTo(expected[1], 9);
  expect(actual[2]).toBeCloseTo(expected[2], 9);
};

const sameColor = (actual: Rgb, expected: Rgb): boolean => {
  return (
    Math.abs(actual[0] - expected[0]) < 1e-9 &&
    Math.abs(actual[1] - expected[1]) < 1e-9 &&
    Math.abs(actual[2] - expected[2]) < 1e-9
  );
};

const PROTOTYPE_COLORS = {
  grass: linearOf('#58a043'),
  dirt: linearOf('#7a5232'),
  sand: linearOf('#d9c487'),
  stone: linearOf('#7f848c'),
  stoneDark: linearOf('#5d626b'),
  snow: linearOf('#f1f5f9'),
  snowSide: linearOf('#c4cbd4'),
  plate: linearOf('#a6a9b0'),
  plateSide: linearOf('#6c7079'),
  trunk: linearOf('#6b4a2b'),
  trunkTop: linearOf('#9a7a4f'),
  leaf: linearOf('#2f7a3a'),
  leafDark: linearOf('#25602e'),
  sandSide: linearOf('#c4ae72'),
};

const centreDistance = (ix: number, iz: number, station: readonly [number, number]): number => {
  return Math.hypot(ix - HALF + 0.5 - station[0], iz - HALF + 0.5 - station[1]);
};

const nearestDistance = (ix: number, iz: number): number => {
  return Math.min(
    ...STATIONS.map((station) => {
      return centreDistance(ix, iz, station);
    }),
  );
};

const expectedCellColors = (y: number, depth: number, plate: boolean): readonly [Rgb, Rgb] => {
  const dark = 1 - Math.min(depth, 4) * 0.1;
  const c = PROTOTYPE_COLORS;

  if (plate && depth === 0) {
    return [c.plate, scaled(c.plateSide, dark)];
  }

  if (y <= 8) {
    return [c.sand, scaled(c.sandSide, dark)];
  }

  if (y >= 30) {
    return [c.snow, scaled(depth === 0 ? c.snowSide : c.stone, dark)];
  }

  if (y >= 22) {
    return [c.stone, scaled(c.stoneDark, dark)];
  }

  if (depth === 0) {
    return [c.grass, scaled(c.dirt, dark)];
  }

  return [c.dirt, scaled(c.dirt, dark)];
};

const entryAt = (
  materials: readonly MaterialEntry[],
  cells: Uint8Array,
  ix: number,
  y: number,
  iz: number,
): MaterialEntry => {
  const id = cells[cellIndex(ix, y, iz)] ?? 0;
  const entry = materials[id - 1];

  if (id === 0 || entry === undefined) {
    throw new Error(`empty cell at ${ix},${y},${iz}`);
  }

  return entry;
};

const findMaterial = (materials: readonly MaterialEntry[], top: Rgb, side: Rgb): number => {
  const index = materials.findIndex((entry) => {
    return sameColor(entry.top, top) && sameColor(entry.side, side);
  });

  return index + 1;
};

const faceCount = (chunks: readonly TerrainChunk[]): number => {
  return chunks.reduce((total, chunk) => {
    return total + chunk.indices.length / 6;
  }, 0);
};

const HAND_TOP: Rgb = [0.8, 0.4, 0.2];
const HAND_SIDE: Rgb = [0.5, 0.25, 0.125];

const meshCells = (
  cells: readonly (readonly [number, number, number])[],
): readonly TerrainChunk[] => {
  const occupancy = createOccupancy();
  const materials = createMaterialTable();
  const id = materials.register(HAND_TOP, HAND_SIDE);

  for (const [ix, y, iz] of cells) {
    setCell(occupancy, ix, y, iz, id);
  }

  return meshOccupancy(occupancy, materials, () => {});
};

const stationBase = (index: number): number => {
  return STATION_BASES[index] ?? 0;
};

const stationOf = (index: number): readonly [number, number] => {
  return STATIONS[index] ?? [0, 0];
};

const cellId = (ix: number, y: number, iz: number): number => {
  return fullFixture().occupancy.cells[cellIndex(ix, y, iz)] ?? 0;
};

const worldCell = (x: number, y: number, z: number): number => {
  return cellId(x + HALF, y, z + HALF);
};

const approxList = (
  actual: ArrayLike<number>,
  expected: readonly number[],
  digits: number,
): void => {
  expect(actual.length).toBe(expected.length);

  expected.forEach((value, index) => {
    expect(actual[index]).toBeCloseTo(value, digits);
  });
};

const collectBuffers = (value: unknown, found: Set<ArrayBufferLike>): void => {
  if (ArrayBuffer.isView(value)) {
    found.add(value.buffer);

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectBuffers(item, found);
    });

    return;
  }

  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach((item) => {
      collectBuffers(item, found);
    });
  }
};

const collectViews = (value: unknown, found: ArrayBufferView[]): void => {
  if (ArrayBuffer.isView(value)) {
    found.push(value);

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectViews(item, found);
    });

    return;
  }

  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach((item) => {
      collectViews(item, found);
    });
  }
};

caseTest('world.noise.stream-values', 'seeded stream and noise match the prototype', () => {
  const random = createRng(1907);

  NOISE_REFERENCE.rng.forEach((value) => {
    expect(random()).toBeCloseTo(value, 12);
  });

  NOISE_REFERENCE.primary.forEach(({ at, value }) => {
    expect(noisePrimary(at[0], at[1])).toBeCloseTo(value, 12);
  });

  NOISE_REFERENCE.ridge.forEach(({ at, value }) => {
    expect(noiseRidge(at[0], at[1])).toBeCloseTo(value, 12);
  });

  NOISE_REFERENCE.raw.forEach(({ at, value }) => {
    expect(rawHeight(at[0], at[1])).toBeCloseTo(value, 12);
  });
});

caseTest('world.height.checksum', 'weighted checksum is 798532', () => {
  const { heights } = terrainFixture();
  let sum = 0;

  heights.forEach((height, index) => {
    sum += height * ((index % 97) + 1);
  });

  expect(sum % 1000003).toBe(798532);
});

caseTest('world.height.range', 'minimum 2 and maximum 40', () => {
  const { heights } = terrainFixture();

  expect(Math.min(...heights)).toBe(2);
  expect(Math.max(...heights)).toBe(40);
});

caseTest('world.height.sea-cells', '3517 cells at or below sea level', () => {
  const { heights } = terrainFixture();

  expect(
    heights.filter((height) => {
      return height <= 7;
    }).length,
  ).toBe(3517);
});

caseTest('world.height.sample-cells', 'corner is 2 and centre is 10', () => {
  const { heights } = terrainFixture();

  expect(heights[0]).toBe(2);
  expect(heights[64 * 128 + 64]).toBe(10);
});

caseTest('world.height.lookup', 'floors, indexes ix * 128 + iz, one outside', () => {
  const heights = Int16Array.from({ length: MAP * MAP }, (_, index) => {
    return (index % 1000) + 2;
  });

  const terrain = createTerrain(heights);

  expect(terrain.heightAt(-64, -64)).toBe(heights[0]);
  expect(terrain.heightAt(-63.2, -62.7)).toBe(heights[1]);
  expect(terrain.heightAt(-62.9, -64)).toBe(heights[128]);
  expect(terrain.heightAt(5.99, -3.01)).toBe(heights[(5 + 64) * 128 + (-4 + 64)]);
  expect(terrain.heightAt(63.99, 63.99)).toBe(heights[127 * 128 + 127]);
  expect(terrain.heightAt(64, 0)).toBe(1);
  expect(terrain.heightAt(0, 64)).toBe(1);
  expect(terrain.heightAt(-64.01, 0)).toBe(1);
  expect(terrain.heightAt(0, -64.01)).toBe(1);
});

caseTest('world.station.bases', 'bases are 14,13,13,24,9,13,9,10,9', () => {
  const { bases } = terrainFixture();

  expect([...bases]).toEqual([14, 13, 13, 24, 9, 13, 9, 10, 9]);
});

caseTest('world.station.tops', 'tops are px + 0.5, base + 1, pz + 0.5', () => {
  const { stationTops } = realData();

  expect(stationTops.length).toBe(27);

  STATIONS.forEach((station, index) => {
    expect(stationTops[index * 3]).toBe(station[0] + 0.5);
    expect(stationTops[index * 3 + 1]).toBe(stationBase(index) + 1);
    expect(stationTops[index * 3 + 2]).toBe(station[1] + 0.5);
  });
});

caseTest('world.station.flat-core', 'columns within 5.5 equal the base', () => {
  const { heights } = terrainFixture();
  let checked = 0;

  STATIONS.forEach((station, index) => {
    for (let ix = 0; ix < MAP; ix++) {
      for (let iz = 0; iz < MAP; iz++) {
        if (centreDistance(ix, iz, station) <= 5.5) {
          expect(heights[ix * MAP + iz]).toBe(stationBase(index));
          checked++;
        }
      }
    }
  });

  expect(checked).toBeGreaterThan(9 * 80);
});

caseTest('world.station.plate', 'plate colours on columns within 4.2 only', () => {
  const { heights, occupancy, materials } = terrainFixture();
  let plates = 0;

  for (let ix = 0; ix < MAP; ix++) {
    for (let iz = 0; iz < MAP; iz++) {
      const top = heights[ix * MAP + iz] ?? 0;
      const entry = entryAt(materials.entries, occupancy.cells, ix, top, iz);
      const isPlate = sameColor(entry.top, PROTOTYPE_COLORS.plate);

      expect(isPlate).toBe(nearestDistance(ix, iz) < 4.2);

      if (isPlate) {
        expectColor(entry.side, PROTOTYPE_COLORS.plateSide);

        expect(
          sameColor(
            entryAt(materials.entries, occupancy.cells, ix, top - 1, iz).top,
            PROTOTYPE_COLORS.plate,
          ),
        ).toBe(false);

        plates++;
      }
    }
  }

  expect(plates).toBeGreaterThan(9 * 40);
});

caseTest('world.blocks.classes', 'every terrain cell has its prototype class colours', () => {
  const { heights, occupancy, materials } = terrainFixture();

  for (let ix = 0; ix < MAP; ix++) {
    for (let iz = 0; iz < MAP; iz++) {
      const top = heights[ix * MAP + iz] ?? 0;
      const plate = nearestDistance(ix, iz) < 4.2;

      expect(occupancy.cells[cellIndex(ix, top + 1, iz)]).toBe(0);

      for (let y = 1; y <= top; y++) {
        const entry = entryAt(materials.entries, occupancy.cells, ix, y, iz);
        const [expectedTop, expectedSide] = expectedCellColors(y, top - y, plate);

        if (!sameColor(entry.top, expectedTop) || !sameColor(entry.side, expectedSide)) {
          throw new Error(`class colours differ at ${ix},${y},${iz}`);
        }
      }
    }
  }
});

caseTest('world.blocks.depth-shade', 'side is darkened 0.1 per depth up to 4', () => {
  const { heights, occupancy, materials } = terrainFixture();
  let column: readonly [number, number] | undefined;

  for (let ix = 0; ix < MAP && column === undefined; ix++) {
    for (let iz = 0; iz < MAP; iz++) {
      const top = heights[ix * MAP + iz] ?? 0;

      if (top >= 16 && top <= 21 && nearestDistance(ix, iz) >= 4.2) {
        column = [ix, iz];
        break;
      }
    }
  }

  if (column === undefined) {
    throw new Error('no dirt column found');
  }

  const [ix, iz] = column;
  const top = heights[ix * MAP + iz] ?? 0;

  [
    [1, 0.9],
    [2, 0.8],
    [3, 0.7],
    [4, 0.6],
    [5, 0.6],
    [6, 0.6],
  ].forEach(([depth, factor]) => {
    const entry = entryAt(materials.entries, occupancy.cells, ix, top - (depth ?? 0), iz);

    expectColor(entry.top, PROTOTYPE_COLORS.dirt);
    expectColor(entry.side, scaled(PROTOTYPE_COLORS.dirt, factor ?? 1));
  });
});

caseTest('world.blocks.linear-colors', 'palette equals three linear colours', () => {
  const pairs: readonly (readonly [keyof typeof PALETTE, string])[] = [
    ['grass', '#58a043'],
    ['dirt', '#7a5232'],
    ['sand', '#d9c487'],
    ['sandSide', '#c4ae72'],
    ['stone', '#7f848c'],
    ['stoneDark', '#5d626b'],
    ['snow', '#f1f5f9'],
    ['snowSide', '#c4cbd4'],
    ['plate', '#a6a9b0'],
    ['plateSide', '#6c7079'],
    ['trunk', '#6b4a2b'],
    ['trunkTop', '#9a7a4f'],
    ['leaf', '#2f7a3a'],
    ['leafDark', '#25602e'],
  ];

  expect(pairs.length).toBe(Object.keys(PALETTE).length);

  pairs.forEach(([name, hex]) => {
    expectColor(PALETTE[name], linearOf(hex));
  });
});

caseTest('world.trees.count', '160 trees, 643 trunk cells, index sum, 40 lanterns', () => {
  const { trees, materials, occupancy, treeGlowCount } = fullFixture();

  const trunkId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.trunkTop,
    PROTOTYPE_COLORS.trunk,
  );

  let trunkCells = 0;

  occupancy.cells.forEach((id) => {
    if (id === trunkId) {
      trunkCells++;
    }
  });

  expect(trees.length).toBe(TREES_REFERENCE.trees);
  expect(trunkCells).toBe(TREES_REFERENCE.trunkBlocks);

  expect(
    trees.reduce((sum, tree) => {
      return sum + tree.ix * MAP + tree.iz;
    }, 0),
  ).toBe(TREES_REFERENCE.positionSum);

  expect(treeGlowCount).toBe(TREES_REFERENCE.lanterns);
});

caseTest('world.trees.rules', 'clearance 9, top in (9, 21), height 3 to 5', () => {
  const { trees, heights } = fullFixture();

  expect(trees.length).toBeGreaterThan(0);

  for (const tree of trees) {
    expect(nearestDistance(tree.ix, tree.iz)).toBeGreaterThan(9);
    expect(tree.top).toBe(heights[tree.ix * MAP + tree.iz]);
    expect(tree.top).toBeGreaterThan(9);
    expect(tree.top).toBeLessThan(21);
    expect(tree.height).toBeGreaterThanOrEqual(3);
    expect(tree.height).toBeLessThanOrEqual(5);
  }
});

caseTest('world.trees.cells', 'trunk fills the column, leaves stay in the diamond', () => {
  const { trees, materials, occupancy } = fullFixture();

  const trunkId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.trunkTop,
    PROTOTYPE_COLORS.trunk,
  );

  const leafId = findMaterial(materials.entries, PROTOTYPE_COLORS.leaf, PROTOTYPE_COLORS.leaf);

  const darkId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.leafDark,
    PROTOTYPE_COLORS.leafDark,
  );

  for (const tree of trees) {
    for (let y = 1; y <= tree.height; y++) {
      expect([trunkId, leafId, darkId]).toContain(
        occupancy.cells[cellIndex(tree.ix, tree.top + y, tree.iz)],
      );
    }

    expect(occupancy.cells[cellIndex(tree.ix, tree.top + 1, tree.iz)]).toBe(trunkId);
  }

  let leaves = 0;

  for (let ix = 0; ix < MAP; ix++) {
    for (let iz = 0; iz < MAP; iz++) {
      for (let y = 1; y < 64; y++) {
        const id = occupancy.cells[cellIndex(ix, y, iz)];

        if (id !== leafId && id !== darkId) {
          continue;
        }

        leaves++;

        const belongs = trees.some((tree) => {
          const dx = ix - tree.ix;
          const dz = iz - tree.iz;
          const dy = y - tree.top;
          const reach = Math.abs(dx) + Math.abs(dz) + Math.max(0, dy - tree.height) * 2;

          return (
            Math.abs(dx) <= 2 &&
            Math.abs(dz) <= 2 &&
            dy >= tree.height - 1 &&
            dy <= tree.height + 1 &&
            reach <= 3
          );
        });

        if (!belongs) {
          throw new Error(`stray leaf at ${ix},${y},${iz}`);
        }
      }
    }
  }

  expect(leaves).toBeGreaterThan(3000);
});

caseTest('world.struct.posts', 'four 3-block plate posts and glows per station', () => {
  const { glow, materials } = fullFixture();

  const plateId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.plate,
    PROTOTYPE_COLORS.plateSide,
  );

  STATIONS.forEach((station, index) => {
    const y0 = stationBase(index) + 1;

    for (const [dx, dz] of [
      [-3, -3],
      [3, -3],
      [-3, 3],
      [3, 3],
    ] as const) {
      for (let y = 0; y < 3; y++) {
        expect(worldCell(station[0] + dx, y0 + y, station[1] + dz)).toBe(plateId);
      }

      expect(worldCell(station[0] + dx, y0 + 3, station[1] + dz)).toBe(0);
    }
  });

  const entries = glow.scales.length;
  const posts: number[] = [];
  const centres: number[] = [];

  for (let i = 0; i < entries; i++) {
    const red = glow.colors[i * 3] ?? 0;

    if (Math.abs(red - 2.2) < 1e-6) {
      posts.push(i);
    }

    if (Math.abs(red - 3.0) < 1e-6) {
      centres.push(i);
    }
  }

  expect(posts.length).toBe(36);
  expect(centres.length).toBe(9);

  centres.forEach((entry, index) => {
    const station = stationOf(index);

    expect(glow.positions[entry * 3]).toBeCloseTo(station[0] + 0.5, 6);
    expect(glow.positions[entry * 3 + 1]).toBeCloseTo(stationBase(index) + 1.5, 6);
    expect(glow.positions[entry * 3 + 2]).toBeCloseTo(station[1] + 0.5, 6);
    expect(glow.scales[entry]).toBeCloseTo(1, 6);
    expect(glow.colors[entry * 3 + 1]).toBeCloseTo(1.6, 6);
    expect(glow.colors[entry * 3 + 2]).toBeCloseTo(0.2, 6);
  });

  posts.forEach((entry) => {
    expect(glow.scales[entry]).toBeCloseTo(0.55, 6);
    expect(glow.colors[entry * 3 + 1]).toBeCloseTo(1.55, 6);
    expect(glow.colors[entry * 3 + 2]).toBeCloseTo(0.6, 6);
  });
});

caseTest('world.struct.systems', 'four 7-block stone pillars and cyan glows', () => {
  const { glow, materials } = fullFixture();

  const stoneId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.stone,
    PROTOTYPE_COLORS.stoneDark,
  );

  const station = stationOf(5);
  const y0 = stationBase(5) + 1;

  for (const [dx, dz] of [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ] as const) {
    for (let y = 0; y < 7; y++) {
      expect(worldCell(station[0] + dx, y0 + y, station[1] + dz)).toBe(stoneId);
    }

    expect(worldCell(station[0] + dx, y0 + 7, station[1] + dz)).toBe(0);

    const found = Array.from({ length: glow.scales.length }, (_, entry) => {
      return entry;
    }).filter((entry) => {
      return (
        Math.abs((glow.positions[entry * 3] ?? 0) - (station[0] + dx + 0.5)) < 1e-6 &&
        Math.abs((glow.positions[entry * 3 + 1] ?? 0) - (y0 + 7.5)) < 1e-6 &&
        Math.abs((glow.positions[entry * 3 + 2] ?? 0) - (station[1] + dz + 0.5)) < 1e-6
      );
    });

    expect(found.length).toBe(1);

    const entry = found[0] ?? 0;

    expect(glow.colors[entry * 3]).toBeCloseTo(0.6, 6);
    expect(glow.colors[entry * 3 + 1]).toBeCloseTo(1.6, 6);
    expect(glow.colors[entry * 3 + 2]).toBeCloseTo(2.4, 6);
    expect(glow.scales[entry]).toBeCloseTo(0.6, 6);
  }
});

caseTest('world.struct.this-world', 'seven sculpture blocks, six glows', () => {
  const { glow, materials } = fullFixture();

  const plateId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.plate,
    PROTOTYPE_COLORS.plateSide,
  );

  const station = stationOf(7);
  const y0 = stationBase(7) + 1;

  [
    [0, 5, 0],
    [1, 5, 0],
    [0, 6, 0],
    [0, 5, 1],
    [-1, 7, -1],
    [1, 7, 1],
    [-1, 6, 1],
  ].forEach(([dx, dy, dz]) => {
    expect(worldCell(station[0] + (dx ?? 0), y0 + (dy ?? 0), station[1] + (dz ?? 0))).toBe(plateId);
  });

  const cyan: number[] = [];

  for (let i = 0; i < glow.scales.length; i++) {
    if (Math.abs((glow.colors[i * 3] ?? 0) - 0.5) < 1e-6) {
      cyan.push(i);
    }
  }

  expect(cyan.length).toBe(6);

  const positions = cyan
    .map((entry) => {
      return [
        (glow.positions[entry * 3] ?? 0) - 0.5 - station[0],
        (glow.positions[entry * 3 + 1] ?? 0) - 0.5 - y0,
        (glow.positions[entry * 3 + 2] ?? 0) - 0.5 - station[1],
      ].join(',');
    })
    .sort();

  expect(positions).toEqual(['2,5,0', '0,8,0', '0,5,2', '-2,7,-1', '2,7,2', '-1,4,0'].sort());

  cyan.forEach((entry) => {
    expect(glow.colors[entry * 3 + 1]).toBeCloseTo(2.2, 6);
    expect(glow.colors[entry * 3 + 2]).toBeCloseTo(2.6, 6);
    expect(glow.scales[entry]).toBeCloseTo(0.6, 6);
  });
});

caseTest('world.struct.antenna', '16-cell antenna with plate bands, mast point', () => {
  const { materials } = fullFixture();

  const stoneDarkId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.stoneDark,
    PROTOTYPE_COLORS.stoneDark,
  );

  const plateBandId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.plate,
    PROTOTYPE_COLORS.plate,
  );

  const station = stationOf(8);
  const y0 = stationBase(8) + 1;

  for (let y = 0; y < 16; y++) {
    expect(worldCell(station[0] + 2, y0 + y, station[1] - 2)).toBe(
      y % 4 === 3 ? plateBandId : stoneDarkId,
    );
  }

  expect(worldCell(station[0] + 2, y0 + 16, station[1] - 2)).toBe(0);

  const { mast } = realData();

  expect([...mast]).toEqual([station[0] + 2.5, stationBase(8) + 17.5, station[1] - 1.5]);
});

caseTest('world.struct.ai-nodes', 'four nodes with stone pillars up to them', () => {
  const { materials } = fullFixture();

  const stoneId = findMaterial(
    materials.entries,
    PROTOTYPE_COLORS.stone,
    PROTOTYPE_COLORS.stoneDark,
  );

  const { aiNodes } = realData();
  const station = stationOf(4);
  const baseTop = stationBase(4) + 1;

  expect(aiNodes.length).toBe(12);

  [-6, -2, 2, 6].forEach((dx, index) => {
    expect(aiNodes[index * 3]).toBe(station[0] + 0.5 + dx);
    expect(aiNodes[index * 3 + 1]).toBe(baseTop + 7);
    expect(aiNodes[index * 3 + 2]).toBe(station[1] + 0.5 - 3);

    const x = Math.floor(station[0] + 0.5 + dx);
    const z = Math.floor(station[1] + 0.5 - 3);

    for (let y = baseTop; y < baseTop + 7; y++) {
      expect(worldCell(x, y, z)).toBe(stoneId);
    }

    expect(worldCell(x, baseTop + 7, z)).toBe(0);
  });
});

caseTest('world.struct.glow-total', '95 glow cubes with the prototype scales', () => {
  const { glow } = realData();
  const scales = new Map<string, number>();

  for (let i = 0; i < glow.scales.length; i++) {
    const key = (glow.scales[i] ?? 0).toFixed(2);

    scales.set(key, (scales.get(key) ?? 0) + 1);
  }

  expect(glow.scales.length).toBe(95);
  expect(glow.positions.length).toBe(95 * 3);
  expect(glow.colors.length).toBe(95 * 3);
  expect(scales.get('1.00')).toBe(9);
  expect(scales.get('0.55')).toBe(36);
  expect(scales.get('0.60')).toBe(10);
  expect(scales.get('0.40')).toBe(40);
});

caseTest('world.mesh.single-block', 'ground block 5 faces, floating block 6', () => {
  expect(faceCount(meshCells([[10, 1, 10]]))).toBe(5);
  expect(faceCount(meshCells([[10, 2, 10]]))).toBe(6);

  expect(
    faceCount(
      meshCells([
        [10, 1, 10],
        [10, 3, 10],
      ]),
    ),
  ).toBe(11);
});

caseTest('world.mesh.map-edge', 'edge blocks emit the outward face', () => {
  for (const cell of [
    [0, 1, 50],
    [127, 1, 50],
    [50, 1, 0],
    [50, 1, 127],
    [0, 1, 0],
  ] as const) {
    expect(faceCount(meshCells([cell]))).toBe(5);
  }

  expect(
    faceCount(
      meshCells([
        [49, 1, 127],
        [50, 1, 0],
      ]),
    ),
  ).toBe(10);
});

caseTest('world.mesh.stair', 'two-step stair has 12 faces', () => {
  expect(
    faceCount(
      meshCells([
        [20, 1, 20],
        [21, 1, 20],
        [21, 2, 20],
      ]),
    ),
  ).toBe(12);
});

caseTest('world.mesh.chunk-border', 'shared face across chunks counted by neither', () => {
  const chunks = meshCells([
    [31, 1, 10],
    [32, 1, 10],
  ]);

  expect(chunks.length).toBe(2);

  expect(
    chunks.map((chunk) => {
      return chunk.indices.length / 6;
    }),
  ).toEqual([4, 4]);
});

caseTest('world.mesh.naive-count', 'real map matches an independent neighbour count', () => {
  const { occupancy, materials } = fullFixture();
  const { cells } = occupancy;
  let naive = 0;

  const solid = (ix: number, y: number, iz: number): boolean => {
    if (y < 1) {
      return true;
    }

    if (y > 63 || ix < 0 || ix > 127 || iz < 0 || iz > 127) {
      return false;
    }

    return (cells[(ix * 128 + iz) * 64 + y] ?? 0) > 0;
  };

  for (let ix = 0; ix < 128; ix++) {
    for (let iz = 0; iz < 128; iz++) {
      for (let y = 1; y < 64; y++) {
        if (!solid(ix, y, iz)) {
          continue;
        }

        for (const [dx, dy, dz] of [
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
          [0, 0, 1],
          [0, 0, -1],
        ] as const) {
          if (!solid(ix + dx, y + dy, iz + dz)) {
            naive++;
          }
        }
      }
    }
  }

  const chunks = meshOccupancy(occupancy, materials, () => {});

  expect(naive).toBeGreaterThan(40000);
  expect(faceCount(chunks)).toBe(naive);
});

caseTest('world.mesh.chunk-limits', 'at most 16 chunks inside 16-bit indices', () => {
  const { chunks } = realData();

  expect(chunks.length).toBeLessThanOrEqual(16);
  expect(chunks.length).toBeGreaterThan(0);

  for (const chunk of chunks) {
    const vertices = chunk.positions.length / 3;

    expect(chunk.indices.length).toBeGreaterThan(0);
    expect(vertices).toBeLessThan(65536);
    expect(Math.max(...chunk.indices)).toBeLessThan(vertices);
    expect(chunk.normals.length).toBe(vertices * 3);
    expect(chunk.colors.length).toBe(vertices * 3);
    expect(chunk.uvs.length).toBe(vertices * 2);
  }
});

caseTest('world.mesh.geometry', 'counter-clockwise winding, unit normals, 0/255 uvs', () => {
  const { chunks } = realData();

  for (const chunk of chunks) {
    const { positions, normals, uvs, indices } = chunk;

    for (let i = 0; i < indices.length; i += 3) {
      const a = (indices[i] ?? 0) * 3;
      const b = (indices[i + 1] ?? 0) * 3;
      const c = (indices[i + 2] ?? 0) * 3;

      const e1 = [
        (positions[b] ?? 0) - (positions[a] ?? 0),
        (positions[b + 1] ?? 0) - (positions[a + 1] ?? 0),
        (positions[b + 2] ?? 0) - (positions[a + 2] ?? 0),
      ] as const;

      const e2 = [
        (positions[c] ?? 0) - (positions[a] ?? 0),
        (positions[c + 1] ?? 0) - (positions[a + 1] ?? 0),
        (positions[c + 2] ?? 0) - (positions[a + 2] ?? 0),
      ] as const;

      const cross = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ] as const;

      const dot =
        cross[0] * (normals[a] ?? 0) +
        cross[1] * (normals[a + 1] ?? 0) +
        cross[2] * (normals[a + 2] ?? 0);

      if (dot <= 0) {
        throw new Error('triangle winds clockwise around its normal');
      }
    }

    for (let v = 0; v < positions.length; v++) {
      if (!Number.isInteger(positions[v])) {
        throw new Error('non-integer corner');
      }
    }

    for (let v = 0; v < normals.length; v += 3) {
      const axes = [normals[v] ?? 0, normals[v + 1] ?? 0, normals[v + 2] ?? 0].map((value) => {
        return Math.abs(value);
      });

      if (
        axes.filter((value) => {
          return value === 127;
        }).length !== 1 ||
        axes.filter((value) => {
          return value === 0;
        }).length !== 2
      ) {
        throw new Error('normal is not a unit axis at 127');
      }
    }

    for (let v = 0; v < uvs.length; v++) {
      if (uvs[v] !== 0 && uvs[v] !== 255) {
        throw new Error('uv is not 0 or 255');
      }
    }
  }
});

caseTest('world.mesh.cell-position', 'cell spans x-64, y-1, z-64 by one', () => {
  const [chunk] = meshCells([[10, 5, 20]]);

  if (chunk === undefined) {
    throw new Error('no chunk');
  }

  const xs = new Set<number>();
  const ys = new Set<number>();
  const zs = new Set<number>();

  for (let v = 0; v < chunk.positions.length; v += 3) {
    xs.add(chunk.positions[v] ?? NaN);
    ys.add(chunk.positions[v + 1] ?? NaN);
    zs.add(chunk.positions[v + 2] ?? NaN);
  }

  expect(
    [...xs].sort((a, b) => {
      return a - b;
    }),
  ).toEqual([-54, -53]);

  expect(
    [...ys].sort((a, b) => {
      return a - b;
    }),
  ).toEqual([4, 5]);

  expect(
    [...zs].sort((a, b) => {
      return a - b;
    }),
  ).toEqual([-44, -43]);
});

caseTest('world.mesh.face-colors', 'shade 1 / 0.55 / 0.86 / 1 as bytes', () => {
  const [chunk] = meshCells([[10, 2, 10]]);

  if (chunk === undefined) {
    throw new Error('no chunk');
  }

  const expected = new Map<string, readonly number[]>([
    ['0,127,0', [204, 102, 51]],
    ['0,-127,0', [70, 35, 18]],
    ['127,0,0', [110, 55, 27]],
    ['-127,0,0', [110, 55, 27]],
    ['0,0,127', [128, 64, 32]],
    ['0,0,-127', [128, 64, 32]],
  ]);

  const seen = new Set<string>();

  for (let v = 0; v < chunk.normals.length / 3; v++) {
    const key = [chunk.normals[v * 3], chunk.normals[v * 3 + 1], chunk.normals[v * 3 + 2]].join(
      ',',
    );

    expect([chunk.colors[v * 3], chunk.colors[v * 3 + 1], chunk.colors[v * 3 + 2]]).toEqual(
      expected.get(key),
    );

    seen.add(key);
  }

  expect(seen.size).toBe(6);
});

caseTest('world.scatter.stars', '1600 stars on the sky sphere from the prototype', () => {
  const { stars } = realData();

  expect(stars.length).toBe(1600 * 3);
  approxList(stars.slice(0, 3), STARS_REFERENCE.first, 3);
  approxList(stars.slice(3, 6), STARS_REFERENCE.second, 3);
  approxList(stars.slice(-3), STARS_REFERENCE.last, 3);

  for (let i = 0; i < 1600; i++) {
    const length = Math.hypot(stars[i * 3] ?? 0, stars[i * 3 + 1] ?? 0, stars[i * 3 + 2] ?? 0);

    expect(length).toBeCloseTo(520, 1);
    expect(stars[i * 3 + 1]).toBeGreaterThanOrEqual(0.08 * 520 - 0.01);
  }
});

caseTest('world.scatter.clouds', '590 cloud cells from the prototype', () => {
  const { clouds } = realData();
  const heights = new Set<number>();

  for (let i = 0; i < clouds.length; i += 3) {
    heights.add(clouds[i + 1] ?? NaN);
  }

  expect(clouds.length / 3).toBe(CLOUDS_REFERENCE.count);
  expect([...clouds.slice(0, 9)]).toEqual(CLOUDS_REFERENCE.first);
  expect([...clouds.slice(-3)]).toEqual(CLOUDS_REFERENCE.last);

  expect(
    [...heights].sort((a, b) => {
      return a - b;
    }),
  ).toEqual(CLOUDS_REFERENCE.heights);
});

caseTest('world.scatter.burst', '220 burst directions from the prototype', () => {
  const { burst } = realData();

  expect(burst.length).toBe(220 * 3);
  approxList(burst.slice(0, 3), BURST_REFERENCE.first, 5);
  approxList(burst.slice(3, 6), BURST_REFERENCE.second, 5);
  approxList(burst.slice(-3), BURST_REFERENCE.last, 5);

  for (let i = 0; i < 220; i++) {
    expect(burst[i * 3 + 1]).toBeGreaterThanOrEqual(0.4);
    expect(burst[i * 3 + 1]).toBeLessThan(1.8);
  }
});

caseTest('world.scatter.fireflies', '520 fireflies from the prototype', () => {
  const { fireflies } = realData();
  const terrain = createTerrain(terrainFixture().heights);

  expect(fireflies.positions.length).toBe(520 * 3);
  expect(fireflies.seeds.length).toBe(520);
  approxList(fireflies.positions.slice(0, 3), FIREFLIES_REFERENCE.first, 4);
  approxList(fireflies.positions.slice(3, 6), FIREFLIES_REFERENCE.second, 4);
  approxList(fireflies.positions.slice(-3), FIREFLIES_REFERENCE.last, 4);
  approxList(fireflies.seeds.slice(0, 2), FIREFLIES_REFERENCE.seeds, 6);
  expect(fireflies.seeds[519]).toBeCloseTo(FIREFLIES_REFERENCE.lastSeed, 6);

  for (let i = 0; i < 520; i++) {
    const x = fireflies.positions[i * 3] ?? 0;
    const y = fireflies.positions[i * 3 + 1] ?? 0;
    const z = fireflies.positions[i * 3 + 2] ?? 0;
    const ground = terrain.heightAt(x, z);

    expect(Math.abs(x)).toBeLessThanOrEqual(58);
    expect(Math.abs(z)).toBeLessThanOrEqual(58);
    expect(y).toBeGreaterThanOrEqual(ground + 1);
    expect(y).toBeLessThan(ground + 5);
  }
});

caseTest('world.letters.cells', '192 letter cells for the sky name', () => {
  const { letters } = realData();

  expect(letters.targets.length).toBe(LETTERS_REFERENCE.count * 3);
  expect(letters.starts.length).toBe(LETTERS_REFERENCE.count * 3);
  expect(letters.delays.length).toBe(LETTERS_REFERENCE.count);
  approxList(letters.targets.slice(0, 2), LETTERS_REFERENCE.firstTarget, 5);
  approxList(letters.targets.slice(-3), [...LETTERS_REFERENCE.lastTarget, 0], 5);
  approxList(letters.starts.slice(0, 3), LETTERS_REFERENCE.firstStart, 4);
  expect(letters.delays[0]).toBeCloseTo(LETTERS_REFERENCE.firstDelay, 6);
  expect(letters.delays[191]).toBeCloseTo(LETTERS_REFERENCE.lastDelay, 6);

  for (let i = 0; i < LETTERS_REFERENCE.count; i++) {
    expect(letters.targets[i * 3 + 2]).toBe(0);
    expect(letters.delays[i]).toBeLessThan(0.55);
  }
});

caseTest('world.letters.unknown-glyph', 'character without a glyph is rejected', () => {
  expect(() => {
    return generateWorld({ skyName: ['VITALIX'] }, () => {});
  }).toThrow();

  expect(worldRequestSchema.safeParse({ skyName: ['VITALIX'] }).success).toBe(false);
});

caseTest('world.minimap.bands', 'every pixel has its band colour and shade', () => {
  const { minimap, heights } = realData();

  expect(minimap.length).toBe(MAP * MAP * 4);

  for (let x = 0; x < MAP; x++) {
    for (let z = 0; z < MAP; z++) {
      const height = heights[x * MAP + z] ?? 0;

      const color =
        height <= 7
          ? [40, 86, 140]
          : height <= 8
            ? [200, 184, 130]
            : height < 20
              ? [70, 128, 60]
              : height < 28
                ? [120, 124, 130]
                : [235, 240, 245];

      const shade = 0.7 + 0.3 * Math.min(1, Math.max(0, (height - 7) / 30));

      const expected = Uint8ClampedArray.from([
        (color[0] ?? 0) * shade,
        (color[1] ?? 0) * shade,
        (color[2] ?? 0) * shade,
        255,
      ]);

      const offset = (z * MAP + x) * 4;

      expect([...minimap.slice(offset, offset + 4)]).toEqual([...expected]);
    }
  }
});

caseTest('world.texture.pixels', 'opaque grey pixels with darkened last row and column', () => {
  const { pixelTexture } = realData();

  expect(pixelTexture.length).toBe(16 * 16 * 4);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const offset = (y * 16 + x) * 4;
      const base = TEXTURE_BODY_VALUES[y * 16 + x] ?? 0;
      const edges = (x === 15 ? 1 : 0) + (y === 15 ? 1 : 0);
      const expected = Math.round(base * 0.78 ** edges);

      expect(pixelTexture[offset + 3]).toBe(255);
      expect(pixelTexture[offset]).toBe(pixelTexture[offset + 1]);
      expect(pixelTexture[offset]).toBe(pixelTexture[offset + 2]);
      expect(Math.abs((pixelTexture[offset] ?? 0) - expected)).toBeLessThanOrEqual(1);

      if (edges === 0) {
        expect(pixelTexture[offset]).toBe(TEXTURE_BODY_VALUES[y * 16 + x]);
      }
    }
  }
});

caseTest('world.gen.deterministic', 'two generations are byte-equal', () => {
  const first = realData();
  const second = generateWorld({ skyName: SKY_NAME }, () => {});
  const left: ArrayBufferView[] = [];
  const right: ArrayBufferView[] = [];

  collectViews({ ...first, generationMs: 0 }, left);
  collectViews({ ...second, generationMs: 0 }, right);

  expect(left.length).toBe(right.length);
  expect(left.length).toBeGreaterThan(30);

  left.forEach((view, index) => {
    const other = right[index];

    if (other === undefined) {
      throw new Error('missing view');
    }

    const a = Buffer.from(view.buffer, view.byteOffset, view.byteLength);
    const b = Buffer.from(other.buffer, other.byteOffset, other.byteLength);

    expect(a.equals(b)).toBe(true);
  });
});

caseTest('world.gen.progress', 'monotonic, within 0 to 1, ends at 1 once', () => {
  const values: number[] = [];

  generateWorld({ skyName: SKY_NAME }, (value) => {
    values.push(value);
  });

  expect(values.length).toBeGreaterThan(10);

  values.forEach((value, index) => {
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);

    if (index > 0) {
      expect(value).toBeGreaterThanOrEqual(values[index - 1] ?? 0);
    }
  });

  expect(values.at(-1)).toBe(1);

  expect(
    values.filter((value) => {
      return value === 1;
    }).length,
  ).toBe(1);

  expect(
    values.some((value) => {
      return value > 0 && value < 0.4;
    }),
  ).toBe(true);

  expect(
    values.some((value) => {
      return value > 0.4 && value < 0.95;
    }),
  ).toBe(true);

  expect(values).toContain(0.4);

  expect(
    values.some((value) => {
      return Math.abs(value - 0.95) < 1e-9;
    }),
  ).toBe(true);
});

caseTest('world.gen.transferables', 'each backing buffer once', () => {
  const data = realData();
  const buffers = new Set<ArrayBufferLike>();
  const views: ArrayBufferView[] = [];

  collectBuffers(data, buffers);
  collectViews(data, views);

  const transfer = worldTransferables(data);

  expect(new Set(transfer).size).toBe(transfer.length);
  expect(transfer.length).toBe(buffers.size);
  expect(buffers.size).toBe(views.length);

  expect([...buffers]).toEqual(expect.arrayContaining(transfer));
});

caseTest('world.gen.shape', 'array types and lengths follow WorldData', () => {
  const data = realData();

  expect(data.heights).toBeInstanceOf(Int16Array);
  expect(data.heights.length).toBe(MAP * MAP);
  expect(data.stationTops).toBeInstanceOf(Float32Array);
  expect(data.stationTops.length).toBe(27);
  expect(data.clouds).toBeInstanceOf(Float32Array);
  expect(data.stars).toBeInstanceOf(Float32Array);
  expect(data.burst).toBeInstanceOf(Float32Array);
  expect(data.aiNodes.length).toBe(12);
  expect(data.mast.length).toBe(3);
  expect(data.pixelTexture).toBeInstanceOf(Uint8Array);
  expect(data.minimap).toBeInstanceOf(Uint8ClampedArray);
  expect(data.glow.positions).toBeInstanceOf(Float32Array);
  expect(data.glow.colors).toBeInstanceOf(Float32Array);
  expect(data.glow.scales).toBeInstanceOf(Float32Array);
  expect(data.fireflies.positions).toBeInstanceOf(Float32Array);
  expect(data.fireflies.seeds).toBeInstanceOf(Float32Array);
  expect(data.letters.targets).toBeInstanceOf(Float32Array);
  expect(data.letters.starts).toBeInstanceOf(Float32Array);
  expect(data.letters.delays).toBeInstanceOf(Float32Array);
  expect(Number.isFinite(data.generationMs)).toBe(true);
  expect(data.generationMs).toBeGreaterThanOrEqual(0);

  for (const chunk of data.chunks) {
    expect(chunk.positions).toBeInstanceOf(Float32Array);
    expect(chunk.normals).toBeInstanceOf(Int8Array);
    expect(chunk.uvs).toBeInstanceOf(Uint8Array);
    expect(chunk.colors).toBeInstanceOf(Uint8Array);
    expect(chunk.indices).toBeInstanceOf(Uint16Array);
  }
});

caseTest('world.request.schema', 'name lines accepted, malformed rejected', () => {
  expect(worldRequestSchema.safeParse({ skyName: ['VITALII', 'VORYNKA'] }).success).toBe(true);
  expect(worldRequestSchema.safeParse({ skyName: ['VITALII'] }).success).toBe(true);
  expect(worldRequestSchema.safeParse({ skyName: [] }).success).toBe(false);
  expect(worldRequestSchema.safeParse({ skyName: ['vitalii'] }).success).toBe(false);
  expect(worldRequestSchema.safeParse({ skyName: ['', 'A'] }).success).toBe(false);
  expect(worldRequestSchema.safeParse({ skyName: ['A', 'A', 'A', 'A'] }).success).toBe(false);
  expect(worldRequestSchema.safeParse({ skyName: 'VITALII' }).success).toBe(false);
  expect(worldRequestSchema.safeParse({}).success).toBe(false);
  expect(worldRequestSchema.safeParse(null).success).toBe(false);
});
