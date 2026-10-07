import { fillTerrain } from '@/scene/world/blocks';
import { createGlowCollector } from '@/scene/world/glow';
import { generateHeights } from '@/scene/world/heightmap';
import { generateWorld } from '@/scene/world/generate-world';
import { createMaterialTable, createOccupancy } from '@/scene/world/occupancy';
import { computeStationBases, computeStationTops } from '@/scene/world/stations';
import { computeAiNodes, placeAiPillars, placeStructures } from '@/scene/world/structures';
import { placeTrees, type Tree } from '@/scene/world/trees';

import type { GlowSet } from '@/scene/world/glow';
import type { MaterialTable, Occupancy } from '@/scene/world/occupancy';
import type { WorldData } from '@/scene/world/world.types';

export const SKY_NAME: readonly string[] = ['VITALII', 'VORYNKA'];

export type TerrainFixture = Readonly<{
  heights: Int16Array;
  bases: readonly number[];
  occupancy: Occupancy;
  materials: MaterialTable;
}>;

export type FullFixture = TerrainFixture &
  Readonly<{ trees: readonly Tree[]; glow: GlowSet; treeGlowCount: number; aiNodes: Float32Array }>;

let terrainCache: TerrainFixture | undefined;
let fullCache: FullFixture | undefined;
let dataCache: WorldData | undefined;

export const terrainFixture = (): TerrainFixture => {
  if (terrainCache === undefined) {
    const bases = computeStationBases();
    const heights = generateHeights(bases, () => {});
    const occupancy = createOccupancy();
    const materials = createMaterialTable();

    fillTerrain(occupancy, heights, materials);
    terrainCache = { heights, bases, occupancy, materials };
  }

  return terrainCache;
};

export const fullFixture = (): FullFixture => {
  if (fullCache === undefined) {
    const bases = computeStationBases();
    const heights = generateHeights(bases, () => {});
    const occupancy = createOccupancy();
    const materials = createMaterialTable();
    const collector = createGlowCollector();
    const stationTops = computeStationTops(bases);
    const aiNodes = computeAiNodes(stationTops);

    fillTerrain(occupancy, heights, materials);

    const trees = placeTrees(occupancy, heights, materials, collector);
    const treeGlowCount = collector.build().scales.length;

    placeStructures(occupancy, materials, bases, collector);
    placeAiPillars(occupancy, materials, aiNodes, stationTops);

    fullCache = {
      heights,
      bases,
      occupancy,
      materials,
      trees,
      glow: collector.build(),
      treeGlowCount,
      aiNodes,
    };
  }

  return fullCache;
};

export const realData = (): WorldData => {
  if (dataCache === undefined) {
    dataCache = generateWorld({ skyName: SKY_NAME }, () => {});
  }

  return dataCache;
};
