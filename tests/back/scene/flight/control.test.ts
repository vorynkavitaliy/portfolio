import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/flight/control.case-test';
import {
  CLIFF,
  FLAT,
  planeAt,
  stationAt,
  STATIONS,
} from '@tests/back/scene/flight/integrate.fixtures';
import { controlFor, createControl } from '@/scene/flight/control';
import { placeOnOrbit } from '@/scene/flight/plane';

import type { FlightControl, FlightMode, PlaneState, Steer } from '@/scene/flight/flight.types';

const NO_STEER: Steer = { turn: 0, climb: 0, magnitude: 0, boost: false };
const FULL_STEER: Steer = { turn: -1, climb: -1, magnitude: Math.SQRT2, boost: true };
const DOCK = { x: 0, y: 0, z: 0 };

const orbitPose = (): PlaneState => {
  const plane = planeAt(0, 0, 0);

  placeOnOrbit(plane, stationAt(2), 1.0);
  plane.yaw += 0.1;
  plane.pos.y += 2;
  plane.pos.x += 1;

  return plane;
};

const control = (
  mode: FlightMode,
  side: 1 | -1,
  plane: PlaneState,
  steer: Steer,
  terrain = FLAT,
): FlightControl => {
  const out = createControl();

  controlFor(mode, side, plane, steer, terrain, STATIONS, out);

  return out;
};

caseTest('control.free.cruise', 'free flight follows the steer at cruise', () => {
  const steer: Steer = { turn: 0.4, climb: -0.7, magnitude: 0.8, boost: false };

  expect(control({ kind: 'free' }, 1, planeAt(0, 30, 0), steer)).toEqual({
    turn: 0.4,
    climb: -0.7,
    speed: 13,
  });
});

caseTest('control.free.boost', 'boost doubles the speed', () => {
  expect(control({ kind: 'free' }, 1, planeAt(0, 30, 0), FULL_STEER).speed).toBe(26);
});

caseTest('control.orbit.side-plus', 'orbit steering, positive side', () => {
  const mode: FlightMode = { kind: 'docked', station: 2, dock: DOCK };

  expect(control(mode, 1, orbitPose(), FULL_STEER)).toEqual({
    turn: 0.32054114983164217,
    climb: -1 / 3,
    speed: 3.9,
  });
});

caseTest('control.orbit.side-minus', 'orbit steering, negative side', () => {
  const mode: FlightMode = { kind: 'docked', station: 2, dock: DOCK };

  expect(control(mode, -1, orbitPose(), NO_STEER)).toEqual({
    turn: 1,
    climb: -1 / 3,
    speed: 3.9,
  });
});

caseTest('control.orbit.centre-guard', 'a plane over the beacon still steers', () => {
  const home = stationAt(0);
  const mode: FlightMode = { kind: 'docked', station: 0, dock: DOCK };

  expect(control(mode, 1, planeAt(home.x, 30, home.z, { yaw: 2 }), NO_STEER)).toEqual({
    turn: 0.6139816339744828,
    climb: -1,
    speed: 3.9,
  });
});

caseTest('control.intro.orbits-home', 'the intro circles Home base', () => {
  const home = stationAt(0);

  expect(
    control({ kind: 'intro' }, 1, planeAt(home.x, 30, home.z, { yaw: 2 }), FULL_STEER),
  ).toEqual({ turn: 0.6139816339744828, climb: -1, speed: 3.9 });
});

caseTest('control.autopilot.clearance', 'autopilot climbs for the cliff ahead', () => {
  const plane = planeAt(-20, 45, 6.5, { yaw: Math.PI / 2 });

  expect(control({ kind: 'autopilot', target: 5 }, 1, plane, NO_STEER, CLIFF)).toEqual({
    turn: 0,
    climb: 0.5,
    speed: 13,
  });
});

caseTest('control.autopilot.heading', 'autopilot turns toward the target', () => {
  const plane = planeAt(-20, 45, 6.5, { yaw: 1.2 });

  expect(control({ kind: 'autopilot', target: 5 }, 1, plane, NO_STEER, CLIFF)).toEqual({
    turn: 0.8157519189487726,
    climb: 0.5,
    speed: 13,
  });
});

caseTest('control.autopilot.near-slows', 'autopilot slows within 40 blocks', () => {
  const plane = planeAt(20, 30, 0, { yaw: Math.PI / 2 });

  expect(control({ kind: 'autopilot', target: 5 }, 1, plane, NO_STEER)).toEqual({
    turn: -0.52917534548099,
    climb: -1,
    speed: 8,
  });
});

caseTest('control.autopilot.boost', 'boost on autopilot', () => {
  const plane = planeAt(20, 30, 0, { yaw: Math.PI / 2 });
  const boost: Steer = { ...NO_STEER, boost: true };

  expect(control({ kind: 'autopilot', target: 5 }, 1, plane, boost).speed).toBe(26);
});

caseTest('control.autopilot.arrived', 'no turn on top of the target', () => {
  const plane = planeAt(46.7, 21, 6.5, { yaw: Math.PI / 2 });

  expect(control({ kind: 'autopilot', target: 5 }, 1, plane, NO_STEER)).toEqual({
    turn: 0,
    climb: 0,
    speed: 8,
  });
});
