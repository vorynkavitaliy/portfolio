import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  PointLight,
  type Light,
} from 'three';

import { colorOf } from '@/scene/visuals/environment/color-of';
import {
  AMBIENT_INTENSITY,
  AMBIENT_WHITE,
  ENVIRONMENT_COLORS,
  HEMISPHERE_INTENSITY,
  MOON_LIGHT_DISTANCE,
  MOON_LIGHT_INTENSITY,
  STATION_LIGHT,
  STATION_LIGHT_COUNT,
} from '@/scene/visuals/environment/environment.constants';
import { moonDirection } from '@/scene/visuals/environment/sky-module';

import type { Profile, SceneModule } from '@/scene/runtime/runtime.types';

export const stationLightCount = (profile: Profile, stationTops: Float32Array): number => {
  return profile === 'desktop'
    ? Math.min(STATION_LIGHT_COUNT, Math.floor(stationTops.length / 3))
    : 0;
};

export const createLightsModule = (profile: Profile, stationTops: Float32Array): SceneModule => {
  const group = new Group();
  const moon = new DirectionalLight(colorOf(ENVIRONMENT_COLORS.moonLight), MOON_LIGHT_INTENSITY);

  const lights: Light[] = [
    new HemisphereLight(
      colorOf(ENVIRONMENT_COLORS.hemisphereSky),
      colorOf(ENVIRONMENT_COLORS.hemisphereGround),
      HEMISPHERE_INTENSITY,
    ),
    moon,
    new AmbientLight(new Color(AMBIENT_WHITE), AMBIENT_INTENSITY),
  ];

  group.name = 'lights';
  moon.position.copy(moonDirection()).multiplyScalar(MOON_LIGHT_DISTANCE);

  const stationCount = stationLightCount(profile, stationTops);

  for (let i = 0; i < stationCount; i += 1) {
    const light = new PointLight(
      colorOf(ENVIRONMENT_COLORS.stationLight),
      STATION_LIGHT.intensity,
      STATION_LIGHT.distance,
      STATION_LIGHT.decay,
    );

    light.position.set(
      stationTops[i * 3] ?? 0,
      (stationTops[i * 3 + 1] ?? 0) + STATION_LIGHT.lift,
      stationTops[i * 3 + 2] ?? 0,
    );

    lights.push(light);
  }

  group.add(...lights);
  group.matrixAutoUpdate = false;
  group.updateMatrix();

  const dispose = (): void => {
    for (const light of lights) {
      light.dispose();
    }

    group.clear();
  };

  return { object: group, update: null, dispose };
};
