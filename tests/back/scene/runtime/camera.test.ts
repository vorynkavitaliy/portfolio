import { PerspectiveCamera } from 'three';
import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { CLIFF, FLAT, STATIONS, planeAt } from '@tests/back/scene/flight/integrate.fixtures';
import {
  applyViewport,
  createCameraRig,
  easeInOut,
  fovKickTarget,
  viewOffsetFor,
} from '@/scene/runtime/camera-rig';

import type { Terrain } from '@/scene/flight/flight.types';

const DONE = { progress: 1, done: true } as const;

const rigOn = (terrain: Terrain, reducedMotion: boolean) => {
  const camera = new PerspectiveCamera(52, 1.6, 0.1, 900);
  const rig = createCameraRig({ camera, stations: STATIONS, terrain, reducedMotion });

  return { camera, rig };
};

const sideStep = (reducedMotion: boolean): number => {
  const { camera, rig } = rigOn(FLAT, reducedMotion);
  const plane = planeAt(0, 40, 0);

  rig.snap(plane, -1);

  const before = camera.position.x;

  plane.pos.x += 10;
  rig.update({ plane, dt: 0.1, focusIndex: -1, intro: DONE, shake: 0 });

  return camera.position.x - before;
};

caseTest('view.offset.desktop', 'left-panel offset', () => {
  const offset = viewOffsetFor(1440, 900);

  expect(offset.x).toBeCloseTo(-244.8, 10);
  expect(offset.y).toBe(0);
});

caseTest('view.offset.narrow', 'bottom-sheet offset', () => {
  const offset = viewOffsetFor(390, 844);

  expect(offset.x).toBe(0);
  expect(offset.y).toBeCloseTo(143.48, 10);
});

caseTest('view.offset.boundary', '860 is narrow, 861 is wide', () => {
  expect(viewOffsetFor(860, 800)).toEqual({ x: 0, y: 0.17 * 800 });
  expect(viewOffsetFor(861, 800)).toEqual({ x: -0.17 * 861, y: 0 });
});

caseTest('view.offset.camera', 'applied to a three camera', () => {
  const camera = new PerspectiveCamera(52, 1, 0.1, 900);

  applyViewport(camera, 1440, 900);
  expect(camera.aspect).toBe(1.6);
  expect(camera.view?.enabled).toBe(true);
  expect(camera.view?.offsetX).toBeCloseTo(-244.8, 10);
  expect(camera.view?.offsetY).toBe(0);
  expect(camera.view?.fullWidth).toBe(1440);
});

caseTest('camera.ease', 'cubic in-out', () => {
  expect(easeInOut(0)).toBe(0);
  expect(easeInOut(0.25)).toBe(0.0625);
  expect(easeInOut(0.5)).toBe(0.5);
  expect(easeInOut(0.75)).toBe(0.9375);
  expect(easeInOut(1)).toBe(1);
});

caseTest('camera.fov-kick', 'speed to field-of-view kick', () => {
  expect(fovKickTarget(13, false)).toBe(0);
  expect(fovKickTarget(19.5, false)).toBe(4);
  expect(fovKickTarget(26, false)).toBe(8);
  expect(fovKickTarget(40, false)).toBe(8);
  expect(fovKickTarget(26, true)).toBe(0);
});

caseTest('camera.follow.rates', 'lag and reduced-motion follow', () => {
  expect(sideStep(false)).toBeCloseTo(10 * (1 - Math.exp(-0.4)), 10);
  expect(sideStep(true)).toBeCloseTo(10 * (1 - Math.exp(-1.2)), 10);
});

caseTest('camera.intro.start', 'dive starts above Home', () => {
  const { camera, rig } = rigOn(FLAT, false);
  const home = STATIONS[0] ?? { x: 0, y: 0, z: 0 };

  rig.update({
    plane: planeAt(home.x, home.y + 10, home.z + 13),
    dt: 1 / 60,
    focusIndex: 0,
    intro: { progress: 0, done: false },
    shake: 0,
  });

  expect(camera.position.x).toBeCloseTo(home.x - 30, 10);
  expect(camera.position.y).toBeCloseTo(home.y + 90, 10);
  expect(camera.position.z).toBeCloseTo(home.z + 60, 10);
});

caseTest('camera.floor', 'never below the ground', () => {
  const { camera, rig } = rigOn(CLIFF, false);

  rig.snap(planeAt(30, 30, 0), -1);
  expect(camera.position.y).toBe(42.5);
});
