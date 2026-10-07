import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
} from 'three';

import {
  AI_LINE_COLOR,
  AI_LINE_OPACITY,
  AI_NODE_COLOR,
  AI_NODE_SCALE,
  AI_PACKET,
  AI_PACKET_COLOR,
  MAST_COLOR,
  MAST_SIZE,
} from '@/scene/visuals/actors/actors.constants';
import {
  aiPacketSegment,
  aiPacketU,
  mastVisible,
  writeScaleTranslation,
} from '@/scene/visuals/actors/actors-math';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';
import type { WorldData } from '@/scene/world/world.types';

const glowMaterial = (color: readonly [number, number, number]): MeshBasicMaterial => {
  return new MeshBasicMaterial({ color: new Color(...color), toneMapped: false });
};

export const createLandmarksModule = (data: WorldData): SceneModule => {
  const nodes = data.aiNodes;
  const nodeCount = Math.floor(nodes.length / 3);
  const box = new BoxGeometry(1, 1, 1);
  const nodeMaterial = glowMaterial(AI_NODE_COLOR);
  const packetMaterial = glowMaterial(AI_PACKET_COLOR);
  const mastMaterial = glowMaterial(MAST_COLOR);
  const nodeMesh = new InstancedMesh(box, nodeMaterial, nodeCount);
  const packets = new InstancedMesh(box, packetMaterial, AI_PACKET.count);
  const mastGeometry = new BoxGeometry(MAST_SIZE, MAST_SIZE, MAST_SIZE);
  const mast = new Mesh(mastGeometry, mastMaterial);
  const lineGeometry = new BufferGeometry();

  const lineMaterial = new LineBasicMaterial({
    color: new Color(...AI_LINE_COLOR),
    transparent: true,
    opacity: AI_LINE_OPACITY,
  });

  const line = new Line(lineGeometry, lineMaterial);
  const group = new Group();
  const nodeMatrices = new Float32Array(nodeCount * 16);
  const packetMatrices = new Float32Array(AI_PACKET.count * 16);

  for (let index = 0; index < nodeCount; index += 1) {
    writeScaleTranslation(
      nodeMatrices,
      index,
      AI_NODE_SCALE,
      nodes[index * 3] ?? 0,
      nodes[index * 3 + 1] ?? 0,
      nodes[index * 3 + 2] ?? 0,
    );
  }

  nodeMesh.instanceMatrix.set(nodeMatrices);
  nodeMesh.instanceMatrix.needsUpdate = true;
  lineGeometry.setAttribute('position', new BufferAttribute(Float32Array.from(nodes), 3));
  mast.position.set(data.mast[0] ?? 0, data.mast[1] ?? 0, data.mast[2] ?? 0);
  packets.frustumCulled = false;
  group.name = 'landmarks';
  group.add(nodeMesh, line, packets, mast);

  const update = (frame: FrameContext): void => {
    const time = frame.reducedMotion ? 0 : frame.time;

    for (let index = 0; index < AI_PACKET.count; index += 1) {
      const from = aiPacketSegment(index) * 3;
      const u = aiPacketU(time, index);
      const ax = nodes[from] ?? 0;
      const ay = nodes[from + 1] ?? 0;
      const az = nodes[from + 2] ?? 0;

      writeScaleTranslation(
        packetMatrices,
        index,
        AI_PACKET.scale,
        ax + ((nodes[from + 3] ?? 0) - ax) * u,
        ay + ((nodes[from + 4] ?? 0) - ay) * u,
        az + ((nodes[from + 5] ?? 0) - az) * u,
      );
    }

    packets.instanceMatrix.set(packetMatrices);
    packets.instanceMatrix.needsUpdate = true;
    mast.visible = mastVisible(frame.time, frame.reducedMotion);
  };

  const dispose = (): void => {
    box.dispose();
    mastGeometry.dispose();
    lineGeometry.dispose();
    nodeMaterial.dispose();
    packetMaterial.dispose();
    mastMaterial.dispose();
    lineMaterial.dispose();
    nodeMesh.dispose();
    packets.dispose();
    group.clear();
  };

  return { object: group, update, dispose };
};
