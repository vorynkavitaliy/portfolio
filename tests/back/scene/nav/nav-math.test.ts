import { expect } from 'vitest';

import { STATIONS } from '@tests/back/scene/flight/integrate.fixtures';
import { caseTest } from '@tests/back/scene/nav/nav-math.case-test';
import { edgePlacement, LABEL_LIFT, labelVisible, selectTarget } from '@/scene/nav/nav-math';

import type { FlightMode } from '@/scene/flight/flight.types';

const FREE: FlightMode = { kind: 'free' };
const ORIGIN = { x: 0, y: 30, z: 0 };
const ALL_VISITED = (1 << 9) - 1;

caseTest('nav.target.autopilot', 'the autopilot destination is the target', () => {
  const mode: FlightMode = { kind: 'autopilot', target: 3 };

  expect(selectTarget(mode, ORIGIN, STATIONS, 0)).toBe(3);
  expect(selectTarget(mode, ORIGIN, STATIONS, 1 << 3)).toBe(3);
});

caseTest('nav.target.nearest-unvisited', 'the nearest station not yet docked', () => {
  const docked: FlightMode = { kind: 'docked', station: 0, dock: { x: 0, y: 0, z: 0 } };

  expect(selectTarget(FREE, ORIGIN, STATIONS, 0)).toBe(7);
  expect(selectTarget(FREE, ORIGIN, STATIONS, 1 << 7)).toBe(4);
  expect(selectTarget(docked, ORIGIN, STATIONS, 1 << 7)).toBe(4);
});

caseTest('nav.target.tie', 'ties go to the lower index', () => {
  expect(selectTarget(FREE, { x: -43.5, y: 30, z: 24.5 }, STATIONS, 0)).toBe(0);
});

caseTest('nav.target.none', 'no target when everything is visited', () => {
  expect(selectTarget(FREE, ORIGIN, STATIONS, ALL_VISITED)).toBe(-1);
});

caseTest('nav.label.front', 'labels show only in front of the camera', () => {
  expect(labelVisible(-0.5, 0, 0, 10, false)).toBe(false);
  expect(labelVisible(-0.51, 0, 0, 10, false)).toBe(true);
});

caseTest('nav.label.screen-bounds', 'labels show only inside the screen margin', () => {
  expect(labelVisible(-5, 0.94, 0, 10, false)).toBe(false);
  expect(labelVisible(-5, -0.94, 0, 10, false)).toBe(false);
  expect(labelVisible(-5, 0, 0.92, 10, false)).toBe(false);
  expect(labelVisible(-5, 0, -0.92, 10, false)).toBe(false);
  expect(labelVisible(-5, 0.939, 0.919, 10, false)).toBe(true);
});

caseTest('nav.label.range', 'labels show within 160 blocks, the target at any range', () => {
  expect(labelVisible(-5, 0, 0, 160, false)).toBe(false);
  expect(labelVisible(-5, 0, 0, 159.9, false)).toBe(true);
  expect(labelVisible(-5, 0, 0, 500, true)).toBe(true);
});

caseTest('nav.label.target-behind', 'a target behind the camera has no label', () => {
  expect(labelVisible(1, 0, 0, 10, true)).toBe(false);
});

caseTest('nav.label.lift', 'labels sit above the beacon top', () => {
  expect(LABEL_LIFT).toBe(12);
});

caseTest('nav.edge.diagonal', 'arrow position and angle, desktop', () => {
  expect(edgePlacement(3, 4, 1440, 900)).toEqual({ x: 1015.5, y: 56, angle: 0.6435011087932843 });
});

caseTest('nav.edge.narrow', 'arrow position and angle, phone', () => {
  expect(edgePlacement(-0.2, -5, 390, 844)).toEqual({
    x: 180.35999999999999,
    y: 788,
    angle: -3.1016139664665032,
  });
});

caseTest('nav.edge.zero', 'a target dead ahead points right', () => {
  expect(edgePlacement(0, 0, 1440, 900)).toEqual({ x: 1360, y: 450, angle: Math.PI / 2 });
});

caseTest('nav.edge.non-finite', 'a NaN camera position falls back to right', () => {
  expect(edgePlacement(Number.NaN, Number.NaN, 1440, 900)).toEqual({
    x: 1360,
    y: 450,
    angle: Math.PI / 2,
  });
});

caseTest('nav.edge.no-allocation', 'the out object is reused', () => {
  const out = { x: 0, y: 0, angle: 0 };

  expect(edgePlacement(3, 4, 1440, 900, out)).toBe(out);
  expect(out.x).toBe(1015.5);
});
