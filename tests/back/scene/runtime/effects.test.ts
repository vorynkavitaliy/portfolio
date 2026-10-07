import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { STATIONS } from '@tests/back/scene/flight/integrate.fixtures';
import {
  createEffects,
  decayEffects,
  triggerDock,
  triggerSend,
  triggerTakeOff,
} from '@/scene/runtime/effects';

import type { EffectsState } from '@/scene/runtime/runtime.types';

const runFor = (effects: EffectsState, seconds: number, fps: number): void => {
  for (let frame = 0; frame < Math.round(seconds * fps); frame += 1) {
    decayEffects(effects, 1 / fps);
  }
};

const station = (index: number): Readonly<{ x: number; y: number; z: number }> => {
  const top = STATIONS[index];

  if (top === undefined) {
    throw new Error(`no station ${index}`);
  }

  return top;
};

caseTest('effects.initial', 'nothing active at start', () => {
  const effects = createEffects();

  expect(effects.shake).toBe(0);
  expect(effects.bloomBoost).toBe(0);
  expect([...effects.beamBoost]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  expect(effects.ring.t).toBe(1);
  expect(effects.burst.t).toBe(1.2);
});

caseTest('effects.dock.values', 'dock pulse at station 3', () => {
  const effects = createEffects();
  const top = station(3);

  triggerDock(effects, 3, STATIONS);

  expect(
    [...effects.beamBoost].map((value) => {
      return Number(value.toFixed(4));
    }),
  ).toEqual([0, 0, 0, 2.6, 0, 0, 0, 0, 0]);

  expect(effects.ring).toEqual({ t: 0, x: top.x, y: top.y + 0.15, z: top.z, scale: 18 });
  expect(effects.burst).toEqual({ t: 0, x: top.x, y: top.y + 1.2, z: top.z });
  expect(effects.bloomBoost).toBe(0.7);
  expect(effects.shake).toBe(0.35);
});

caseTest('effects.send.values', 'send pulse at Contact', () => {
  const effects = createEffects();
  const top = station(8);

  triggerSend(effects, STATIONS);
  expect(effects.beamBoost[8]).toBe(5);
  expect(effects.ring.scale).toBe(60);
  expect(effects.ring.x).toBe(top.x);
  expect(effects.burst).toEqual({ t: 0, x: top.x, y: top.y + 1.2, z: top.z });
  expect(effects.bloomBoost).toBe(2);
  expect(effects.shake).toBe(0.6);
});

caseTest('effects.take-off.bloom', 'take-off bloom pulse', () => {
  const effects = createEffects();

  triggerTakeOff(effects);
  expect(effects.bloomBoost).toBe(0.6);
});

caseTest('effects.decay.one-frame', 'prototype per-frame factors', () => {
  const effects = createEffects();

  triggerSend(effects, STATIONS);
  decayEffects(effects, 1 / 60);
  expect(effects.beamBoost[8]).toBeCloseTo(5 * 0.965, 6);
  expect(effects.bloomBoost).toBeCloseTo(2 * 0.94, 10);
  expect(effects.shake).toBeCloseTo(0.6 * 0.9, 10);
});

caseTest('effects.decay.rate-independent', 'one second at 30, 60 and 120 fps', () => {
  const at60 = createEffects();
  const at30 = createEffects();
  const at120 = createEffects();

  for (const effects of [at60, at30, at120]) {
    triggerSend(effects, STATIONS);
  }

  runFor(at60, 1, 60);
  runFor(at30, 1, 30);
  runFor(at120, 1, 120);

  for (const other of [at30, at120]) {
    expect(other.beamBoost[8]).toBeCloseTo(at60.beamBoost[8] ?? Number.NaN, 5);
    expect(other.bloomBoost).toBeCloseTo(at60.bloomBoost, 10);
  }

  expect(at60.bloomBoost).toBeCloseTo(2 * 0.94 ** 60, 10);
});

caseTest('effects.shake.cutoff', 'tiny shake snaps to zero', () => {
  const effects = createEffects();

  effects.shake = 0.0105;
  decayEffects(effects, 1 / 60);
  expect(effects.shake).toBe(0);
});

caseTest('effects.ring.duration', 'ring runs 1.3 s', () => {
  const effects = createEffects();

  triggerDock(effects, 0, STATIONS);
  decayEffects(effects, 0.65);
  expect(effects.ring.t).toBeCloseTo(0.5, 10);
  decayEffects(effects, 1);
  expect(effects.ring.t).toBe(1);
  decayEffects(effects, 1);
  expect(effects.ring.t).toBe(1);
});

caseTest('effects.burst.duration', 'burst runs 1.4 s and parks at 1.2', () => {
  const effects = createEffects();

  triggerDock(effects, 0, STATIONS);
  decayEffects(effects, 0.7);
  expect(effects.burst.t).toBeCloseTo(0.5, 10);
  decayEffects(effects, 1.3);
  expect(effects.burst.t).toBe(1.2);
  decayEffects(effects, 1);
  expect(effects.burst.t).toBe(1.2);
});
