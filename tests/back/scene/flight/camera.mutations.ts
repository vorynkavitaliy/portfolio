import type { CameraCaseId } from '@tests/back/scene/flight/camera.cases';

export type CameraMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly CameraCaseId[];
}>;

const CAMERA = 'src/scene/flight/camera.ts';

export const CAMERA_MUTATIONS: readonly CameraMutation[] = [
  {
    id: 'floor.ignores-sea',
    file: CAMERA,
    find: 'Math.max(terrain.heightAt(x, z), terrain.seaLevel)',
    replace: 'terrain.heightAt(x, z)',
    caseIds: ['camera.floor.water', 'camera.floor.outside'],
  },
  {
    id: 'floor.clearance',
    file: 'src/scene/flight/flight.constants.ts',
    find: 'CAMERA_FLOOR = 2.5',
    replace: 'CAMERA_FLOOR = 2',
    caseIds: ['camera.floor.land', 'camera.floor.water', 'camera.floor.outside'],
  },
];
