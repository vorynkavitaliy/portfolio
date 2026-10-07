import { expect } from 'vitest';

import { planeAt } from '@tests/back/scene/flight/integrate.fixtures';
import { caseTest } from '@tests/back/scene/flight/plane.case-test';
import { createPlane, isPlaneValid, placeOnOrbit } from '@/scene/flight/plane';

import type { PlaneState } from '@/scene/flight/flight.types';

const HOME_TOP = { x: -45.5, y: 11, z: 40.5 };

caseTest('plane.create', 'a new plane', () => {
  expect(createPlane()).toEqual({
    pos: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    speed: 3.9,
    turn: 0,
  });
});

caseTest('plane.orbit-pose', 'the Home orbit pose', () => {
  const plane = createPlane();

  placeOnOrbit(plane, HOME_TOP, 0.75 * Math.PI);

  expect(plane).toEqual({
    pos: { x: -36.30761184457488, y: 21, z: 31.307611844574883 },
    yaw: -2.356194490192345,
    pitch: 0,
    roll: 0,
    speed: 3.9,
    turn: 0,
  });
});

caseTest('plane.orbit-pose.resets-attitude', 'placing levels the plane', () => {
  const plane = planeAt(5, 50, 5, { pitch: 0.4, roll: -0.7, turn: 0.9, speed: 26, yaw: 1 });

  placeOnOrbit(plane, HOME_TOP, 0.75 * Math.PI);

  expect(plane).toMatchObject({ pitch: 0, roll: 0, turn: 0, speed: 3.9 });
});

caseTest('plane.valid', 'finite check over every field', () => {
  expect(isPlaneValid(planeAt(1, 2, 3))).toBe(true);

  const corrupt: readonly ((plane: PlaneState, value: number) => void)[] = [
    (plane, value) => {
      plane.pos.x = value;
    },
    (plane, value) => {
      plane.pos.y = value;
    },
    (plane, value) => {
      plane.pos.z = value;
    },
    (plane, value) => {
      plane.yaw = value;
    },
    (plane, value) => {
      plane.pitch = value;
    },
    (plane, value) => {
      plane.roll = value;
    },
    (plane, value) => {
      plane.speed = value;
    },
    (plane, value) => {
      plane.turn = value;
    },
  ];

  for (const set of corrupt) {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const plane = planeAt(1, 2, 3);

      set(plane, value);
      expect(isPlaneValid(plane)).toBe(false);
    }
  }
});
