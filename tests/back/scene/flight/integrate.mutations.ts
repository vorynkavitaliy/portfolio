import type { IntegrateCaseId } from '@tests/back/scene/flight/integrate.cases';

export type IntegrateMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly IntegrateCaseId[];
}>;

const INTEGRATE = 'src/scene/flight/integrate.ts';
const CONSTANTS = 'src/scene/flight/flight.constants.ts';

export const INTEGRATE_MUTATIONS: readonly IntegrateMutation[] = [
  {
    id: 'speed.response',
    file: CONSTANTS,
    find: 'SPEED_RESPONSE = 1.5',
    replace: 'SPEED_RESPONSE = 2',
    caseIds: ['integrate.speed.ease', 'integrate.free.one-second'],
  },
  {
    id: 'turn.rate',
    file: CONSTANTS,
    find: 'TURN_RATE = 1.15',
    replace: 'TURN_RATE = 1.3',
    caseIds: ['integrate.free.one-second', 'integrate.edge.held-turn'],
  },
  {
    id: 'pitch.gain',
    file: CONSTANTS,
    find: 'PITCH_GAIN = 0.5',
    replace: 'PITCH_GAIN = 0.6',
    caseIds: ['integrate.free.one-second', 'integrate.ceiling.soft'],
  },
  {
    id: 'roll.sign',
    file: INTEGRATE,
    find: 'plane.roll += (-plane.turn * ROLL_GAIN - plane.roll)',
    replace: 'plane.roll += (plane.turn * ROLL_GAIN - plane.roll)',
    caseIds: ['integrate.free.one-second'],
  },
  {
    id: 'floor.clearance',
    file: CONSTANTS,
    find: 'FLOOR_CLEARANCE = 2.5',
    replace: 'FLOOR_CLEARANCE = 2',
    caseIds: ['integrate.floor.clamp'],
  },
  {
    id: 'floor.ignores-sea',
    file: INTEGRATE,
    find: 'Math.max(terrain.heightAt(pos.x, pos.z), terrain.seaLevel) + FLOOR_CLEARANCE',
    replace: 'terrain.heightAt(pos.x, pos.z) + FLOOR_CLEARANCE',
    caseIds: ['integrate.floor.clamp'],
  },
  {
    id: 'floor.clamp-dropped',
    file: INTEGRATE,
    find: '  if (pos.y < floor) {\n    pos.y = floor;\n  }',
    replace: '',
    caseIds: ['integrate.floor.clamp'],
  },
  {
    id: 'climb-assist.no-lookahead',
    file: CONSTANTS,
    find: 'GROUND_LOOKAHEAD = 6',
    replace: 'GROUND_LOOKAHEAD = 0',
    caseIds: ['integrate.floor.climb-assist'],
  },
  {
    id: 'climb-assist.dropped',
    file: INTEGRATE,
    find: 'climb = Math.max(climb, clamp01((need + CLIMB_ASSIST_OFFSET) / CLIMB_ASSIST_RANGE));',
    replace: 'climb = climb + 0;',
    caseIds: ['integrate.floor.climb-assist'],
  },
  {
    id: 'ground.recovery-dropped',
    file: INTEGRATE,
    find: 'pos.y += (ground - pos.y) * response(dt, GROUND_RECOVERY);',
    replace: 'pos.y += 0;',
    caseIds: ['integrate.floor.climb-assist'],
  },
  {
    id: 'ceiling.raised',
    file: CONSTANTS,
    find: 'CEILING = 80;',
    replace: 'CEILING = 81;',
    caseIds: ['integrate.ceiling.clamp'],
  },
  {
    id: 'ceiling.soft-dropped',
    file: INTEGRATE,
    find: 'climb = Math.min(climb, -clamp01((pos.y - CEILING_SOFT) / CEILING_SOFT_RANGE));',
    replace: 'climb = climb + 0;',
    caseIds: ['integrate.ceiling.soft'],
  },
  {
    id: 'ceiling.soft-start',
    file: CONSTANTS,
    find: 'CEILING_SOFT = 72;',
    replace: 'CEILING_SOFT = 74;',
    caseIds: ['integrate.ceiling.soft'],
  },
  {
    id: 'ceiling.clamp-dropped',
    file: INTEGRATE,
    find: '  if (pos.y > CEILING) {\n    pos.y = CEILING;\n  }',
    replace: '',
    caseIds: ['integrate.ceiling.clamp'],
  },
  {
    id: 'edge.margin',
    file: CONSTANTS,
    find: 'EDGE_MARGIN = 18',
    replace: 'EDGE_MARGIN = 28',
    caseIds: [
      'integrate.edge.threshold',
      'integrate.edge.firmer',
      'integrate.edge.return',
      'integrate.edge.held-turn',
    ],
  },
  {
    id: 'edge.rate-cap',
    file: CONSTANTS,
    find: 'EDGE_RATE_MAX = 2.4',
    replace: 'EDGE_RATE_MAX = 4',
    caseIds: ['integrate.edge.firmer'],
  },
  {
    id: 'edge.rate-gain',
    file: CONSTANTS,
    find: 'EDGE_RATE_GAIN = 0.08',
    replace: 'EDGE_RATE_GAIN = 0.04',
    caseIds: ['integrate.edge.threshold', 'integrate.edge.firmer', 'integrate.edge.return'],
  },
  {
    id: 'edge.dropped',
    file: INTEGRATE,
    find: '  edgeReturn(plane, terrain.half, dt);\n',
    replace: '',
    caseIds: [
      'integrate.edge.threshold',
      'integrate.edge.firmer',
      'integrate.edge.return',
      'integrate.edge.held-turn',
    ],
  },
  {
    id: 'reset.no-placement',
    file: INTEGRATE,
    find: '  placeOnOrbit(plane, stations[HOME_STATION] ?? ORIGIN, ORBIT_START_ANGLE);\n',
    replace: '',
    caseIds: ['integrate.reset.invalid'],
  },
  {
    id: 'reset.never',
    file: INTEGRATE,
    find: '  if (isPlaneValid(plane)) {',
    replace: '  if (true) {',
    caseIds: ['integrate.reset.invalid'],
  },
  {
    id: 'dt.uncapped',
    file: INTEGRATE,
    find: 'Math.min(MAX_DT, Math.max(0, dt))',
    replace: 'Math.max(0, dt)',
    caseIds: ['integrate.dt.guard'],
  },
  {
    id: 'dt.nan-passes',
    file: INTEGRATE,
    find: 'return Number.isFinite(dt) ? Math.min(MAX_DT, Math.max(0, dt)) : 0;',
    replace: 'return Math.min(MAX_DT, Math.max(0, dt));',
    caseIds: ['integrate.dt.guard'],
  },
  {
    id: 'docked.uses-control',
    file: INTEGRATE,
    find: "  if (mode.kind === 'docked' && station !== undefined) {",
    replace: "  if (mode.kind === 'docked' && station !== undefined && control.speed === 0) {",
    caseIds: ['integrate.docked.ignores-control'],
  },
  {
    id: 'dock.response',
    file: CONSTANTS,
    find: 'DOCK_RESPONSE = 1.3',
    replace: 'DOCK_RESPONSE = 1.6',
    caseIds: ['integrate.docked.hover'],
  },
  {
    id: 'dock.yaw-response',
    file: CONSTANTS,
    find: 'DOCK_YAW_RESPONSE = 2.2',
    replace: 'DOCK_YAW_RESPONSE = 2',
    caseIds: ['integrate.docked.hover'],
  },
  {
    id: 'dock.roll-gain',
    file: CONSTANTS,
    find: 'DOCK_ROLL_GAIN = 6',
    replace: 'DOCK_ROLL_GAIN = 5',
    caseIds: ['integrate.docked.hover'],
  },
  {
    id: 'dock.speed-kept',
    file: INTEGRATE,
    find: '  plane.speed += (0 - plane.speed) * kd;\n',
    replace: '',
    caseIds: ['integrate.docked.hover'],
  },
];
