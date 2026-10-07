import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/flight/steer.case-test';
import { createSteer, FLIGHT_KEY_CODES, steerFrom } from '@/scene/flight/steer';

import type { StickState } from '@/scene/flight/flight.types';

const RADIUS = 56;
const HALF_DEFLECTION = (0.5 - 0.12) / 0.88;
const IDLE: StickState = { active: false, dx: 0, dy: 0 };

const keys = (...codes: string[]): ReadonlySet<string> => {
  return new Set(codes);
};

const stick = (dx: number, dy: number): StickState => {
  return { active: true, dx, dy };
};

caseTest('steer.keys.climb', 'W and ↑ climb, S and ↓ descend', () => {
  for (const code of ['KeyW', 'ArrowUp']) {
    expect(steerFrom(keys(code), IDLE, false)).toMatchObject({ climb: 1, turn: 0 });
  }

  for (const code of ['KeyS', 'ArrowDown']) {
    expect(steerFrom(keys(code), IDLE, false)).toMatchObject({ climb: -1, turn: 0 });
  }
});

caseTest('steer.keys.turn', 'A and ← turn left, D and → turn right', () => {
  for (const code of ['KeyA', 'ArrowLeft']) {
    expect(steerFrom(keys(code), IDLE, false)).toMatchObject({ turn: 1, climb: 0 });
  }

  for (const code of ['KeyD', 'ArrowRight']) {
    expect(steerFrom(keys(code), IDLE, false)).toMatchObject({ turn: -1, climb: 0 });
  }
});

caseTest('steer.keys.opposite-cancel', 'opposite keys cancel', () => {
  expect(steerFrom(keys('KeyW', 'KeyS', 'KeyA', 'KeyD'), IDLE, false)).toMatchObject({
    turn: 0,
    climb: 0,
    magnitude: 0,
  });
});

caseTest('steer.keys.flight-codes', 'the flight key set', () => {
  expect([...FLIGHT_KEY_CODES].sort()).toEqual(
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].sort(),
  );
});

caseTest('steer.stick.dead-zone', 'deflection inside the dead zone is ignored', () => {
  expect(steerFrom(keys(), stick(0.11 * RADIUS, -0.11 * RADIUS), false)).toMatchObject({
    turn: 0,
    climb: 0,
    magnitude: 0,
  });
});

caseTest('steer.stick.half', 'half deflection maps past the dead zone', () => {
  const steer = steerFrom(keys(), stick(0.5 * RADIUS, 0.5 * RADIUS), false);

  expect(steer.turn).toBe(-HALF_DEFLECTION);
  expect(steer.turn).toBe(-0.4318181818181818);
  expect(steer.climb).toBe(-HALF_DEFLECTION);
});

caseTest('steer.stick.saturates', 'full deflection reaches 1', () => {
  expect(steerFrom(keys(), stick(-1.5 * RADIUS, -1.5 * RADIUS), false)).toMatchObject({
    turn: 1,
    climb: 1,
  });
});

caseTest('steer.stick.inactive', 'a released stick does not steer', () => {
  expect(steerFrom(keys(), { active: false, dx: RADIUS, dy: RADIUS }, false)).toMatchObject({
    turn: 0,
    climb: 0,
  });
});

caseTest('steer.keys.override-stick-per-axis', 'keys win on their axis only', () => {
  const steer = steerFrom(keys('KeyW'), stick(0.5 * RADIUS, 0.5 * RADIUS), false);

  expect(steer.turn).toBe(-HALF_DEFLECTION);
  expect(steer.climb).toBe(1);
});

caseTest('steer.boost.shift', 'either Shift boosts', () => {
  expect(steerFrom(keys('ShiftLeft'), IDLE, false).boost).toBe(true);
  expect(steerFrom(keys('ShiftRight'), IDLE, false).boost).toBe(true);
  expect(steerFrom(keys('KeyW'), IDLE, false).boost).toBe(false);
});

caseTest('steer.boost.touch', 'the touch Boost button boosts', () => {
  expect(steerFrom(keys(), IDLE, true).boost).toBe(true);
});

caseTest('steer.magnitude', 'magnitude is the length of the steer vector', () => {
  expect(steerFrom(keys('KeyW', 'KeyA'), IDLE, false).magnitude).toBe(Math.SQRT2);
  expect(steerFrom(keys(), stick(0.5 * RADIUS, 0), false).magnitude).toBe(HALF_DEFLECTION);
});

caseTest('steer.non-finite', 'a NaN stick value does not steer', () => {
  expect(steerFrom(keys(), stick(Number.NaN, Number.NaN), false)).toMatchObject({
    turn: 0,
    climb: 0,
    magnitude: 0,
  });
});

caseTest('steer.no-allocation', 'the out object is reused', () => {
  const out = createSteer();

  expect(steerFrom(keys('KeyA'), IDLE, false, out)).toBe(out);
  expect(out.turn).toBe(1);
});
