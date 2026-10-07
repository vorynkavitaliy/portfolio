import type { SteerCaseId } from '@tests/back/scene/flight/steer.cases';

export type SteerMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly SteerCaseId[];
}>;

const STEER = 'src/scene/flight/steer.ts';
const CONSTANTS = 'src/scene/flight/flight.constants.ts';

export const STEER_MUTATIONS: readonly SteerMutation[] = [
  {
    id: 'dead-zone.smaller',
    file: CONSTANTS,
    find: 'STEER_DEAD_ZONE = 0.12',
    replace: 'STEER_DEAD_ZONE = 0.1',
    caseIds: ['steer.stick.dead-zone', 'steer.stick.half'],
  },
  {
    id: 'dead-zone.not-rescaled',
    file: STEER,
    find: '(size - STEER_DEAD_ZONE) / (1 - STEER_DEAD_ZONE)',
    replace: 'size',
    caseIds: ['steer.stick.half'],
  },
  {
    id: 'stick.unclamped',
    file: STEER,
    find: 'Math.min(1, (size',
    replace: 'Math.min(2, (size',
    caseIds: ['steer.stick.saturates'],
  },
  {
    id: 'stick.radius',
    file: CONSTANTS,
    find: 'STICK_RADIUS = 56',
    replace: 'STICK_RADIUS = 60',
    caseIds: ['steer.stick.half', 'steer.keys.override-stick-per-axis'],
  },
  {
    id: 'stick.ignores-active',
    file: STEER,
    find: 'if (stick.active) {',
    replace: 'if (true) {',
    caseIds: ['steer.stick.inactive'],
  },
  {
    id: 'stick.turn-sign',
    file: STEER,
    find: 'turn = 0 - deadZone(stick.dx / STICK_RADIUS);',
    replace: 'turn = deadZone(stick.dx / STICK_RADIUS);',
    caseIds: ['steer.stick.half', 'steer.stick.saturates', 'steer.keys.override-stick-per-axis'],
  },
  {
    id: 'keys.override-both-axes',
    file: STEER,
    find: 'if (keyTurn !== 0) {',
    replace: 'if (keyTurn !== 0 || keyClimb !== 0) {',
    caseIds: ['steer.keys.override-stick-per-axis'],
  },
  {
    id: 'keys.arrow-left-dropped',
    file: STEER,
    find: "keyAxis(keys, 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight')",
    replace: "keyAxis(keys, 'KeyA', 'KeyA', 'KeyD', 'ArrowRight')",
    caseIds: ['steer.keys.turn'],
  },
  {
    id: 'keys.climb-inverted',
    file: STEER,
    find: "keyAxis(keys, 'KeyW', 'ArrowUp', 'KeyS', 'ArrowDown')",
    replace: "keyAxis(keys, 'KeyS', 'ArrowDown', 'KeyW', 'ArrowUp')",
    caseIds: ['steer.keys.climb', 'steer.keys.override-stick-per-axis'],
  },
  {
    id: 'boost.touch-ignored',
    file: STEER,
    find: "keys.has('ShiftRight') || boostHeld",
    replace: "keys.has('ShiftRight')",
    caseIds: ['steer.boost.touch'],
  },
  {
    id: 'boost.right-shift-ignored',
    file: STEER,
    find: "keys.has('ShiftLeft') || keys.has('ShiftRight')",
    replace: "keys.has('ShiftLeft')",
    caseIds: ['steer.boost.shift'],
  },
  {
    id: 'magnitude.turn-only',
    file: STEER,
    find: 'Math.hypot(out.turn, out.climb)',
    replace: 'Math.abs(out.turn)',
    caseIds: ['steer.magnitude'],
  },
  {
    id: 'finite.guard-dropped',
    file: STEER,
    find: 'return Number.isFinite(value) ? value : 0;',
    replace: 'return value;',
    caseIds: ['steer.non-finite'],
  },
  {
    id: 'flight-keys.missing-arrow',
    file: STEER,
    find: "  'ArrowRight',\n]);",
    replace: ']);',
    caseIds: ['steer.keys.flight-codes'],
  },
  {
    id: 'keys.opposite-not-cancelled',
    file: STEER,
    find: 'return up - down;',
    replace: 'return up !== 0 ? up : -down;',
    caseIds: ['steer.keys.opposite-cancel'],
  },
  {
    id: 'out.ignored',
    file: STEER,
    find: '  return out;\n};',
    replace: '  return { ...out };\n};',
    caseIds: ['steer.no-allocation'],
  },
];
