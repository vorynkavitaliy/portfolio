import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/nav/minimap.case-test';
import { MAP_PICK_RADIUS, stationAtMap } from '@/scene/nav/minimap';

const STATIONS = [
  { x: -40, z: 20 },
  { x: 30, z: -10 },
  { x: 0, z: 0 },
] as const;

const toU = (x: number): number => {
  return (x + 64) / 128;
};

caseTest('minimap.pick.exact', 'a click on a station returns its index', () => {
  expect(stationAtMap(toU(-40), toU(20), STATIONS)).toBe(0);
  expect(stationAtMap(toU(30), toU(-10), STATIONS)).toBe(1);
  expect(stationAtMap(toU(0), toU(0), STATIONS)).toBe(2);
});

caseTest('minimap.pick.axes', 'u is x and v is z', () => {
  expect(stationAtMap(toU(20), toU(-40), STATIONS)).toBeNull();
  expect(stationAtMap(toU(-40), toU(20), STATIONS)).toBe(0);
});

caseTest('minimap.pick.radius', 'within 14 blocks, not at 14', () => {
  expect(MAP_PICK_RADIUS).toBe(14);
  expect(stationAtMap(toU(-40 + 13.9), toU(20), STATIONS)).toBe(0);
  expect(stationAtMap(toU(-40), toU(20 - 13.9), STATIONS)).toBe(0);
  expect(stationAtMap(toU(-40 + 14), toU(20), STATIONS)).toBeNull();
  expect(stationAtMap(toU(-40 + 20), toU(20), STATIONS)).toBeNull();
});

caseTest('minimap.pick.nearest', 'the nearer station wins', () => {
  const near = [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
  ] as const;

  const reversed = [near[1], near[0]] as const;

  expect(stationAtMap(toU(7), toU(0), near)).toBe(1);
  expect(stationAtMap(toU(7), toU(0), reversed)).toBe(0);
  expect(stationAtMap(toU(3), toU(0), near)).toBe(0);
});

caseTest('minimap.pick.tie', 'equal distance keeps the lower index', () => {
  const pair = [
    { x: -5, z: 0 },
    { x: 5, z: 0 },
  ] as const;

  expect(stationAtMap(toU(0), toU(0), pair)).toBe(0);
});

caseTest('minimap.pick.none', 'nothing in reach returns null', () => {
  expect(stationAtMap(0.5, 0.5, [])).toBeNull();
  expect(stationAtMap(toU(60), toU(60), STATIONS)).toBeNull();
});
