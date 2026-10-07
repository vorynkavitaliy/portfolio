export type CameraCaseSource = 'prototype' | 'spec' | 'scene-rule';

export type CameraCase = Readonly<{
  id: string;
  source: CameraCaseSource;
  reference: string;
  expected: string;
}>;

const CAMERA_FLOOR = 'spec FR-019 (camera never below terrain or water); prototype :1518 (+2.5)';

export const CAMERA_CASES = [
  {
    id: 'camera.floor.land',
    source: 'spec',
    reference: CAMERA_FLOOR,
    expected: 'over a column of height 40 the camera floor is 42.5',
  },
  {
    id: 'camera.floor.water',
    source: 'spec',
    reference: CAMERA_FLOOR,
    expected: 'over a column of height 2 with sea level 7 the camera floor is 9.5',
  },
  {
    id: 'camera.floor.outside',
    source: 'prototype',
    reference: `${CAMERA_FLOOR}; heightAt is 1 outside the map (:808–812)`,
    expected: 'outside the map the camera floor is sea level + 2.5 = 9.5',
  },
] as const satisfies readonly CameraCase[];

export type CameraCaseId = (typeof CAMERA_CASES)[number]['id'];
