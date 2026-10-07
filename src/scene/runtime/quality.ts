import {
  DPR_CAP,
  FPS_FLOOR,
  FPS_GRACE_MS,
  FPS_SAMPLE_CAPACITY,
  FPS_SLOW_WINDOWS,
  FPS_WINDOW_MS,
  LOWEST_TIER,
  NARROW_MAX_WIDTH,
} from '@/scene/runtime/runtime.constants';

import type { Profile, Tier } from '@/scene/runtime/runtime.types';

export const INITIAL_TIER: Tier = 0;

export type FpsVerdict = 'hold' | 'decline' | 'slow';

export type FpsMonitor = Readonly<{
  push: (frameMs: number, nowMs: number) => FpsVerdict;
  restart: (nowMs: number) => void;
}>;

export const profileFor = (width: number): Profile => {
  return width > NARROW_MAX_WIDTH ? 'desktop' : 'narrow';
};

export const dprFor = (profile: Profile, tier: Tier, devicePixelRatio: number): number => {
  const device = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;

  if (tier >= LOWEST_TIER) {
    return Math.min(1, device);
  }

  return Math.min(device, DPR_CAP[profile]);
};

export const nextTier = (tier: Tier): Tier => {
  return tier === 0 ? 1 : 2;
};

export const bloomAllowed = (profile: Profile, tier: Tier): boolean => {
  return profile === 'desktop' && tier === 0;
};

const medianOf = (samples: Float64Array, count: number): number => {
  const sorted = samples.subarray(0, count).sort();
  const middle = count >> 1;

  if (count % 2 === 1) {
    return sorted[middle] ?? 0;
  }

  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
};

export const createFpsMonitor = (profile: Profile): FpsMonitor => {
  const floor = FPS_FLOOR[profile];
  const samples = new Float64Array(FPS_SAMPLE_CAPACITY);
  let count = 0;
  let graceStart: number | null = null;
  let windowStart: number | null = null;
  let slowWindows = 0;
  let level: number = INITIAL_TIER;
  let exhausted = false;

  const restart = (nowMs: number): void => {
    graceStart = nowMs;
    windowStart = null;
    count = 0;
    slowWindows = 0;
  };

  const closeWindow = (nowMs: number): FpsVerdict => {
    const medianMs = medianOf(samples, count);
    const slow = medianMs > 0 && 1000 / medianMs < floor;

    windowStart = nowMs;
    count = 0;
    slowWindows = slow ? slowWindows + 1 : 0;

    if (slowWindows < FPS_SLOW_WINDOWS) {
      return 'hold';
    }

    slowWindows = 0;

    if (level < LOWEST_TIER) {
      level += 1;

      return 'decline';
    }

    exhausted = true;

    return 'slow';
  };

  const push = (frameMs: number, nowMs: number): FpsVerdict => {
    if (exhausted || !Number.isFinite(frameMs) || !Number.isFinite(nowMs) || frameMs <= 0) {
      return 'hold';
    }

    if (graceStart === null) {
      graceStart = nowMs;
    }

    if (nowMs - graceStart < FPS_GRACE_MS) {
      return 'hold';
    }

    if (windowStart === null) {
      windowStart = nowMs;
      count = 0;
    }

    if (count < FPS_SAMPLE_CAPACITY) {
      samples[count] = frameMs;
      count += 1;
    }

    if (nowMs - windowStart < FPS_WINDOW_MS) {
      return 'hold';
    }

    return closeWindow(nowMs);
  };

  return { push, restart };
};
