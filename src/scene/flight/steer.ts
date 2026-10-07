import { STEER_DEAD_ZONE, STICK_RADIUS } from '@/scene/flight/flight.constants';

import type { Steer, SteerTarget, StickState } from '@/scene/flight/flight.types';

export const FLIGHT_KEY_CODES: ReadonlySet<string> = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

const deadZone = (value: number): number => {
  const size = Math.abs(value);

  if (size < STEER_DEAD_ZONE) {
    return 0;
  }

  return Math.sign(value) * Math.min(1, (size - STEER_DEAD_ZONE) / (1 - STEER_DEAD_ZONE));
};

const keyAxis = (
  keys: ReadonlySet<string>,
  positive: string,
  positiveArrow: string,
  negative: string,
  negativeArrow: string,
): number => {
  const up = keys.has(positive) || keys.has(positiveArrow) ? 1 : 0;
  const down = keys.has(negative) || keys.has(negativeArrow) ? 1 : 0;

  return up - down;
};

const finiteOrZero = (value: number): number => {
  return Number.isFinite(value) ? value : 0;
};

export const createSteer = (): SteerTarget => {
  return { turn: 0, climb: 0, magnitude: 0, boost: false };
};

export const steerFrom = (
  keys: ReadonlySet<string>,
  stick: StickState,
  boostHeld: boolean,
  out: SteerTarget = createSteer(),
): Steer => {
  let turn = 0;
  let climb = 0;

  if (stick.active) {
    turn = 0 - deadZone(stick.dx / STICK_RADIUS);
    climb = 0 - deadZone(stick.dy / STICK_RADIUS);
  }

  const keyTurn = keyAxis(keys, 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight');
  const keyClimb = keyAxis(keys, 'KeyW', 'ArrowUp', 'KeyS', 'ArrowDown');

  if (keyTurn !== 0) {
    turn = keyTurn;
  }

  if (keyClimb !== 0) {
    climb = keyClimb;
  }

  out.turn = finiteOrZero(turn);
  out.climb = finiteOrZero(climb);
  out.magnitude = Math.hypot(out.turn, out.climb);
  out.boost = keys.has('ShiftLeft') || keys.has('ShiftRight') || boostHeld;

  return out;
};
