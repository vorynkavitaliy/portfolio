import { GLOW_COLORS, PALETTE } from '@/scene/world/palette';
import {
  setCell,
  setCellIfEmpty,
  type MaterialTable,
  type Occupancy,
} from '@/scene/world/occupancy';
import { nearestStation } from '@/scene/world/stations';
import {
  MAP_HALF,
  MAP_SIZE,
  RNG_SEEDS,
  TREE_CHANCE,
  TREE_HEIGHT_MIN,
  TREE_HEIGHT_SPREAD,
  TREE_LANTERN_CHANCE,
  TREE_LEAF_DARK,
  TREE_LEAF_KEEP,
  TREE_LEAF_RADIUS,
  TREE_STATION_CLEARANCE,
  TREE_TOP_MAX,
  TREE_TOP_MIN,
} from '@/scene/world/world.constants';
import { createRng } from '@/scene/world/rng';

import type { GlowCollector } from '@/scene/world/glow';

export type Tree = Readonly<{ ix: number; iz: number; top: number; height: number }>;

export const placeTrees = (
  occupancy: Occupancy,
  heights: Int16Array,
  materials: MaterialTable,
  glow: GlowCollector,
): readonly Tree[] => {
  const random = createRng(RNG_SEEDS.trees);
  const trunkId = materials.register(PALETTE.trunkTop, PALETTE.trunk);
  const leafId = materials.register(PALETTE.leaf, PALETTE.leaf);
  const leafDarkId = materials.register(PALETTE.leafDark, PALETTE.leafDark);
  const trees: Tree[] = [];

  for (let ix = 0; ix < MAP_SIZE; ix++) {
    for (let iz = 0; iz < MAP_SIZE; iz++) {
      const top = heights[ix * MAP_SIZE + iz] ?? 0;
      const station = nearestStation(ix - MAP_HALF + 0.5, iz - MAP_HALF + 0.5);

      const eligible =
        station.distance > TREE_STATION_CLEARANCE && top > TREE_TOP_MIN && top < TREE_TOP_MAX;

      if (!eligible || random() >= TREE_CHANCE) {
        continue;
      }

      const height = TREE_HEIGHT_MIN + Math.floor(random() * TREE_HEIGHT_SPREAD);

      for (let y = 1; y <= height; y++) {
        setCell(occupancy, ix, top + y, iz, trunkId);
      }

      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          for (let dy = height - 1; dy <= height + 1; dy++) {
            const reach = Math.abs(dx) + Math.abs(dz) + Math.max(0, dy - height) * 2;
            const hollow = dx === 0 && dz === 0 && dy < height;

            if (reach <= TREE_LEAF_RADIUS && !hollow && random() > TREE_LEAF_KEEP) {
              const id = random() < TREE_LEAF_DARK ? leafDarkId : leafId;

              setCellIfEmpty(occupancy, ix + dx, top + dy, iz + dz, id);
            }
          }
        }
      }

      if (random() < TREE_LANTERN_CHANCE) {
        glow.add(ix - MAP_HALF + 1, top + height - 1, iz - MAP_HALF, GLOW_COLORS.lantern, 0.4);
      }

      trees.push({ ix, iz, top, height });
    }
  }

  return trees;
};
