import type { MinimapDrawCaseId } from '@tests/front/ui/scene/minimap-draw.cases';

export type MinimapDrawMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly MinimapDrawCaseId[];
}>;

const MAP = 'src/scene/nav/minimap.ts';

export const MINIMAP_DRAW_MUTATIONS: readonly MinimapDrawMutation[] = [
  {
    id: 'draw.canvas-width',
    file: MAP,
    find: 'canvas.width = frame.size;',
    replace: '',
    caseIds: ['minimap.draw.image'],
  },
  {
    id: 'draw.canvas-height',
    file: MAP,
    find: 'canvas.height = frame.size;',
    replace: '',
    caseIds: ['minimap.draw.image'],
  },
  {
    id: 'draw.image-dropped',
    file: MAP,
    find: '  context.putImageData(imageFor(canvas, frame), 0, 0);\n',
    replace: '',
    caseIds: ['minimap.draw.image'],
  },
  {
    id: 'draw.pixels-dropped',
    file: MAP,
    find: '  image.data.set(frame.image);\n',
    replace: '',
    caseIds: ['minimap.draw.image'],
  },
  {
    id: 'draw.cache-stale',
    file: MAP,
    find: 'image.width !== frame.size',
    replace: 'false',
    caseIds: ['minimap.draw.image'],
  },
  {
    id: 'stations.colours-swapped',
    file: MAP,
    find: 'station.lit ? COLOR_VISITED : COLOR_PENDING',
    replace: 'station.lit ? COLOR_PENDING : COLOR_VISITED',
    caseIds: ['minimap.draw.stations'],
  },
  {
    id: 'stations.marker-size',
    file: MAP,
    find: 'MARKER_HALF = 3',
    replace: 'MARKER_HALF = 4',
    caseIds: ['minimap.draw.stations'],
  },
  {
    id: 'stations.core-size',
    file: MAP,
    find: 'CORE_HALF = 1',
    replace: 'CORE_HALF = 0',
    caseIds: ['minimap.draw.stations'],
  },
  {
    id: 'stations.scale',
    file: MAP,
    find: 'const marker = MARKER_HALF * scale;',
    replace: 'const marker = MARKER_HALF;',
    caseIds: ['minimap.draw.stations'],
  },
  {
    id: 'stations.position',
    file: MAP,
    find: 'return ((world + MAP_HALF) / MAP_SIZE) * size;',
    replace: 'return (world / MAP_SIZE) * size;',
    caseIds: ['minimap.draw.stations', 'minimap.draw.plane'],
  },
  {
    id: 'plane.yaw-axes',
    file: MAP,
    find: 'const dx = Math.sin(plane.yaw);',
    replace: 'const dx = Math.cos(plane.yaw);',
    caseIds: ['minimap.draw.plane'],
  },
  {
    id: 'plane.nose-reversed',
    file: MAP,
    find: 'context.moveTo(x + dx * nose, z + dz * nose);',
    replace: 'context.moveTo(x - dx * nose, z - dz * nose);',
    caseIds: ['minimap.draw.plane'],
  },
  {
    id: 'plane.scale',
    file: MAP,
    find: 'const nose = PLANE_NOSE * scale;',
    replace: 'const nose = PLANE_NOSE;',
    caseIds: ['minimap.draw.plane'],
  },
  {
    id: 'plane.null-guard',
    file: MAP,
    find: 'plane !== null && ',
    replace: '',
    caseIds: ['minimap.draw.no-plane'],
  },
];
