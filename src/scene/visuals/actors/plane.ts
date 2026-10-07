import { Group, Mesh, MeshBasicMaterial, MeshLambertMaterial } from 'three';

import {
  PLANE_BODY_PARTS,
  PLANE_GLOW_PARTS,
  PLANE_PROP_OFFSET_Z,
  PLANE_PROP_PARTS,
  PLANE_STROBE_PARTS,
} from '@/scene/visuals/actors/actors.constants';
import {
  nextPropAngle,
  planePose,
  strobeVisible,
  type PlanePose,
} from '@/scene/visuals/actors/actors-math';
import { mergeBoxes } from '@/scene/visuals/actors/box-geometry';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

export const createPlaneModule = (): SceneModule => {
  const bodyGeometry = mergeBoxes(PLANE_BODY_PARTS);
  const glowGeometry = mergeBoxes(PLANE_GLOW_PARTS);
  const propGeometry = mergeBoxes(PLANE_PROP_PARTS);
  const strobeGeometry = mergeBoxes(PLANE_STROBE_PARTS);
  const litMaterial = new MeshLambertMaterial({ vertexColors: true });
  const glowMaterial = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });

  const body = new Mesh(bodyGeometry, litMaterial);
  const glow = new Mesh(glowGeometry, glowMaterial);
  const prop = new Mesh(propGeometry, litMaterial);
  const strobe = new Mesh(strobeGeometry, glowMaterial);
  const group = new Group();
  const pose: PlanePose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
  let propAngle = 0;

  group.name = 'plane';
  group.rotation.order = 'YXZ';
  prop.position.set(0, 0, PLANE_PROP_OFFSET_Z);
  group.add(body, glow, prop, strobe);

  const update = (frame: FrameContext): void => {
    planePose(frame.plane, pose);
    group.position.set(pose.x, pose.y, pose.z);
    group.rotation.set(pose.rx, pose.ry, pose.rz);
    propAngle = nextPropAngle(propAngle, frame.dt, frame.plane.speed, frame.reducedMotion);
    prop.rotation.z = propAngle;
    strobe.visible = strobeVisible(frame.time, frame.reducedMotion);
  };

  const dispose = (): void => {
    bodyGeometry.dispose();
    glowGeometry.dispose();
    propGeometry.dispose();
    strobeGeometry.dispose();
    litMaterial.dispose();
    glowMaterial.dispose();
    group.clear();
  };

  return { object: group, update, dispose };
};
