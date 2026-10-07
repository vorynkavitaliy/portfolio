import type { Vector2 } from 'three';
import {
  BufferGeometry,
  InstancedMesh,
  Material,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  WebGLRenderer,
  type Object3D,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/scene/visuals/actors.case-test';
import { realData } from '@tests/back/scene/world/world.fixture';
import { createEffects } from '@/scene/runtime/effects';
import { createActors } from '@/scene/visuals/actors/actors';
import {
  aiPacketSegment,
  aiPacketU,
  beamActive,
  beamCoreIntensity,
  beamHaloIntensity,
  billboardYaw,
  burstVisible,
  easeOut,
  letterBobY,
  letterEase,
  letterIntroK,
  linkIntensity,
  linkPacketScale,
  linkPacketU,
  linkSegment,
  mastVisible,
  nextPropAngle,
  planePose,
  ringPose,
  strobeVisible,
  writeLetterMatrices,
  type LinkSegment,
  type PlanePose,
  type RingPose,
} from '@/scene/visuals/actors/actors-math';
import { createBloomPass } from '@/scene/visuals/actors/bloom';
import { INDICES_PER_BOX, mergeBoxes, VERTICES_PER_BOX } from '@/scene/visuals/actors/box-geometry';
import { createPixelTexture } from '@/scene/visuals/pixel-texture';

import type { PlaneState } from '@/scene/flight/flight.types';
import type {
  FrameContext,
  Profile,
  SceneBuildInput,
  SceneModule,
} from '@/scene/runtime/runtime.types';

const HOME = 0;
const LETTER_LIFT = 17;

const buildInput = (profile: Profile, renderer?: WebGLRenderer, scene?: Scene): SceneBuildInput => {
  const data = realData();

  return {
    data,
    profile,
    renderer: renderer ?? Object.create(WebGLRenderer.prototype),
    scene: scene ?? new Scene(),
    camera: new PerspectiveCamera(),
    pixelTexture: createPixelTexture(data.pixelTexture),
  };
};

const stationsOf = (): FrameContext['stations'] => {
  const tops = realData().stationTops;
  const stations: { x: number; y: number; z: number }[] = [];

  for (let index = 0; index < tops.length; index += 3) {
    stations.push({ x: tops[index] ?? 0, y: tops[index + 1] ?? 0, z: tops[index + 2] ?? 0 });
  }

  return stations;
};

const planeState = (): PlaneState => {
  return { pos: { x: 5, y: 30, z: -8 }, yaw: 0.3, pitch: 0.2, roll: -0.1, speed: 13, turn: 0 };
};

type FrameOverrides = Partial<{
  time: number;
  dt: number;
  reducedMotion: boolean;
  dockedIndex: number;
  autopilotIndex: number;
  intro: { progress: number; done: boolean };
  effects: FrameContext['effects'];
  camera: PerspectiveCamera;
}>;

const frameOf = (overrides: FrameOverrides): FrameContext => {
  return {
    time: overrides.time ?? 0,
    dt: overrides.dt ?? 0.5,
    plane: planeState(),
    camera: overrides.camera ?? new PerspectiveCamera(),
    profile: 'desktop',
    tier: 0,
    reducedMotion: overrides.reducedMotion ?? false,
    dockedIndex: overrides.dockedIndex ?? -1,
    targetIndex: -1,
    autopilotIndex: overrides.autopilotIndex ?? -1,
    intro: overrides.intro ?? { progress: 1, done: true },
    effects: overrides.effects ?? createEffects(),
    stations: stationsOf(),
    viewport: { width: 800, height: 600 },
  };
};

const moduleNamed = (modules: readonly SceneModule[], name: string): SceneModule => {
  const found = modules.find((entry) => {
    return entry.object.name === name;
  });

  if (found === undefined) {
    throw new Error(`no module ${name}`);
  }

  return found;
};

const updateOf = (entry: SceneModule): ((frame: FrameContext) => void) => {
  if (entry.update === null) {
    throw new Error('module without update');
  }

  return entry.update;
};

const attributeValues = (mesh: Object3D): Float32Array => {
  if (!(mesh instanceof InstancedMesh)) {
    throw new Error('not instanced');
  }

  const attribute = mesh.geometry.getAttribute('aIntensity');

  if (!(attribute.array instanceof Float32Array)) {
    throw new Error('not float');
  }

  return attribute.array;
};

const matrixOf = (mesh: Object3D): Float32Array => {
  if (!(mesh instanceof InstancedMesh) || !(mesh.instanceMatrix.array instanceof Float32Array)) {
    throw new Error('not instanced');
  }

  return mesh.instanceMatrix.array;
};

caseTest('actors.letters.ease', 'cubic ease-out over 0.45 after the delay', () => {
  expect(letterEase(0.3, 0.3)).toBe(0);
  expect(letterEase(0.1, 0.3)).toBe(0);
  expect(letterEase(0.525, 0.3)).toBeCloseTo(0.875, 12);
  expect(letterEase(0.75, 0.3)).toBe(1);
  expect(letterEase(2, 0.3)).toBe(1);
  expect(easeOut(0.5)).toBeCloseTo(0.875, 12);
});

caseTest('actors.letters.matrix', 'scale and position blend start to target', () => {
  const starts = Float32Array.of(10, 20, -5);
  const targets = Float32Array.of(1, 2, 3);
  const delays = Float32Array.of(0);
  const out = new Float32Array(16);

  writeLetterMatrices(out, 0.225, targets, starts, delays);
  expect(out[0]).toBeCloseTo(0.72 * 0.925, 6);
  expect(out[5]).toBeCloseTo(0.72 * 0.925, 6);
  expect(out[10]).toBeCloseTo(0.72 * 0.925, 6);
  expect(out[12]).toBeCloseTo(2.125, 5);
  expect(out[13]).toBeCloseTo(4.25, 5);
  expect(out[14]).toBeCloseTo(2, 5);
  expect(out[15]).toBe(1);

  writeLetterMatrices(out, 0, targets, starts, delays);
  expect(out[0]).toBeCloseTo(0.288, 6);
  expect([out[12], out[13], out[14]]).toEqual([10, 20, -5]);

  writeLetterMatrices(out, 2, targets, starts, Float32Array.of(0.55));
  expect(out[0]).toBeCloseTo(0.72, 6);
  expect([out[12], out[13], out[14]]).toEqual([1, 2, 3]);
});

caseTest('actors.letters.intro-k', 'progress scaled by 1.6, 2 when finished or reduced', () => {
  expect(letterIntroK(0.5, false, false)).toBeCloseTo(0.8, 12);
  expect(letterIntroK(0, false, false)).toBe(0);
  expect(letterIntroK(1, true, false)).toBe(2);
  expect(letterIntroK(0.3, false, true)).toBe(2);
});

caseTest('actors.letters.bob', 'sinusoid of 0.25, flat when reduced', () => {
  expect(letterBobY(10, Math.PI / 1.6, false)).toBeCloseTo(10.25, 12);
  expect(letterBobY(10, 0, false)).toBe(10);
  expect(letterBobY(10, Math.PI / 1.6, true)).toBe(10);
});

caseTest('actors.letters.billboard', 'faces the camera around Y', () => {
  expect(billboardYaw(0, 0, 3, 3)).toBeCloseTo(Math.PI / 4, 12);
  expect(billboardYaw(0, 0, 0, -5)).toBeCloseTo(Math.PI, 12);
  expect(billboardYaw(2, 2, 2, 7)).toBe(0);
});

caseTest('actors.letters.module', 'home lift, scattered start, targets when done', () => {
  const data = realData();
  const letters = moduleNamed(createActors(buildInput('desktop')).modules, 'letters');
  const update = updateOf(letters);
  const home = stationsOf()[HOME];

  update(frameOf({ intro: { progress: 0, done: false } }));
  expect(letters.object.position.x).toBe(home?.x);
  expect(letters.object.position.y).toBe((home?.y ?? 0) + LETTER_LIFT);
  expect(letters.object.position.z).toBe(home?.z);

  const mesh = letters.object.children[0];

  if (mesh === undefined) {
    throw new Error('no mesh');
  }

  const scattered = matrixOf(mesh);

  expect(scattered[0]).toBeCloseTo(0.288, 6);
  expect(scattered[12]).toBeCloseTo(data.letters.starts[0] ?? Number.NaN, 5);

  update(frameOf({ intro: { progress: 1, done: true }, time: 0 }));
  expect(matrixOf(mesh)[0]).toBeCloseTo(0.72, 6);
  expect(matrixOf(mesh)[12]).toBeCloseTo(data.letters.targets[0] ?? Number.NaN, 5);

  const reduced = moduleNamed(createActors(buildInput('desktop')).modules, 'letters');
  const reducedMesh = reduced.object.children[0];

  if (reducedMesh === undefined) {
    throw new Error('no mesh');
  }

  updateOf(reduced)(frameOf({ reducedMotion: true, intro: { progress: 0, done: false } }));
  expect(matrixOf(reducedMesh)[0]).toBeCloseTo(0.72, 6);
  expect(matrixOf(reducedMesh)[12]).toBeCloseTo(data.letters.targets[0] ?? Number.NaN, 5);
  expect(reduced.object.position.y).toBe((home?.y ?? 0) + LETTER_LIFT);
  updateOf(reduced)(frameOf({ reducedMotion: true, time: Math.PI / 1.6 }));
  expect(reduced.object.position.y).toBe((home?.y ?? 0) + LETTER_LIFT);

  const camera = new PerspectiveCamera();

  camera.position.set(home?.x ?? 0, 0, (home?.z ?? 0) + 40);
  update(frameOf({ camera, time: Math.PI / 1.6 }));
  expect(letters.object.rotation.y).toBe(0);
  expect(letters.object.position.y).toBeCloseTo((home?.y ?? 0) + LETTER_LIFT + 0.25, 6);
});

caseTest('actors.beam.active', 'docked 0.6, target 0.3, otherwise 0', () => {
  expect(beamActive(2, 2, 2)).toBe(0.6);
  expect(beamActive(3, 2, 3)).toBe(0.3);
  expect(beamActive(1, 2, 3)).toBe(0);
  expect(beamActive(0, -1, -1)).toBe(0);
});

caseTest('actors.beam.intensity', 'core and halo formulas', () => {
  expect(beamCoreIntensity(2.6, 0.6)).toBeCloseTo(3.75, 12);
  expect(beamHaloIntensity(2.6, 0.6)).toBeCloseTo(1.38, 12);
  expect(beamCoreIntensity(0, 0)).toBe(0.55);
  expect(beamHaloIntensity(0, 0)).toBe(0.16);
  expect(beamCoreIntensity(0, 0.3)).toBeCloseTo(0.85, 12);
  expect(beamHaloIntensity(0, 0.3)).toBeCloseTo(0.25, 12);
});

caseTest('actors.beam.module', 'instance attributes follow state and boost', () => {
  const beams = moduleNamed(createActors(buildInput('desktop')).modules, 'beams');
  const effects = createEffects();

  effects.beamBoost[2] = 2.6;
  updateOf(beams)(frameOf({ dockedIndex: 2, autopilotIndex: 5, effects }));

  const [core, halo] = beams.object.children;

  if (core === undefined || halo === undefined) {
    throw new Error('missing layers');
  }

  const coreValues = attributeValues(core);
  const haloValues = attributeValues(halo);

  expect(coreValues.length).toBe(9);
  expect(coreValues[2]).toBeCloseTo(3.75, 6);
  expect(coreValues[5]).toBeCloseTo(0.85, 6);
  expect(coreValues[0]).toBeCloseTo(0.55, 6);
  expect(haloValues[2]).toBeCloseTo(1.38, 6);
  expect(haloValues[5]).toBeCloseTo(0.25, 6);
  expect(haloValues[0]).toBeCloseTo(0.16, 6);
  expect(matrixOf(core)[13]).toBeCloseTo((stationsOf()[0]?.y ?? 0) + 45.5, 4);
});

caseTest('actors.ring.pose', 'ring scale, fade and end', () => {
  const pose: RingPose = { visible: false, scale: 1, opacity: 0 };

  ringPose(0, 18, false, pose);
  expect(pose).toEqual({ visible: true, scale: 0.5, opacity: 0.9 });

  ringPose(0.5, 18, false, pose);
  expect(pose.scale).toBeCloseTo(0.5 + 0.875 * 18, 12);
  expect(pose.opacity).toBeCloseTo(0.45, 12);

  ringPose(1, 18, false, pose);
  expect(pose.visible).toBe(false);
  expect(pose.opacity).toBe(0);

  ringPose(0.2, 18, true, pose);
  expect(pose.visible).toBe(false);
});

caseTest('actors.burst.visible', 'drawn before t = 1 and not reduced', () => {
  expect(burstVisible(0, false)).toBe(true);
  expect(burstVisible(0.99, false)).toBe(true);
  expect(burstVisible(1, false)).toBe(false);
  expect(burstVisible(1.2, false)).toBe(false);
  expect(burstVisible(0, true)).toBe(false);
});

caseTest('actors.effects.module', 'ring and burst follow the effects', () => {
  const { modules } = createActors(buildInput('desktop'));
  const ring = moduleNamed(modules, 'ring');
  const burst = moduleNamed(modules, 'burst');
  const effects = createEffects();

  updateOf(ring)(frameOf({ effects }));
  updateOf(burst)(frameOf({ effects }));
  expect(ring.object.visible).toBe(false);
  expect(burst.object.visible).toBe(false);

  effects.ring.t = 0.5;
  effects.ring.x = 4;
  effects.ring.y = 9;
  effects.ring.z = -3;
  effects.ring.scale = 18;
  effects.burst.t = 0.4;
  effects.burst.x = 1;
  effects.burst.y = 2;
  effects.burst.z = 3;

  updateOf(ring)(frameOf({ effects }));
  updateOf(burst)(frameOf({ effects }));
  expect(ring.object.visible).toBe(true);
  expect(ring.object.position.toArray()).toEqual([4, 9, -3]);
  expect(ring.object.scale.x).toBeCloseTo(0.5 + 0.875 * 18, 6);

  if (!(ring.object instanceof Mesh)) {
    throw new Error('ring is a mesh');
  }

  expect(ring.object.material).toHaveProperty('opacity', expect.closeTo(0.45, 6));
  expect(burst.object.visible).toBe(true);

  if (!(burst.object instanceof Points) || !(burst.object.material instanceof ShaderMaterial)) {
    throw new Error('burst is points');
  }

  const { uniforms } = burst.object.material;

  expect(uniforms['uT']?.value).toBe(0.4);
  expect(uniforms['uScale']?.value).toBe(600);
  expect(uniforms['uOrigin']?.value.toArray()).toEqual([1, 2, 3]);

  updateOf(ring)(frameOf({ effects, reducedMotion: true }));
  updateOf(burst)(frameOf({ effects, reducedMotion: true }));
  expect(ring.object.visible).toBe(false);
  expect(burst.object.visible).toBe(false);
});

caseTest('actors.plane.pose', 'position and YXZ Euler from plane state', () => {
  const pose: PlanePose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };

  planePose(planeState(), pose);
  expect(pose).toEqual({ x: 5, y: 30, z: -8, rx: -0.2, ry: 0.3, rz: -0.1 });
});

caseTest('actors.plane.prop', 'spin rate 30 + 2·speed, frozen when reduced', () => {
  expect(nextPropAngle(1, 0.5, 13, false)).toBe(29);
  expect(nextPropAngle(1, 0.5, 0, false)).toBe(16);
  expect(nextPropAngle(1, 0.5, 13, true)).toBe(1);
});

caseTest('actors.plane.strobe', 'lit for 0.1 s of every 1.4 s', () => {
  expect(strobeVisible(0, false)).toBe(true);
  expect(strobeVisible(0.05, false)).toBe(true);
  expect(strobeVisible(0.1, false)).toBe(false);
  expect(strobeVisible(0.7, false)).toBe(false);
  expect(strobeVisible(1.45, false)).toBe(true);
  expect(strobeVisible(0.7, true)).toBe(true);
});

caseTest('actors.plane.module', 'pose, spin and strobe applied; reduced is static', () => {
  const plane = moduleNamed(createActors(buildInput('desktop')).modules, 'plane');
  const update = updateOf(plane);
  const prop = plane.object.children[2];
  const strobe = plane.object.children[3];

  if (prop === undefined || strobe === undefined) {
    throw new Error('plane parts');
  }

  update(frameOf({ time: 0.7 }));
  expect(plane.object.position.toArray()).toEqual([5, 30, -8]);
  expect(plane.object.rotation.order).toBe('YXZ');
  expect(plane.object.rotation.x).toBeCloseTo(-0.2, 12);
  expect(plane.object.rotation.y).toBeCloseTo(0.3, 12);
  expect(plane.object.rotation.z).toBeCloseTo(-0.1, 12);
  expect(prop.rotation.z).toBe(28);
  expect(strobe.visible).toBe(false);

  update(frameOf({ time: 0.7, reducedMotion: true }));
  expect(prop.rotation.z).toBe(28);
  expect(strobe.visible).toBe(true);
});

caseTest('actors.mast.blink', 'half a second on, half off at 1.2 Hz', () => {
  expect(mastVisible(0, false)).toBe(true);
  expect(mastVisible(0.9, false)).toBe(false);
  expect(mastVisible(1.7, false)).toBe(true);

  const data = realData();
  const landmarks = moduleNamed(createActors(buildInput('desktop')).modules, 'landmarks');
  const mast = landmarks.object.children[3];

  if (mast === undefined) {
    throw new Error('landmark parts');
  }

  expect(mast.position.toArray()).toEqual(Array.from(data.mast));
  updateOf(landmarks)(frameOf({ time: 0.9 }));
  expect(mast.visible).toBe(false);
  updateOf(landmarks)(frameOf({ time: 1.7 }));
  expect(mast.visible).toBe(true);
});

caseTest('actors.mast.reduced', 'steady under reduced motion', () => {
  expect(mastVisible(0.9, true)).toBe(true);

  const landmarks = moduleNamed(createActors(buildInput('desktop')).modules, 'landmarks');
  const mast = landmarks.object.children[3];

  if (mast === undefined) {
    throw new Error('landmark parts');
  }

  updateOf(landmarks)(frameOf({ time: 0.9, reducedMotion: true }));
  expect(mast.visible).toBe(true);
});

caseTest('actors.link.segment', 'midpoint, direction, length', () => {
  const out: LinkSegment = { mx: 0, my: 0, mz: 0, dx: 0, dy: 0, dz: 0, length: 0 };

  expect(linkSegment({ x: 0, y: 0, z: 0 }, { x: 3, y: 3, z: 0 }, 1, out)).toBe(true);
  expect(out.length).toBe(5);
  expect([out.mx, out.my, out.mz]).toEqual([1.5, 2, 0]);
  expect(out.dx).toBeCloseTo(0.6, 12);
  expect(out.dy).toBeCloseTo(0.8, 12);
  expect(out.dz).toBe(0);
  expect(linkSegment({ x: 0, y: 3, z: 0 }, { x: 0, y: 0, z: 0.01 }, 3, out)).toBe(false);
  expect(linkSegment({ x: 0, y: 0, z: 0 }, { x: Number.NaN, y: 0, z: 0 }, 3, out)).toBe(false);
});

caseTest('actors.link.packets', 'packet phase, size and pulse', () => {
  expect(linkPacketU(0, 2)).toBeCloseTo(0.4, 12);
  expect(linkPacketU(1, 2)).toBeCloseTo(0.2, 12);
  expect(linkPacketScale(0)).toBeCloseTo(0.18, 12);
  expect(linkPacketScale(0.5)).toBeCloseTo(0.5, 12);
  expect(linkIntensity(0)).toBe(0.7);
  expect(linkIntensity(Math.PI / 10)).toBeCloseTo(0.95, 12);
});

caseTest('actors.link.module', 'hidden unless docked, spans plane to beacon', () => {
  const link = moduleNamed(createActors(buildInput('desktop')).modules, 'link');
  const update = updateOf(link);
  const station = stationsOf()[3];

  update(frameOf({ dockedIndex: -1 }));
  expect(link.object.visible).toBe(false);

  update(frameOf({ dockedIndex: 3 }));
  expect(link.object.visible).toBe(true);

  const line = link.object.children[0];

  if (line === undefined || station === undefined) {
    throw new Error('link parts');
  }

  const expected = Math.hypot(station.x - 5, station.y + 3 - 30, station.z + 8);

  expect(line.scale.y).toBeCloseTo(expected, 5);
  expect(line.position.x).toBeCloseTo((5 + station.x) / 2, 5);
  expect(line.position.y).toBeCloseTo((30 + station.y + 3) / 2, 5);

  update(frameOf({ dockedIndex: -1 }));
  expect(link.object.visible).toBe(false);
});

caseTest('actors.ai.packets', 'segment and phase', () => {
  expect(aiPacketSegment(0)).toBe(0);
  expect(aiPacketSegment(4)).toBe(1);
  expect(aiPacketSegment(5)).toBe(2);
  expect(aiPacketU(0, 3)).toBe(0.5);
  expect(aiPacketU(1, 0)).toBeCloseTo(0.55, 12);

  const data = realData();
  const landmarks = moduleNamed(createActors(buildInput('desktop')).modules, 'landmarks');
  const packets = landmarks.object.children[2];

  if (packets === undefined) {
    throw new Error('landmark parts');
  }

  const nodes = data.aiNodes;

  updateOf(landmarks)(frameOf({ time: 1 }));

  const matrix = matrixOf(packets);

  const expectX = (from: number, to: number, u: number): number => {
    return (nodes[from * 3] ?? 0) + ((nodes[to * 3] ?? 0) - (nodes[from * 3] ?? 0)) * u;
  };

  expect(matrix[0]).toBeCloseTo(0.45, 6);
  expect(matrix[12]).toBeCloseTo(expectX(0, 1, 0.55), 4);
  expect(matrix[16 * 4 + 12]).toBeCloseTo(expectX(1, 2, (0.55 + 4 / 6) % 1), 4);
  expect(matrix[16 * 2 + 12]).toBeCloseTo(expectX(2, 3, (0.55 + 2 / 6) % 1), 4);
  expect(matrix[16 * 5 + 12]).toBeCloseTo(expectX(2, 3, (0.55 + 5 / 6) % 1), 4);
});

caseTest('actors.ai.packets-reduced', 'packets hold their start phase', () => {
  const nodes = realData().aiNodes;
  const landmarks = moduleNamed(createActors(buildInput('desktop')).modules, 'landmarks');
  const packets = landmarks.object.children[2];

  if (packets === undefined) {
    throw new Error('landmark parts');
  }

  updateOf(landmarks)(frameOf({ time: 1, reducedMotion: true }));

  const first = nodes[0] ?? 0;

  expect(matrixOf(packets)[12]).toBeCloseTo(first + ((nodes[3] ?? 0) - first) * 0, 4);
});

caseTest('actors.geometry.boxes', 'counts, winding and extents', () => {
  const geometry = mergeBoxes([
    { size: [2, 4, 6], at: [1, 2, 3], color: [0.1, 0.2, 0.3] },
    { size: [1, 1, 1], at: [0, 0, 0], color: [3, 3, 3] },
  ]);

  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const color = geometry.getAttribute('color');
  const index = geometry.getIndex();

  expect(position.count).toBe(2 * VERTICES_PER_BOX);
  expect(index?.count).toBe(2 * INDICES_PER_BOX);
  expect(VERTICES_PER_BOX).toBe(24);
  expect(INDICES_PER_BOX).toBe(36);
  expect(color.getX(0)).toBeCloseTo(0.1, 6);
  expect(color.getZ(24)).toBe(3);

  const corner = (vertex: number): number[] => {
    return [position.getX(vertex), position.getY(vertex), position.getZ(vertex)];
  };

  for (let triangle = 0; triangle < (index?.count ?? 0); triangle += 3) {
    const a = corner(index?.getX(triangle) ?? 0);
    const b = corner(index?.getX(triangle + 1) ?? 0);
    const c = corner(index?.getX(triangle + 2) ?? 0);
    const e1 = [(b[0] ?? 0) - (a[0] ?? 0), (b[1] ?? 0) - (a[1] ?? 0), (b[2] ?? 0) - (a[2] ?? 0)];
    const e2 = [(c[0] ?? 0) - (a[0] ?? 0), (c[1] ?? 0) - (a[1] ?? 0), (c[2] ?? 0) - (a[2] ?? 0)];

    const cross = [
      (e1[1] ?? 0) * (e2[2] ?? 0) - (e1[2] ?? 0) * (e2[1] ?? 0),
      (e1[2] ?? 0) * (e2[0] ?? 0) - (e1[0] ?? 0) * (e2[2] ?? 0),
      (e1[0] ?? 0) * (e2[1] ?? 0) - (e1[1] ?? 0) * (e2[0] ?? 0),
    ];

    const vertex = index?.getX(triangle) ?? 0;

    const along =
      (cross[0] ?? 0) * normal.getX(vertex) +
      (cross[1] ?? 0) * normal.getY(vertex) +
      (cross[2] ?? 0) * normal.getZ(vertex);

    expect(along).toBeGreaterThan(0);
  }

  geometry.computeBoundingBox();
  expect(geometry.boundingBox?.min.toArray()).toEqual([-0.5, -0.5, -0.5]);
  expect(geometry.boundingBox?.max.toArray()).toEqual([2, 4, 6]);
});

caseTest('actors.budget.plane', 'four meshes, two materials', () => {
  const plane = moduleNamed(createActors(buildInput('desktop')).modules, 'plane');

  const meshes = plane.object.children.filter((child): child is Mesh => {
    return child instanceof Mesh;
  });

  expect(meshes).toHaveLength(4);

  expect(
    new Set(
      meshes.map((mesh) => {
        return mesh.material;
      }),
    ).size,
  ).toBe(2);
});

caseTest('actors.bloom.profile', 'none on narrow, factory on desktop', () => {
  expect(createActors(buildInput('narrow')).createBloom).toBeNull();
  expect(createActors(buildInput('desktop')).createBloom).toBeTypeOf('function');
});

caseTest('actors.bloom.lifecycle', 'given scene and camera rendered, targets disposed', () => {
  const renderer: WebGLRenderer = Object.assign(Object.create(WebGLRenderer.prototype), {
    getPixelRatio: (): number => {
      return 1;
    },
    getSize: (target: Vector2): Vector2 => {
      return target.set(800, 600);
    },
  });

  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const attached = createActors(buildInput('desktop', renderer, scene));

  const added: unknown[] = [];

  const addSpy = vi.spyOn(EffectComposer.prototype, 'addPass').mockImplementation(function (
    this: EffectComposer,
    pass,
  ) {
    added.push(pass);
  });

  const probe = createBloomPass(renderer, scene, camera);

  addSpy.mockRestore();
  probe.dispose();

  const renderPass = added[0];

  expect(renderPass).toBeInstanceOf(RenderPass);

  if (renderPass instanceof RenderPass) {
    expect(renderPass.scene).toBe(scene);
    expect(renderPass.camera).toBe(camera);
  }

  const disposed = new Set<unknown>();

  const spy = vi.spyOn(WebGLRenderTarget.prototype, 'dispose').mockImplementation(function (
    this: WebGLRenderTarget,
  ) {
    disposed.add(this);
  });

  const pass = attached.createBloom?.();

  expect(pass).toBeDefined();
  pass?.setSize(400, 300);
  disposed.clear();
  pass?.dispose();
  expect(disposed.size).toBeGreaterThanOrEqual(13);
  spy.mockRestore();
});

const collect = (
  object: Object3D,
  geometries: Set<BufferGeometry>,
  materials: Set<Material>,
): void => {
  object.traverse((node) => {
    if ('geometry' in node && node.geometry instanceof BufferGeometry) {
      geometries.add(node.geometry);
    }

    if ('material' in node) {
      const entry = node.material;

      for (const material of Array.isArray(entry) ? entry : [entry]) {
        if (material instanceof Material) {
          materials.add(material);
        }
      }
    }
  });
};

caseTest('actors.dispose', 'every geometry and material is released', () => {
  const { modules } = createActors(buildInput('desktop'));
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();

  for (const entry of modules) {
    collect(entry.object, geometries, materials);
  }

  expect(geometries.size).toBeGreaterThanOrEqual(10);
  expect(materials.size).toBeGreaterThanOrEqual(10);

  const geometrySpies = [...geometries].map((geometry) => {
    return vi.spyOn(geometry, 'dispose');
  });

  const materialSpies = [...materials].map((material) => {
    return vi.spyOn(material, 'dispose');
  });

  for (const entry of modules) {
    entry.dispose();
  }

  for (const spy of [...geometrySpies, ...materialSpies]) {
    expect(spy).toHaveBeenCalled();
  }
});
