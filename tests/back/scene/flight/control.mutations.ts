import type { ControlCaseId } from '@tests/back/scene/flight/control.cases';

export type ControlMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly ControlCaseId[];
}>;

const CONTROL = 'src/scene/flight/control.ts';
const CONSTANTS = 'src/scene/flight/flight.constants.ts';

export const CONTROL_MUTATIONS: readonly ControlMutation[] = [
  {
    id: 'cruise.speed',
    file: CONSTANTS,
    find: 'CRUISE_SPEED = 13',
    replace: 'CRUISE_SPEED = 12',
    caseIds: ['control.free.cruise', 'control.autopilot.clearance', 'control.autopilot.heading'],
  },
  {
    id: 'boost.speed',
    file: CONSTANTS,
    find: 'BOOST_SPEED = 26',
    replace: 'BOOST_SPEED = 24',
    caseIds: ['control.free.boost', 'control.autopilot.boost'],
  },
  {
    id: 'orbit.bias',
    file: CONSTANTS,
    find: 'ORBIT_TURN_BIAS = 0.26',
    replace: 'ORBIT_TURN_BIAS = 0.2',
    caseIds: ['control.orbit.side-plus', 'control.orbit.centre-guard', 'control.intro.orbits-home'],
  },
  {
    id: 'orbit.side-ignored',
    file: CONTROL,
    find: 'Math.atan2(orbitSide * Math.cos(theta), -orbitSide * Math.sin(theta))',
    replace: 'Math.atan2(Math.cos(theta), -Math.sin(theta))',
    caseIds: ['control.orbit.side-minus'],
  },
  {
    id: 'orbit.radius-gain',
    file: CONSTANTS,
    find: 'ORBIT_RADIUS_GAIN = 0.1',
    replace: 'ORBIT_RADIUS_GAIN = 0.2',
    caseIds: ['control.orbit.side-plus'],
  },
  {
    id: 'orbit.climb-range',
    file: CONSTANTS,
    find: 'ORBIT_CLIMB_RANGE = 6',
    replace: 'ORBIT_CLIMB_RANGE = 5',
    caseIds: ['control.orbit.side-plus', 'control.orbit.side-minus'],
  },
  {
    id: 'orbit.centre-guard-dropped',
    file: CONTROL,
    find: '    rx = ORBIT_MIN_RADIUS;\n',
    replace: '',
    caseIds: ['control.orbit.centre-guard', 'control.intro.orbits-home'],
  },
  {
    id: 'intro.free-control',
    file: CONTROL,
    find: "const index = mode.kind === 'docked' ? mode.station : HOME_STATION;",
    replace: "const index = mode.kind === 'docked' ? mode.station : 99;",
    caseIds: ['control.intro.orbits-home'],
  },
  {
    id: 'autopilot.far-lookahead',
    file: CONSTANTS,
    find: 'AUTOPILOT_LOOKAHEAD_FAR = 28',
    replace: 'AUTOPILOT_LOOKAHEAD_FAR = 18',
    caseIds: ['control.autopilot.clearance', 'control.autopilot.heading'],
  },
  {
    id: 'autopilot.clearance',
    file: CONSTANTS,
    find: 'AUTOPILOT_CLEARANCE = 9',
    replace: 'AUTOPILOT_CLEARANCE = 7',
    caseIds: ['control.autopilot.clearance', 'control.autopilot.heading'],
  },
  {
    id: 'autopilot.turn-gain',
    file: CONSTANTS,
    find: 'AUTOPILOT_TURN_GAIN = 2.2',
    replace: 'AUTOPILOT_TURN_GAIN = 2',
    caseIds: ['control.autopilot.heading', 'control.autopilot.near-slows'],
  },
  {
    id: 'autopilot.near-radius',
    file: CONSTANTS,
    find: 'AUTOPILOT_NEAR_RADIUS = 40',
    replace: 'AUTOPILOT_NEAR_RADIUS = 20',
    caseIds: ['control.autopilot.near-slows'],
  },
  {
    id: 'autopilot.boost-ignored',
    file: CONTROL,
    find: '  if (steer.boost) {\n    out.speed = BOOST_SPEED;\n  } else {',
    replace: '  if (false) {\n    out.speed = BOOST_SPEED;\n  } else {',
    caseIds: ['control.autopilot.boost'],
  },
  {
    id: 'autopilot.arrived-turns',
    file: CONTROL,
    find: 'const arrived = distance < AUTOPILOT_ARRIVED;',
    replace: 'const arrived = false;',
    caseIds: ['control.autopilot.arrived'],
  },
  {
    id: 'free.boost-ignored',
    file: CONTROL,
    find: 'out.speed = steer.boost ? BOOST_SPEED : CRUISE_SPEED;',
    replace: 'out.speed = CRUISE_SPEED;',
    caseIds: ['control.free.boost'],
  },
];
