import type { MinimapCaseId } from '@tests/back/scene/nav/minimap.cases';

export type MinimapMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly MinimapCaseId[];
}>;

const MAP = 'src/scene/nav/minimap.ts';

export const MINIMAP_MUTATIONS: readonly MinimapMutation[] = [
  {
    id: 'pick.radius-wider',
    file: MAP,
    find: 'MAP_PICK_RADIUS = 14',
    replace: 'MAP_PICK_RADIUS = 15',
    caseIds: ['minimap.pick.radius'],
  },
  {
    id: 'pick.radius-narrower',
    file: MAP,
    find: 'MAP_PICK_RADIUS = 14',
    replace: 'MAP_PICK_RADIUS = 13',
    caseIds: ['minimap.pick.radius'],
  },
  {
    id: 'pick.radius-inclusive',
    file: MAP,
    find: 'if (distance < bestDistance) {',
    replace: 'if (distance <= bestDistance) {',
    caseIds: ['minimap.pick.radius', 'minimap.pick.tie'],
  },
  {
    id: 'pick.first-in-range',
    file: MAP,
    find: 'if (distance < bestDistance) {',
    replace: 'if (best === null && distance < bestDistance) {',
    caseIds: ['minimap.pick.nearest'],
  },
  {
    id: 'pick.best-distance-stale',
    file: MAP,
    find: '      bestDistance = distance;\n',
    replace: '',
    caseIds: ['minimap.pick.nearest', 'minimap.pick.tie'],
  },
  {
    id: 'pick.axes-swapped',
    file: MAP,
    find: 'const x = u * MAP_SIZE - MAP_HALF;',
    replace: 'const x = v * MAP_SIZE - MAP_HALF;',
    caseIds: ['minimap.pick.exact', 'minimap.pick.axes'],
  },
  {
    id: 'pick.z-from-u',
    file: MAP,
    find: 'const z = v * MAP_SIZE - MAP_HALF;',
    replace: 'const z = u * MAP_SIZE - MAP_HALF;',
    caseIds: ['minimap.pick.exact', 'minimap.pick.axes'],
  },
  {
    id: 'pick.origin-dropped',
    file: MAP,
    find: 'const x = u * MAP_SIZE - MAP_HALF;',
    replace: 'const x = u * MAP_SIZE;',
    caseIds: ['minimap.pick.exact', 'minimap.pick.radius'],
  },
  {
    id: 'pick.always-null',
    file: MAP,
    find: '  return best;\n};',
    replace: '  return best === null ? null : null;\n};',
    caseIds: ['minimap.pick.exact'],
  },
  {
    id: 'pick.default-zero',
    file: MAP,
    find: 'let best: number | null = null;',
    replace: 'let best: number | null = 0;',
    caseIds: ['minimap.pick.none'],
  },
];
