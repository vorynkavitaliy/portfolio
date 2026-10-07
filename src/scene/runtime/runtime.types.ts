import type { Object3D, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';

import type { PlaneState, Vec3 } from '@/scene/flight/flight.types';
import type { WorldData } from '@/scene/world/world.types';

export type Profile = 'desktop' | 'narrow';

export type Tier = 0 | 1 | 2;

export type EffectsState = {
  shake: number;
  bloomBoost: number;
  beamBoost: Float32Array;
  ring: { t: number; x: number; y: number; z: number; scale: number };
  burst: { t: number; x: number; y: number; z: number };
};

export type Viewport = { width: number; height: number };

export type FrameContext = Readonly<{
  time: number;
  dt: number;
  plane: Readonly<PlaneState>;
  camera: PerspectiveCamera;
  profile: Profile;
  tier: Tier;
  reducedMotion: boolean;
  dockedIndex: number;
  targetIndex: number;
  autopilotIndex: number;
  intro: Readonly<{ progress: number; done: boolean }>;
  effects: Readonly<EffectsState>;
  stations: readonly Vec3[];
  viewport: Readonly<Viewport>;
}>;

export type SceneModule = Readonly<{
  object: Object3D;
  update: ((frame: FrameContext) => void) | null;
  dispose: () => void;
}>;

export type BloomPass = Readonly<{
  render: (strength: number) => void;
  setSize: (width: number, height: number) => void;
  dispose: () => void;
}>;

export type SceneBuildInput = Readonly<{
  data: WorldData;
  profile: Profile;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  pixelTexture: Texture;
}>;

export type StickElements = Readonly<{ root: HTMLElement; knob: HTMLElement }>;
