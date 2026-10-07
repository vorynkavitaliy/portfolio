import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/flight/camera.case-test';
import { CLIFF, WATER } from '@tests/back/scene/flight/integrate.fixtures';
import { cameraFloor } from '@/scene/flight/camera';

caseTest('camera.floor.land', 'above high ground', () => {
  expect(cameraFloor(10, 0, CLIFF)).toBe(42.5);
});

caseTest('camera.floor.water', 'above water', () => {
  expect(cameraFloor(0, 0, WATER)).toBe(9.5);
});

caseTest('camera.floor.outside', 'beyond the map edge', () => {
  expect(cameraFloor(200, -200, CLIFF)).toBe(9.5);
});
