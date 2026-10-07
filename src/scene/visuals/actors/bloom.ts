import { Vector2, type Camera, type Scene, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { BLOOM } from '@/scene/visuals/actors/actors.constants';
import { BLOOM_BASE } from '@/scene/runtime/runtime.constants';

import type { BloomPass } from '@/scene/runtime/runtime.types';

export const createBloomPass = (
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
): BloomPass => {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    renderer.getSize(new Vector2()),
    BLOOM_BASE,
    BLOOM.radius,
    BLOOM.threshold,
  );

  const outputPass = new OutputPass();

  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  const render = (strength: number): void => {
    bloomPass.strength = strength;
    composer.render();
  };

  const setSize = (width: number, height: number): void => {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
  };

  const dispose = (): void => {
    renderPass.dispose();
    bloomPass.dispose();
    outputPass.dispose();
    composer.dispose();
  };

  return { render, setSize, dispose };
};
