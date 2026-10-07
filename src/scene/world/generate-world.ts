import { fillTerrain } from '@/scene/world/blocks';
import { createGlowCollector } from '@/scene/world/glow';
import { createTerrain, generateHeights } from '@/scene/world/heightmap';
import { generateLetters } from '@/scene/world/letters';
import { meshOccupancy } from '@/scene/world/mesher';
import { drawMinimapImage } from '@/scene/world/minimap-image';
import { createMaterialTable, createOccupancy } from '@/scene/world/occupancy';
import { generatePixelTexture } from '@/scene/world/pixel-texture';
import {
  generateBurst,
  generateClouds,
  generateFireflies,
  generateStars,
} from '@/scene/world/scatter';
import { computeStationBases, computeStationTops } from '@/scene/world/stations';
import {
  computeAiNodes,
  computeMast,
  placeAiPillars,
  placeStructures,
} from '@/scene/world/structures';
import { placeTrees } from '@/scene/world/trees';
import { MAP_SIZE, PROGRESS } from '@/scene/world/world.constants';

import type { WorldData, WorldRequest } from '@/scene/world/world.types';

const HEIGHT_REPORT_EVERY = 16;

export const generateWorld = (
  request: WorldRequest,
  onProgress: (value: number) => void,
): WorldData => {
  const startedAt = performance.now();
  const bases = computeStationBases();
  const stationTops = computeStationTops(bases);

  const heights = generateHeights(bases, (ix) => {
    if (ix % HEIGHT_REPORT_EVERY === 0) {
      onProgress((ix / MAP_SIZE) * PROGRESS.heights);
    }
  });

  onProgress(PROGRESS.heights);

  const terrain = createTerrain(heights);
  const materials = createMaterialTable();
  const occupancy = createOccupancy();
  const glow = createGlowCollector();
  const aiNodes = computeAiNodes(stationTops);

  fillTerrain(occupancy, heights, materials);
  placeTrees(occupancy, heights, materials, glow);
  placeStructures(occupancy, materials, bases, glow);
  placeAiPillars(occupancy, materials, aiNodes, stationTops);

  const chunks = meshOccupancy(occupancy, materials, (done, total) => {
    onProgress(PROGRESS.heights + (done / total) * (PROGRESS.chunks - PROGRESS.heights));
  });

  const data: WorldData = {
    heights,
    stationTops,
    chunks,
    glow: glow.build(),
    clouds: generateClouds(),
    stars: generateStars(),
    burst: generateBurst(),
    aiNodes,
    mast: computeMast(bases),
    fireflies: generateFireflies(terrain),
    letters: generateLetters(request.skyName),
    pixelTexture: generatePixelTexture(),
    minimap: drawMinimapImage(heights),
    generationMs: performance.now() - startedAt,
  };

  onProgress(PROGRESS.done);

  return data;
};

export const worldTransferables = (data: WorldData): Transferable[] => {
  const arrays: readonly ArrayBufferView[] = [
    data.heights,
    data.stationTops,
    data.glow.positions,
    data.glow.colors,
    data.glow.scales,
    data.clouds,
    data.stars,
    data.burst,
    data.aiNodes,
    data.mast,
    data.fireflies.positions,
    data.fireflies.seeds,
    data.letters.targets,
    data.letters.starts,
    data.letters.delays,
    data.pixelTexture,
    data.minimap,
    ...data.chunks.flatMap((chunk) => {
      return [chunk.positions, chunk.normals, chunk.uvs, chunk.colors, chunk.indices];
    }),
  ];

  const buffers = new Set<ArrayBuffer>();

  for (const view of arrays) {
    if (view.buffer instanceof ArrayBuffer) {
      buffers.add(view.buffer);
    }
  }

  return [...buffers];
};
