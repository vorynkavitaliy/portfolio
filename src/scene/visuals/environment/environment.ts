import { Color } from 'three';

import { FOG_COLOR } from '@/scene/runtime/runtime.constants';
import { createCloudsModule } from '@/scene/visuals/environment/clouds-module';
import { createFirefliesModule } from '@/scene/visuals/environment/fireflies-module';
import { createGlowModule } from '@/scene/visuals/environment/glow-module';
import { createLightsModule } from '@/scene/visuals/environment/lights-module';
import { createMoonModule } from '@/scene/visuals/environment/moon-module';
import { createSkyModule } from '@/scene/visuals/environment/sky-module';
import { createStarsModule } from '@/scene/visuals/environment/stars-module';
import { createWaterModule } from '@/scene/visuals/environment/water-module';

import type { SceneBuildInput, SceneModule } from '@/scene/runtime/runtime.types';

export const createEnvironment = (input: SceneBuildInput): readonly SceneModule[] => {
  const { data, profile, pixelTexture } = input;

  return [
    createSkyModule(new Color(FOG_COLOR)),
    createMoonModule(),
    createStarsModule(data.stars),
    createGlowModule(data.glow),
    createWaterModule(pixelTexture),
    createCloudsModule(data.clouds),
    createFirefliesModule(data.fireflies, profile),
    createLightsModule(profile, data.stationTops),
  ];
};
