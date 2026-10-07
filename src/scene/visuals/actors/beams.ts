import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  ShaderMaterial,
  type BufferGeometry,
} from 'three';

import {
  BEAM_CENTER_LIFT,
  BEAM_COLOR,
  BEAM_CORE,
  BEAM_HALO,
  BEAM_HEIGHT,
} from '@/scene/visuals/actors/actors.constants';
import {
  beamActive,
  beamCoreIntensity,
  beamHaloIntensity,
  writeScaleTranslation,
} from '@/scene/visuals/actors/actors-math';
import { BEAM_FRAGMENT, BEAM_VERTEX } from '@/scene/visuals/actors/beam.glsl';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

type Layer = Readonly<{
  mesh: InstancedMesh;
  intensity: InstancedBufferAttribute;
  time: { value: number };
  geometry: BufferGeometry;
  material: ShaderMaterial;
}>;

const createLayer = (geometry: BufferGeometry, stationTops: Float32Array, count: number): Layer => {
  const time = { value: 0 };

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { uColor: { value: new Color(...BEAM_COLOR) }, uTime: time },
    vertexShader: BEAM_VERTEX,
    fragmentShader: BEAM_FRAGMENT,
  });

  const mesh = new InstancedMesh(geometry, material, count);
  const intensity = new InstancedBufferAttribute(new Float32Array(count), 1);

  intensity.setUsage(DynamicDrawUsage);
  geometry.setAttribute('aIntensity', intensity);
  mesh.frustumCulled = false;

  const matrices = new Float32Array(count * 16);

  for (let index = 0; index < count; index += 1) {
    writeScaleTranslation(
      matrices,
      index,
      1,
      stationTops[index * 3] ?? 0,
      (stationTops[index * 3 + 1] ?? 0) + BEAM_CENTER_LIFT,
      stationTops[index * 3 + 2] ?? 0,
    );
  }

  mesh.instanceMatrix.set(matrices);
  mesh.instanceMatrix.needsUpdate = true;

  return { mesh, intensity, time, geometry, material };
};

export const createBeamsModule = (stationTops: Float32Array): SceneModule => {
  const count = Math.floor(stationTops.length / 3);

  const core = createLayer(
    new CylinderGeometry(
      BEAM_CORE.radius,
      BEAM_CORE.radius,
      BEAM_HEIGHT,
      BEAM_CORE.segments,
      1,
      true,
    ),
    stationTops,
    count,
  );

  const halo = createLayer(
    new CylinderGeometry(
      BEAM_HALO.radius,
      BEAM_HALO.radius,
      BEAM_HEIGHT,
      BEAM_HALO.segments,
      1,
      true,
    ),
    stationTops,
    count,
  );

  const group = new Group();

  group.name = 'beams';
  group.add(core.mesh, halo.mesh);

  const update = (frame: FrameContext): void => {
    const time = frame.reducedMotion ? 0 : frame.time;

    for (let index = 0; index < count; index += 1) {
      const active = beamActive(index, frame.dockedIndex, frame.autopilotIndex);
      const boost = frame.effects.beamBoost[index] ?? 0;

      core.intensity.setX(index, beamCoreIntensity(boost, active));
      halo.intensity.setX(index, beamHaloIntensity(boost, active));
    }

    core.intensity.needsUpdate = true;
    halo.intensity.needsUpdate = true;
    core.time.value = time;
    halo.time.value = time + BEAM_HALO.timeOffset;
  };

  const dispose = (): void => {
    for (const layer of [core, halo]) {
      layer.geometry.dispose();
      layer.material.dispose();
      layer.mesh.dispose();
    }

    group.clear();
  };

  return { object: group, update, dispose };
};
