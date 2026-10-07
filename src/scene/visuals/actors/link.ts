import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  Vector3,
} from 'three';

import {
  LINK_LIFT,
  LINK_PACKET_COLOR,
  LINK_PACKET_COUNT,
  LINK_RADIUS,
  LINK_SEGMENTS,
} from '@/scene/visuals/actors/actors.constants';
import {
  linkIntensity,
  linkPacketScale,
  linkPacketU,
  linkSegment,
  writeScaleTranslation,
  type LinkSegment,
} from '@/scene/visuals/actors/actors-math';
import { LINK_FRAGMENT, LINK_VERTEX } from '@/scene/visuals/actors/link.glsl';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

const AXIS_Y = new Vector3(0, 1, 0);

export const createLinkModule = (): SceneModule => {
  const uniforms = {
    uTime: { value: 0 },
    uLen: { value: 1 },
    uIntensity: { value: 0 },
  };

  const lineGeometry = new CylinderGeometry(LINK_RADIUS, LINK_RADIUS, 1, LINK_SEGMENTS, 1, true);

  const lineMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms,
    vertexShader: LINK_VERTEX,
    fragmentShader: LINK_FRAGMENT,
  });

  const line = new Mesh(lineGeometry, lineMaterial);
  const packetGeometry = new BoxGeometry(1, 1, 1);

  const packetMaterial = new MeshBasicMaterial({
    color: new Color(...LINK_PACKET_COLOR),
    toneMapped: false,
  });

  const packets = new InstancedMesh(packetGeometry, packetMaterial, LINK_PACKET_COUNT);
  const group = new Group();
  const matrices = new Float32Array(LINK_PACKET_COUNT * 16);
  const segment: LinkSegment = { mx: 0, my: 0, mz: 0, dx: 0, dy: 1, dz: 0, length: 1 };
  const direction = new Vector3();

  group.name = 'link';
  group.visible = false;
  line.frustumCulled = false;
  packets.frustumCulled = false;
  group.add(line, packets);

  const update = (frame: FrameContext): void => {
    const station = frame.dockedIndex >= 0 ? frame.stations[frame.dockedIndex] : undefined;
    const plane = frame.plane.pos;

    if (station === undefined || !linkSegment(plane, station, LINK_LIFT, segment)) {
      group.visible = false;

      return;
    }

    const time = frame.reducedMotion ? 0 : frame.time;

    group.visible = true;
    line.position.set(segment.mx, segment.my, segment.mz);
    line.quaternion.setFromUnitVectors(AXIS_Y, direction.set(segment.dx, segment.dy, segment.dz));
    line.scale.set(1, segment.length, 1);
    uniforms.uLen.value = segment.length;
    uniforms.uTime.value = time;
    uniforms.uIntensity.value = linkIntensity(time);

    for (let index = 0; index < LINK_PACKET_COUNT; index += 1) {
      const u = linkPacketU(time, index);

      writeScaleTranslation(
        matrices,
        index,
        linkPacketScale(u),
        plane.x + segment.dx * segment.length * u,
        plane.y + segment.dy * segment.length * u,
        plane.z + segment.dz * segment.length * u,
      );
    }

    packets.instanceMatrix.set(matrices);
    packets.instanceMatrix.needsUpdate = true;
  };

  const dispose = (): void => {
    lineGeometry.dispose();
    lineMaterial.dispose();
    packetGeometry.dispose();
    packetMaterial.dispose();
    packets.dispose();
    group.clear();
  };

  return { object: group, update, dispose };
};
