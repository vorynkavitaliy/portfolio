import type { PlaneCaseId } from '@tests/back/scene/flight/plane.cases';

export type PlaneMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly PlaneCaseId[];
}>;

const PLANE = 'src/scene/flight/plane.ts';
const CONSTANTS = 'src/scene/flight/flight.constants.ts';

export const PLANE_MUTATIONS: readonly PlaneMutation[] = [
  {
    id: 'orbit.speed',
    file: CONSTANTS,
    find: 'ORBIT_ANGULAR_SPEED = 0.3',
    replace: 'ORBIT_ANGULAR_SPEED = 0.35',
    caseIds: ['plane.create', 'plane.orbit-pose', 'plane.orbit-pose.resets-attitude'],
  },
  {
    id: 'orbit.height',
    file: CONSTANTS,
    find: 'ORBIT_HEIGHT = 10',
    replace: 'ORBIT_HEIGHT = 12',
    caseIds: ['plane.orbit-pose'],
  },
  {
    id: 'orbit.yaw',
    file: PLANE,
    find: 'Math.atan2(Math.cos(theta), -Math.sin(theta))',
    replace: 'Math.atan2(Math.cos(theta), Math.sin(theta))',
    caseIds: ['plane.orbit-pose'],
  },
  {
    id: 'orbit.roll-kept',
    file: PLANE,
    find: '  plane.roll = 0;\n',
    replace: '',
    caseIds: ['plane.orbit-pose.resets-attitude'],
  },
  {
    id: 'orbit.turn-kept',
    file: PLANE,
    find: '  plane.turn = 0;\n',
    replace: '',
    caseIds: ['plane.orbit-pose.resets-attitude'],
  },
  {
    id: 'valid.ignores-turn',
    file: PLANE,
    find: ' + plane.speed + plane.turn,',
    replace: ' + plane.speed,',
    caseIds: ['plane.valid'],
  },
  {
    id: 'valid.nan-only',
    file: PLANE,
    find: 'return Number.isFinite(',
    replace: 'return !Number.isNaN(',
    caseIds: ['plane.valid'],
  },
];
