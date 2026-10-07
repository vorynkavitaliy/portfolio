import { Mesh, MeshLambertMaterial, PlaneGeometry, RepeatWrapping, type Texture } from 'three';

import { waterOffsetX, waterOffsetY } from '@/scene/visuals/environment/environment-math';
import {
  ENVIRONMENT_COLORS,
  WATER_DROP,
  WATER_OPACITY,
  WATER_SPAN_FACTOR,
} from '@/scene/visuals/environment/environment.constants';
import { colorOf } from '@/scene/visuals/environment/color-of';
import { MAP_SIZE, SEA_LEVEL } from '@/scene/world/world.constants';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

export const createWaterModule = (pixelTexture: Texture): SceneModule => {
  const span = MAP_SIZE * WATER_SPAN_FACTOR;
  const map = pixelTexture.clone();

  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.repeat.set(span, span);
  map.needsUpdate = true;

  const geometry = new PlaneGeometry(span, span);

  const material = new MeshLambertMaterial({
    color: colorOf(ENVIRONMENT_COLORS.water),
    transparent: true,
    opacity: WATER_OPACITY,
    map,
  });

  const mesh = new Mesh(geometry, material);

  mesh.name = 'water';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = SEA_LEVEL - WATER_DROP;

  const update = (frame: FrameContext): void => {
    map.offset.set(waterOffsetX(frame.time), waterOffsetY(frame.time));
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
    map.dispose();
  };

  return { object: mesh, update, dispose };
};
