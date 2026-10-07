import {
  BURST_END,
  BURST_LIFT,
  DOCK_EFFECT,
  EFFECT_DECAY,
  RING_LIFT,
  SEND_EFFECT,
  SEND_STATION,
  SHAKE_MIN,
  TAKE_OFF_BLOOM,
} from '@/scene/runtime/runtime.constants';
import { STATION_COUNT } from '@/scene/world/world.constants';
import { SCENE_TIMING } from '@/motion/motion.tokens';

import type { Vec3 } from '@/scene/flight/flight.types';
import type { EffectsState } from '@/scene/runtime/runtime.types';

type Pulse = Readonly<{ beam: number; ring: number; bloom: number; shake: number }>;

export const createEffects = (): EffectsState => {
  return {
    shake: 0,
    bloomBoost: 0,
    beamBoost: new Float32Array(STATION_COUNT),
    ring: { t: 1, x: 0, y: 0, z: 0, scale: 0 },
    burst: { t: BURST_END, x: 0, y: 0, z: 0 },
  };
};

const pulseAt = (
  effects: EffectsState,
  index: number,
  stations: readonly Readonly<Vec3>[],
  pulse: Pulse,
): void => {
  const top = stations[index];

  if (top === undefined || index >= effects.beamBoost.length) {
    return;
  }

  effects.beamBoost[index] = pulse.beam;
  effects.ring.t = 0;
  effects.ring.x = top.x;
  effects.ring.y = top.y + RING_LIFT;
  effects.ring.z = top.z;
  effects.ring.scale = pulse.ring;
  effects.burst.t = 0;
  effects.burst.x = top.x;
  effects.burst.y = top.y + BURST_LIFT;
  effects.burst.z = top.z;
  effects.bloomBoost = pulse.bloom;
  effects.shake = pulse.shake;
};

export const triggerDock = (
  effects: EffectsState,
  index: number,
  stations: readonly Readonly<Vec3>[],
): void => {
  pulseAt(effects, index, stations, DOCK_EFFECT);
};

export const triggerSend = (effects: EffectsState, stations: readonly Readonly<Vec3>[]): void => {
  pulseAt(effects, SEND_STATION, stations, SEND_EFFECT);
};

export const triggerTakeOff = (effects: EffectsState): void => {
  effects.bloomBoost = TAKE_OFF_BLOOM;
};

export const decayFactor = (perFrame: number, dt: number): number => {
  return perFrame ** (dt * 60);
};

export const decayEffects = (effects: EffectsState, dt: number): void => {
  const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
  const beam = decayFactor(EFFECT_DECAY.beam, step);

  for (let index = 0; index < effects.beamBoost.length; index += 1) {
    effects.beamBoost[index] = (effects.beamBoost[index] ?? 0) * beam;
  }

  effects.bloomBoost *= decayFactor(EFFECT_DECAY.bloom, step);
  effects.shake *= decayFactor(EFFECT_DECAY.shake, step);

  if (effects.shake < SHAKE_MIN) {
    effects.shake = 0;
  }

  if (effects.ring.t < 1) {
    effects.ring.t = Math.min(1, effects.ring.t + step / SCENE_TIMING.ringSeconds);
  }

  if (effects.burst.t < BURST_END) {
    effects.burst.t = Math.min(BURST_END, effects.burst.t + step / SCENE_TIMING.burstSeconds);
  }
};
