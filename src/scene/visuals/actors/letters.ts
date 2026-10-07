import { BoxGeometry, Color, Group, InstancedMesh, MeshBasicMaterial } from 'three';

import { LETTER_COLOR, LETTER_DONE_K } from '@/scene/visuals/actors/actors.constants';
import {
  billboardYaw,
  letterBobY,
  letterIntroK,
  writeLetterMatrices,
} from '@/scene/visuals/actors/actors-math';
import { HOME_STATION } from '@/scene/flight/flight.constants';
import { LETTER_LIFT } from '@/scene/world/world.constants';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';
import type { WorldData } from '@/scene/world/world.types';

export const createLettersModule = (data: WorldData): SceneModule => {
  const { targets, starts, delays } = data.letters;
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({ color: new Color(...LETTER_COLOR), toneMapped: false });
  const mesh = new InstancedMesh(geometry, material, delays.length);
  const group = new Group();
  const matrices = new Float32Array(delays.length * 16);
  const baseX = data.stationTops[HOME_STATION * 3] ?? 0;
  const baseY = (data.stationTops[HOME_STATION * 3 + 1] ?? 0) + LETTER_LIFT;
  const baseZ = data.stationTops[HOME_STATION * 3 + 2] ?? 0;
  let placedK = Number.NaN;

  const place = (k: number): void => {
    if (k === placedK) {
      return;
    }

    placedK = k;
    writeLetterMatrices(matrices, k, targets, starts, delays);
    mesh.instanceMatrix.set(matrices);
    mesh.instanceMatrix.needsUpdate = true;
  };

  group.name = 'letters';
  group.position.set(baseX, baseY, baseZ);
  group.add(mesh);
  mesh.frustumCulled = false;
  place(0);

  const update = (frame: FrameContext): void => {
    const k = letterIntroK(frame.intro.progress, frame.intro.done, frame.reducedMotion);

    place(Math.min(k, LETTER_DONE_K));

    group.position.y = frame.intro.done
      ? letterBobY(baseY, frame.time, frame.reducedMotion)
      : baseY;

    group.rotation.y = billboardYaw(
      group.position.x,
      group.position.z,
      frame.camera.position.x,
      frame.camera.position.z,
    );
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
    mesh.dispose();
    group.clear();
  };

  return { object: group, update, dispose };
};
