import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  type BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  type Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  type Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/visuals/environment.case-test';
import { realData } from '@tests/back/scene/world/world.fixture';
import { createEffects } from '@/scene/runtime/effects';
import { createCloudsModule } from '@/scene/visuals/environment/clouds-module';
import { createEnvironment } from '@/scene/visuals/environment/environment';
import {
  cloudOffsetX,
  fireflyCountFor,
  fireflyTimeFor,
  waterOffsetX,
  waterOffsetY,
} from '@/scene/visuals/environment/environment-math';
import { createFirefliesModule } from '@/scene/visuals/environment/fireflies-module';
import { createGlowModule } from '@/scene/visuals/environment/glow-module';
import { createLightsModule } from '@/scene/visuals/environment/lights-module';
import { createMoonModule } from '@/scene/visuals/environment/moon-module';
import { createSkyModule } from '@/scene/visuals/environment/sky-module';
import { createStarsModule } from '@/scene/visuals/environment/stars-module';
import { createWaterModule } from '@/scene/visuals/environment/water-module';
import { createPixelTexture } from '@/scene/visuals/pixel-texture';
import { MAP_SIZE, SEA_LEVEL, STAR_COUNT } from '@/scene/world/world.constants';

import type { FrameContext, Profile, SceneBuildInput } from '@/scene/runtime/runtime.types';

const EPS = 1e-5;

const PROTOTYPE_MOON = new Vector3(-0.55, 0.42, -0.72).normalize();

const frameAt = (
  time: number,
  options: { reducedMotion?: boolean; camera?: PerspectiveCamera; height?: number } = {},
): FrameContext => {
  return {
    time,
    dt: 1 / 60,
    plane: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, speed: 0, turn: 0 },
    camera: options.camera ?? new PerspectiveCamera(),
    profile: 'desktop',
    tier: 0,
    reducedMotion: options.reducedMotion ?? false,
    dockedIndex: -1,
    targetIndex: -1,
    autopilotIndex: -1,
    intro: { progress: 1, done: true },
    effects: createEffects(),
    stations: [],
    viewport: { width: 800, height: options.height ?? 600 },
  };
};

const pixelTexture = (): Texture => {
  return createPixelTexture(new Uint8Array(16 * 16 * 4));
};

const disposals = (
  target: { addEventListener: (type: 'dispose', listener: () => void) => void },
  log: string[],
  name: string,
): void => {
  target.addEventListener('dispose', () => {
    log.push(name);
  });
};

const renderables = (object: Object3D): Object3D[] => {
  const found: Object3D[] = [];

  object.traverse((child) => {
    if (child instanceof Mesh || child instanceof Points) {
      found.push(child);
    }
  });

  return found;
};

const buildInput = (profile: Profile): SceneBuildInput => {
  const renderer: WebGLRenderer = Object.create(WebGLRenderer.prototype);

  return {
    data: realData(),
    profile,
    renderer,
    camera: new PerspectiveCamera(),
    scene: new Scene(),
    pixelTexture: pixelTexture(),
  };
};

caseTest('math.cloud.start', 'drift starts at −30', () => {
  expect(cloudOffsetX(0)).toBe(-30);
});

caseTest('math.cloud.middle', 'drift crosses 0 at 37.5 s', () => {
  expect(cloudOffsetX(37.5)).toBeCloseTo(0, 9);
});

caseTest('math.cloud.wrap', 'drift wraps every 75 s', () => {
  expect(cloudOffsetX(75)).toBeCloseTo(-30, 9);
  expect(cloudOffsetX(74.9)).toBeLessThan(30);
  expect(cloudOffsetX(74.9)).toBeGreaterThan(29);
});

caseTest('math.firefly.count', 'fireflies by profile, capped by the buffer', () => {
  expect(fireflyCountFor('desktop', 520)).toBe(520);
  expect(fireflyCountFor('narrow', 520)).toBe(260);
  expect(fireflyCountFor('desktop', 100)).toBe(100);
  expect(fireflyCountFor('narrow', 100)).toBe(100);
});

caseTest('math.firefly.time', 'time freezes under reduced motion', () => {
  expect(fireflyTimeFor(12.5, true)).toBe(0);
  expect(fireflyTimeFor(12.5, false)).toBe(12.5);
});

caseTest('math.water.offset', 'scroll speeds per axis', () => {
  expect(waterOffsetX(10)).toBeCloseTo(0.5, 9);
  expect(waterOffsetY(10)).toBeCloseTo(0.3, 9);
});

caseTest('glow.instances', 'matrix and colour per instance', () => {
  const glow = {
    positions: new Float32Array([1.5, 2.5, 3.5, 10.5, 11.5, 12.5]),
    colors: new Float32Array([2.2, 1.5, 0.5, 0.5, 2.2, 2.6]),
    scales: new Float32Array([1, 0.5]),
  };

  const part = createGlowModule(glow);
  const mesh = part.object;

  expect(mesh).toBeInstanceOf(InstancedMesh);

  if (!(mesh instanceof InstancedMesh)) {
    return;
  }

  expect(mesh.count).toBe(2);
  expect(mesh.geometry).toBeInstanceOf(BoxGeometry);

  const matrix = new Matrix4();
  const position = new Vector3();
  const scale = new Vector3();

  mesh.getMatrixAt(1, matrix);
  position.setFromMatrixPosition(matrix);
  scale.setFromMatrixScale(matrix);
  expect(position.toArray()).toEqual([10.5, 11.5, 12.5]);
  expect(scale.x).toBeCloseTo(0.5, 6);

  const color = new Color();

  mesh.getColorAt(0, color);
  expect(color.r).toBeCloseTo(2.2, 5);
  expect(color.g).toBeCloseTo(1.5, 5);
  expect(color.b).toBeCloseTo(0.5, 5);
  part.dispose();
});

caseTest('glow.material', 'basic white material, no tone mapping', () => {
  const part = createGlowModule({
    positions: new Float32Array(3),
    colors: new Float32Array(3),
    scales: new Float32Array(1),
  });

  const material = part.object instanceof InstancedMesh ? part.object.material : null;

  expect(material).toBeInstanceOf(MeshBasicMaterial);

  if (material instanceof MeshBasicMaterial) {
    expect(material.toneMapped).toBe(false);
    expect(material.color.toArray()).toEqual([1, 1, 1]);
  }

  expect(part.update).toBeNull();
  part.dispose();
});

caseTest('glow.dispose', 'geometry and material released', () => {
  const part = createGlowModule(realData().glow);
  const mesh = part.object;
  const log: string[] = [];

  if (mesh instanceof InstancedMesh) {
    disposals(mesh.geometry, log, 'geometry');

    if (!Array.isArray(mesh.material)) {
      disposals(mesh.material, log, 'material');
    }

    disposals(mesh, log, 'mesh');
  }

  part.dispose();
  expect(log.sort()).toEqual(['geometry', 'material', 'mesh']);
});

caseTest('water.plane', 'flat plane with a repeating clone', () => {
  const source = pixelTexture();
  const part = createWaterModule(source);
  const mesh = part.object;

  expect(mesh).toBeInstanceOf(Mesh);

  if (!(mesh instanceof Mesh) || !(mesh.material instanceof MeshLambertMaterial)) {
    throw new Error('water is not a lambert mesh');
  }

  const span = MAP_SIZE * 3;

  expect(mesh.geometry).toBeInstanceOf(PlaneGeometry);
  expect(mesh.geometry.parameters.width).toBe(span);
  expect(mesh.geometry.parameters.height).toBe(span);
  expect(mesh.rotation.x).toBeCloseTo(-Math.PI / 2, 9);
  expect(mesh.position.y).toBeCloseTo(SEA_LEVEL - 0.15, 9);
  expect(mesh.material.transparent).toBe(true);
  expect(mesh.material.opacity).toBe(0.84);

  const map = mesh.material.map;

  expect(map).not.toBeNull();
  expect(map).not.toBe(source);
  expect(map?.wrapS).toBe(RepeatWrapping);
  expect(map?.wrapT).toBe(RepeatWrapping);
  expect(map?.repeat.toArray()).toEqual([span, span]);
  expect(source.wrapS).not.toBe(RepeatWrapping);
  part.dispose();
});

caseTest('water.scroll', 'offset follows time on the clone only', () => {
  const source = pixelTexture();
  const part = createWaterModule(source);
  const mesh = part.object;

  if (!(mesh instanceof Mesh) || !(mesh.material instanceof MeshLambertMaterial)) {
    throw new Error('water is not a lambert mesh');
  }

  part.update?.(frameAt(20));
  expect(mesh.material.map?.offset.x).toBeCloseTo(1, 9);
  expect(mesh.material.map?.offset.y).toBeCloseTo(0.6, 9);
  expect(source.offset.toArray()).toEqual([0, 0]);
  part.dispose();
});

caseTest('water.dispose', 'geometry, material and clone released', () => {
  const source = pixelTexture();
  const part = createWaterModule(source);
  const log: string[] = [];
  const mesh = part.object;

  if (mesh instanceof Mesh && mesh.material instanceof MeshLambertMaterial && mesh.material.map) {
    disposals(mesh.geometry, log, 'geometry');
    disposals(mesh.material, log, 'material');
    disposals(mesh.material.map, log, 'clone');
  }

  disposals(source, log, 'source');
  part.dispose();
  expect(log.sort()).toEqual(['clone', 'geometry', 'material']);
});

caseTest('sky.dome', 'back-side shader sphere', () => {
  const horizon = new Color('#1d2748');
  const part = createSkyModule(horizon);
  const mesh = part.object;

  if (!(mesh instanceof Mesh) || !(mesh.material instanceof ShaderMaterial)) {
    throw new Error('sky is not a shader mesh');
  }

  expect(mesh.geometry).toBeInstanceOf(SphereGeometry);
  expect(mesh.geometry.parameters.radius).toBe(600);
  expect(mesh.material.side).toBe(BackSide);
  expect(mesh.material.depthWrite).toBe(false);
  expect(mesh.material.fog).toBe(false);
  expect(Object.keys(mesh.material.uniforms).sort()).toEqual(['uHorizon', 'uMoon', 'uTop']);
  expect(mesh.material.uniforms['uHorizon']?.value).toBe(horizon);

  const moon = mesh.material.uniforms['uMoon']?.value;

  expect(moon).toBeInstanceOf(Vector3);
  expect(moon.distanceTo(PROTOTYPE_MOON)).toBeLessThan(EPS);
  part.dispose();
});

caseTest('sky.follows', 'dome moves with the camera', () => {
  const part = createSkyModule(new Color('#1d2748'));
  const camera = new PerspectiveCamera();

  camera.position.set(12, 34, -56);
  part.update?.(frameAt(0, { camera }));
  expect(part.object.position.toArray()).toEqual([12, 34, -56]);
  part.dispose();
});

caseTest('moon.disc', 'bright flat circle', () => {
  const part = createMoonModule();
  const mesh = part.object;

  if (!(mesh instanceof Mesh) || !(mesh.material instanceof MeshBasicMaterial)) {
    throw new Error('moon is not a basic mesh');
  }

  expect(mesh.geometry).toBeInstanceOf(CircleGeometry);
  expect(mesh.geometry.parameters.radius).toBe(16);
  expect(mesh.geometry.parameters.segments).toBe(32);
  expect(mesh.material.fog).toBe(false);
  expect(mesh.material.toneMapped).toBe(false);
  expect(mesh.material.color.r).toBeCloseTo(1.6, 5);
  expect(mesh.material.color.g).toBeCloseTo(1.55, 5);
  expect(mesh.material.color.b).toBeCloseTo(1.35, 5);
  part.dispose();
});

caseTest('moon.follows', 'sits 480 along the moon direction and faces the camera', () => {
  const part = createMoonModule();
  const camera = new PerspectiveCamera();

  camera.position.set(10, 20, 30);
  part.update?.(frameAt(0, { camera }));

  const offset = part.object.position.clone().sub(camera.position);

  expect(offset.length()).toBeCloseTo(480, 3);
  expect(offset.clone().normalize().distanceTo(PROTOTYPE_MOON)).toBeLessThan(EPS);

  const facing = new Vector3(0, 0, 1).applyQuaternion(part.object.quaternion);

  expect(facing.dot(offset.clone().normalize().negate())).toBeCloseTo(1, 5);
  part.dispose();
});

caseTest('stars.points', 'points material as in the prototype', () => {
  const data = realData();
  const part = createStarsModule(data.stars);
  const points = part.object;

  if (!(points instanceof Points) || !(points.material instanceof PointsMaterial)) {
    throw new Error('stars are not points');
  }

  expect(points.geometry.getAttribute('position').count).toBe(STAR_COUNT);
  expect(points.material.size).toBe(1.6);
  expect(points.material.sizeAttenuation).toBe(false);
  expect(points.material.opacity).toBe(0.85);
  expect(points.material.transparent).toBe(true);
  expect(points.material.fog).toBe(false);
  part.dispose();
});

caseTest('clouds.instances', 'translucent boxes at the cloud cells', () => {
  const cells = new Float32Array([-8, 46, 4, 12, 47, -20]);
  const part = createCloudsModule(cells);
  const mesh = part.object;

  if (!(mesh instanceof InstancedMesh) || !(mesh.material instanceof MeshLambertMaterial)) {
    throw new Error('clouds are not an instanced lambert mesh');
  }

  expect(mesh.count).toBe(2);
  expect(mesh.geometry.parameters).toMatchObject({ width: 4, height: 2, depth: 4 });
  expect(mesh.material.transparent).toBe(true);
  expect(mesh.material.opacity).toBe(0.55);

  const matrix = new Matrix4();

  mesh.getMatrixAt(1, matrix);
  expect(new Vector3().setFromMatrixPosition(matrix).toArray()).toEqual([12, 47, -20]);
  part.dispose();
});

caseTest('clouds.drift', 'x follows the drift formula', () => {
  const part = createCloudsModule(new Float32Array([0, 46, 0]));

  part.update?.(frameAt(10));
  expect(part.object.position.x).toBeCloseTo(-22, 9);
  part.update?.(frameAt(37.5));
  expect(part.object.position.x).toBeCloseTo(0, 9);
  part.update?.(frameAt(100));
  expect(part.object.position.x).toBeCloseTo(-10, 9);
  part.dispose();
});

caseTest('fireflies.range', 'draw range follows the profile', () => {
  const data = realData();
  const desktop = createFirefliesModule(data.fireflies, 'desktop');
  const narrow = createFirefliesModule(data.fireflies, 'narrow');

  if (!(desktop.object instanceof Points) || !(narrow.object instanceof Points)) {
    throw new Error('fireflies are not points');
  }

  expect(desktop.object.geometry.drawRange).toEqual({ start: 0, count: 520 });
  expect(narrow.object.geometry.drawRange).toEqual({ start: 0, count: 260 });
  expect(desktop.object.material).toBeInstanceOf(ShaderMaterial);

  if (desktop.object.material instanceof ShaderMaterial) {
    expect(desktop.object.material.blending).toBe(AdditiveBlending);
    expect(desktop.object.material.depthWrite).toBe(false);
  }

  desktop.dispose();
  narrow.dispose();
});

caseTest('fireflies.uniforms', 'time frozen when reduced, scale follows height', () => {
  const part = createFirefliesModule(realData().fireflies, 'desktop');
  const material = part.object instanceof Points ? part.object.material : null;

  if (!(material instanceof ShaderMaterial)) {
    throw new Error('fireflies have no shader material');
  }

  part.update?.(frameAt(8.5, { height: 700 }));
  expect(material.uniforms['uTime']?.value).toBe(8.5);
  expect(material.uniforms['uScale']?.value).toBe(700);
  part.update?.(frameAt(9, { reducedMotion: true, height: 640 }));
  expect(material.uniforms['uTime']?.value).toBe(0);
  expect(material.uniforms['uScale']?.value).toBe(640);
  part.dispose();
});

caseTest('lights.desktop', 'three scene lights and nine station lights', () => {
  const data = realData();
  const part = createLightsModule('desktop', data.stationTops);
  const children = part.object.children;

  const points = children.filter((child): child is PointLight => {
    return child instanceof PointLight;
  });

  expect(children).toHaveLength(12);
  expect(points).toHaveLength(9);

  points.forEach((light, index) => {
    expect(light.position.x).toBeCloseTo(data.stationTops[index * 3] ?? Number.NaN, 5);
    expect(light.position.y).toBeCloseTo((data.stationTops[index * 3 + 1] ?? Number.NaN) + 2, 5);
    expect(light.position.z).toBeCloseTo(data.stationTops[index * 3 + 2] ?? Number.NaN, 5);
  });

  part.dispose();
});

caseTest('lights.narrow', 'no station lights on narrow', () => {
  const part = createLightsModule('narrow', realData().stationTops);

  expect(part.object.children).toHaveLength(3);

  expect(
    part.object.children.some((child) => {
      return child instanceof PointLight;
    }),
  ).toBe(false);

  part.dispose();
});

caseTest('lights.values', 'intensities as in the prototype', () => {
  const part = createLightsModule('desktop', realData().stationTops);
  const children = part.object.children;

  const hemisphere = children.find((child) => {
    return child instanceof HemisphereLight;
  });

  const moon = children.find((child) => {
    return child instanceof DirectionalLight;
  });

  const point = children.find((child) => {
    return child instanceof PointLight;
  });

  expect(hemisphere).toBeInstanceOf(HemisphereLight);
  expect(moon).toBeInstanceOf(DirectionalLight);
  expect(point).toBeInstanceOf(PointLight);

  if (
    hemisphere instanceof HemisphereLight &&
    moon instanceof DirectionalLight &&
    point instanceof PointLight
  ) {
    expect(hemisphere.intensity).toBe(1.25);
    expect(moon.intensity).toBe(1.5);
    expect(moon.position.length()).toBeCloseTo(100, 4);
    expect(moon.position.clone().normalize().distanceTo(PROTOTYPE_MOON)).toBeLessThan(EPS);
    expect(point.intensity).toBe(40);
    expect(point.distance).toBe(22);
    expect(point.decay).toBe(1.6);
  }

  const ambient = children.find((child) => {
    return child.type === 'AmbientLight';
  });

  expect(ambient).toBeDefined();
  part.dispose();
});

caseTest('env.draw-calls', 'seven renderables on both profiles, lights extra', () => {
  for (const profile of ['desktop', 'narrow'] as const) {
    const parts = createEnvironment(buildInput(profile));

    const drawn = parts.flatMap((part) => {
      return renderables(part.object);
    });

    expect(parts).toHaveLength(8);
    expect(drawn).toHaveLength(7);

    const fireflies = drawn.find((object) => {
      return object.name === 'fireflies';
    });

    expect(fireflies instanceof Points ? fireflies.geometry.drawRange.count : -1).toBe(
      profile === 'narrow' ? 260 : 520,
    );

    for (const part of parts) {
      part.dispose();
    }
  }
});

caseTest('env.dispose', 'every geometry and material disposed', () => {
  const parts = createEnvironment(buildInput('desktop'));
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const instanced = new Set<InstancedMesh>();

  for (const part of parts) {
    part.object.traverse((child) => {
      if (child instanceof InstancedMesh) {
        instanced.add(child);
      }

      if (child instanceof Mesh || child instanceof Points) {
        geometries.add(child.geometry);

        for (const material of [child.material].flat()) {
          materials.add(material);
        }
      }
    });
  }

  const disposed: unknown[] = [];

  for (const geometry of geometries) {
    geometry.addEventListener('dispose', () => {
      disposed.push(geometry);
    });
  }

  for (const material of materials) {
    material.addEventListener('dispose', () => {
      disposed.push(material);
    });
  }

  for (const mesh of instanced) {
    mesh.addEventListener('dispose', () => {
      disposed.push(mesh);
    });
  }

  for (const part of parts) {
    part.dispose();
  }

  expect(geometries.size).toBe(7);
  expect(materials.size).toBe(7);
  expect(instanced.size).toBe(2);
  expect(disposed).toHaveLength(16);
});
