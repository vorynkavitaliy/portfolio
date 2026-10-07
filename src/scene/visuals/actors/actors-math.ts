import {
  BEAM_CORE,
  BEAM_HALO,
  BEAM_TARGET_ACTIVE,
  BEAM_DOCKED_ACTIVE,
  LETTER_DONE_K,
  LETTER_INTRO_K_SCALE,
  LETTER_SETTLE,
  LETTER_START_SCALE,
  LETTER_BOB,
  LINK_MIN_LENGTH,
  LINK_PACKET_COUNT,
  LINK_PACKET_RATE,
  LINK_PACKET_SCALE,
  LINK_PULSE,
  PLANE_PROP_SPIN,
  RING,
  STROBE,
  MAST_BLINK_HZ,
  AI_PACKET,
} from '@/scene/visuals/actors/actors.constants';
import { LETTER_SCALE } from '@/scene/world/world.constants';

import type { PlaneState, Vec3 } from '@/scene/flight/flight.types';

export type PlanePose = { x: number; y: number; z: number; rx: number; ry: number; rz: number };

export type RingPose = { visible: boolean; scale: number; opacity: number };

export type LinkSegment = {
  mx: number;
  my: number;
  mz: number;
  dx: number;
  dy: number;
  dz: number;
  length: number;
};

export const clamp01 = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};

export const easeOut = (value: number): number => {
  return 1 - Math.pow(1 - value, 3);
};

export const letterEase = (k: number, delay: number): number => {
  return easeOut(clamp01((k - delay) / LETTER_SETTLE));
};

export const letterIntroK = (progress: number, done: boolean, reducedMotion: boolean): number => {
  return done || reducedMotion ? LETTER_DONE_K : progress * LETTER_INTRO_K_SCALE;
};

export const letterBobY = (baseY: number, time: number, reducedMotion: boolean): number => {
  return reducedMotion ? baseY : baseY + Math.sin(time * LETTER_BOB.rate) * LETTER_BOB.amplitude;
};

export const billboardYaw = (fromX: number, fromZ: number, toX: number, toZ: number): number => {
  return Math.atan2(toX - fromX, toZ - fromZ);
};

export const writeScaleTranslation = (
  out: Float32Array,
  index: number,
  scale: number,
  x: number,
  y: number,
  z: number,
): void => {
  const o = index * 16;

  out[o] = scale;
  out[o + 1] = 0;
  out[o + 2] = 0;
  out[o + 3] = 0;
  out[o + 4] = 0;
  out[o + 5] = scale;
  out[o + 6] = 0;
  out[o + 7] = 0;
  out[o + 8] = 0;
  out[o + 9] = 0;
  out[o + 10] = scale;
  out[o + 11] = 0;
  out[o + 12] = x;
  out[o + 13] = y;
  out[o + 14] = z;
  out[o + 15] = 1;
};

export const writeLetterMatrices = (
  out: Float32Array,
  k: number,
  targets: Float32Array,
  starts: Float32Array,
  delays: Float32Array,
): void => {
  for (let index = 0; index < delays.length; index += 1) {
    const t = letterEase(k, delays[index] ?? 0);
    const o = index * 3;
    const fromX = starts[o] ?? 0;
    const fromY = starts[o + 1] ?? 0;
    const fromZ = starts[o + 2] ?? 0;

    writeScaleTranslation(
      out,
      index,
      LETTER_SCALE * (LETTER_START_SCALE + (1 - LETTER_START_SCALE) * t),
      fromX + ((targets[o] ?? 0) - fromX) * t,
      fromY + ((targets[o + 1] ?? 0) - fromY) * t,
      fromZ + ((targets[o + 2] ?? 0) - fromZ) * t,
    );
  }
};

export const beamActive = (index: number, dockedIndex: number, autopilotIndex: number): number => {
  if (index === dockedIndex) {
    return BEAM_DOCKED_ACTIVE;
  }

  return index === autopilotIndex ? BEAM_TARGET_ACTIVE : 0;
};

export const beamCoreIntensity = (boost: number, active: number): number => {
  return BEAM_CORE.base + active + boost;
};

export const beamHaloIntensity = (boost: number, active: number): number => {
  return BEAM_HALO.base + active * BEAM_HALO.activeGain + boost * BEAM_HALO.boostGain;
};

export const ringPose = (t: number, scale: number, reducedMotion: boolean, out: RingPose): void => {
  if (reducedMotion || t >= 1) {
    out.visible = false;
    out.opacity = 0;

    return;
  }

  out.visible = true;
  out.scale = RING.baseScale + easeOut(clamp01(t)) * scale;
  out.opacity = (1 - t) * RING.opacity;
};

export const burstVisible = (t: number, reducedMotion: boolean): boolean => {
  return !reducedMotion && t < 1;
};

export const nextPropAngle = (
  angle: number,
  dt: number,
  speed: number,
  reducedMotion: boolean,
): number => {
  return reducedMotion
    ? angle
    : angle + dt * (PLANE_PROP_SPIN.base + speed * PLANE_PROP_SPIN.perSpeed);
};

export const strobeVisible = (time: number, reducedMotion: boolean): boolean => {
  return reducedMotion || time % STROBE.period < STROBE.on;
};

export const mastVisible = (time: number, reducedMotion: boolean): boolean => {
  return reducedMotion || Math.floor(time * MAST_BLINK_HZ) % 2 === 0;
};

export const planePose = (plane: Readonly<PlaneState>, out: PlanePose): void => {
  out.x = plane.pos.x;
  out.y = plane.pos.y;
  out.z = plane.pos.z;
  out.rx = -plane.pitch;
  out.ry = plane.yaw;
  out.rz = plane.roll;
};

export const linkSegment = (
  from: Readonly<Vec3>,
  to: Readonly<Vec3>,
  lift: number,
  out: LinkSegment,
): boolean => {
  const dx = to.x - from.x;
  const dy = to.y + lift - from.y;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dy, dz);

  if (!(length >= LINK_MIN_LENGTH)) {
    return false;
  }

  out.mx = from.x + dx / 2;
  out.my = from.y + dy / 2;
  out.mz = from.z + dz / 2;
  out.dx = dx / length;
  out.dy = dy / length;
  out.dz = dz / length;
  out.length = length;

  return true;
};

export const linkIntensity = (time: number): number => {
  return LINK_PULSE.base + LINK_PULSE.amplitude * Math.sin(time * LINK_PULSE.rate);
};

export const linkPacketU = (time: number, index: number): number => {
  return (time * LINK_PACKET_RATE + index / LINK_PACKET_COUNT) % 1;
};

export const linkPacketScale = (u: number): number => {
  return LINK_PACKET_SCALE.base + LINK_PACKET_SCALE.swing * Math.sin(Math.PI * u);
};

export const aiPacketU = (time: number, index: number): number => {
  return (time * AI_PACKET.rate + index / AI_PACKET.count) % 1;
};

export const aiPacketSegment = (index: number): number => {
  return index % AI_PACKET.segments;
};
