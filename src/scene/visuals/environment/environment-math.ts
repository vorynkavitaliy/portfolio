import {
  CLOUD_DRIFT_SPAN,
  CLOUD_DRIFT_SPEED,
  WATER_SCROLL,
} from '@/scene/visuals/environment/environment.constants';
import { FIREFLY_COUNT, FIREFLY_COUNT_NARROW } from '@/scene/world/world.constants';

import type { Profile } from '@/scene/runtime/runtime.types';

export const cloudOffsetX = (time: number): number => {
  return ((time * CLOUD_DRIFT_SPEED) % CLOUD_DRIFT_SPAN) - CLOUD_DRIFT_SPAN / 2;
};

export const fireflyCountFor = (profile: Profile, available: number): number => {
  const wanted = profile === 'narrow' ? FIREFLY_COUNT_NARROW : FIREFLY_COUNT;

  return Math.min(wanted, available);
};

export const fireflyTimeFor = (time: number, reducedMotion: boolean): number => {
  return reducedMotion ? 0 : time;
};

export const waterOffsetX = (time: number): number => {
  return time * WATER_SCROLL.x;
};

export const waterOffsetY = (time: number): number => {
  return time * WATER_SCROLL.y;
};
