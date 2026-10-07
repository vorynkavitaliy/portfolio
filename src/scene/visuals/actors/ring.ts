import { AdditiveBlending, Color, DoubleSide, Mesh, MeshBasicMaterial, RingGeometry } from 'three';

import { RING } from '@/scene/visuals/actors/actors.constants';
import { ringPose, type RingPose } from '@/scene/visuals/actors/actors-math';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

export const createRingModule = (): SceneModule => {
  const geometry = new RingGeometry(RING.innerRadius, RING.outerRadius, RING.segments);

  const material = new MeshBasicMaterial({
    color: new Color(...RING.color),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  });

  const mesh = new Mesh(geometry, material);
  const pose: RingPose = { visible: false, scale: 1, opacity: 0 };

  mesh.name = 'ring';
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;

  const update = (frame: FrameContext): void => {
    const { ring } = frame.effects;

    ringPose(ring.t, ring.scale, frame.reducedMotion, pose);
    mesh.visible = pose.visible;

    if (!pose.visible) {
      return;
    }

    mesh.position.set(ring.x, ring.y, ring.z);
    mesh.scale.setScalar(pose.scale);
    material.opacity = pose.opacity;
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { object: mesh, update, dispose };
};
