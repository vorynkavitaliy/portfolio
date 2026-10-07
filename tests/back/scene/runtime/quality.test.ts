import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { shouldRun } from '@/scene/runtime/loop-gate';
import {
  bloomAllowed,
  createFpsMonitor,
  dprFor,
  INITIAL_TIER,
  profileFor,
  type FpsMonitor,
  type FpsVerdict,
} from '@/scene/runtime/quality';

import type { BootState, WorldView } from '@/core/world/world.types';

type Verdict = Readonly<{ at: number; verdict: FpsVerdict }>;

const drive = (
  monitor: FpsMonitor,
  frameMs: number,
  fromMs: number,
  toMs: number,
  verdicts: Verdict[],
): void => {
  for (let at = fromMs; at <= toMs; at += frameMs) {
    const verdict = monitor.push(frameMs, at);

    if (verdict !== 'hold') {
      verdicts.push({ at, verdict });
    }
  }
};

const VIEWS: readonly WorldView[] = ['boot', 'world', 'text'];

const STATUSES: readonly BootState['status'][] = ['idle', 'loading', 'ready', 'running', 'failed'];

const RUNNING = {
  view: 'world',
  bootStatus: 'running',
  hidden: false,
  contextLost: false,
} as const;

caseTest('gate.runs.world-running', 'world view after take-off', () => {
  expect(shouldRun(RUNNING)).toBe(true);
});

caseTest('gate.stops.text-view', 'text view', () => {
  expect(shouldRun({ ...RUNNING, view: 'text' })).toBe(false);
});

caseTest('gate.stops.before-take-off', 'every boot status before or instead of running', () => {
  for (const bootStatus of ['idle', 'loading', 'ready', 'failed'] as const) {
    expect(shouldRun({ ...RUNNING, bootStatus })).toBe(false);
  }
});

caseTest('gate.stops.hidden', 'hidden tab', () => {
  expect(shouldRun({ ...RUNNING, hidden: true })).toBe(false);
});

caseTest('gate.stops.context-lost', 'lost context', () => {
  expect(shouldRun({ ...RUNNING, contextLost: true })).toBe(false);
});

caseTest('gate.table.single-true', 'full truth table', () => {
  let runs = 0;
  let combinations = 0;

  for (const view of VIEWS) {
    for (const bootStatus of STATUSES) {
      for (const hidden of [false, true]) {
        for (const contextLost of [false, true]) {
          combinations += 1;
          runs += shouldRun({ view, bootStatus, hidden, contextLost }) ? 1 : 0;
        }
      }
    }
  }

  expect(combinations).toBe(60);
  expect(runs).toBe(1);
});

caseTest('quality.profile.desktop', 'wider than 860', () => {
  expect(profileFor(861)).toBe('desktop');
  expect(profileFor(1440)).toBe('desktop');
});

caseTest('quality.profile.narrow', '860 and below', () => {
  expect(profileFor(860)).toBe('narrow');
  expect(profileFor(390)).toBe('narrow');
});

caseTest('quality.dpr.desktop-cap', 'desktop cap', () => {
  expect(dprFor('desktop', 0, 3)).toBe(1.75);
});

caseTest('quality.dpr.narrow-cap', 'narrow cap', () => {
  expect(dprFor('narrow', 0, 3)).toBe(1.5);
});

caseTest('quality.dpr.below-cap', 'device ratio under the cap', () => {
  expect(dprFor('desktop', 0, 1.25)).toBe(1.25);
});

caseTest('quality.dpr.tier-one-keeps', 'tier 1 only drops bloom', () => {
  expect(dprFor('desktop', 1, 3)).toBe(1.75);
});

caseTest('quality.dpr.tier-two', 'tier 2 renders at 1', () => {
  expect(dprFor('desktop', 2, 3)).toBe(1);
  expect(dprFor('narrow', 2, 3)).toBe(1);
});

caseTest('quality.tier.initial', 'starts at tier 0', () => {
  expect(INITIAL_TIER).toBe(0);
});

caseTest('quality.bloom.desktop-tier-zero', 'bloom only on desktop tier 0', () => {
  expect(bloomAllowed('desktop', 0)).toBe(true);
  expect(bloomAllowed('desktop', 1)).toBe(false);
  expect(bloomAllowed('desktop', 2)).toBe(false);
  expect(bloomAllowed('narrow', 0)).toBe(false);
});

caseTest('fps.hold.fast', '50 fps never declines', () => {
  const verdicts: Verdict[] = [];

  drive(createFpsMonitor('desktop'), 20, 0, 20_000, verdicts);
  expect(verdicts).toEqual([]);
});

caseTest('fps.decline.two-windows', 'first decline after grace and two slow windows', () => {
  const verdicts: Verdict[] = [];

  drive(createFpsMonitor('desktop'), 40, 0, 6000, verdicts);
  expect(verdicts).toEqual([{ at: 6000, verdict: 'decline' }]);
});

caseTest('fps.grace.ignored', 'slow start inside the grace period', () => {
  const monitor = createFpsMonitor('desktop');
  const verdicts: Verdict[] = [];

  drive(monitor, 40, 0, 4000, verdicts);
  drive(monitor, 20, 4020, 20_000, verdicts);
  expect(verdicts).toEqual([]);
});

caseTest('fps.consecutive.only', 'alternating windows never decline', () => {
  const monitor = createFpsMonitor('desktop');
  const verdicts: Verdict[] = [];

  drive(monitor, 40, 0, 4000, verdicts);
  drive(monitor, 20, 4020, 6000, verdicts);
  drive(monitor, 40, 6040, 8000, verdicts);
  drive(monitor, 20, 8020, 10_000, verdicts);
  expect(verdicts).toEqual([]);
});

caseTest('fps.floor.by-profile', '40 fps against both floors', () => {
  const desktop: Verdict[] = [];
  const narrow: Verdict[] = [];

  drive(createFpsMonitor('desktop'), 25, 0, 6000, desktop);
  drive(createFpsMonitor('narrow'), 25, 0, 20_000, narrow);
  expect(desktop).toEqual([{ at: 6000, verdict: 'decline' }]);
  expect(narrow).toEqual([]);
});

caseTest('fps.sequence.slow-last', 'decline, decline, slow, then nothing', () => {
  const verdicts: Verdict[] = [];

  drive(createFpsMonitor('desktop'), 40, 0, 30_000, verdicts);

  expect(verdicts).toEqual([
    { at: 6000, verdict: 'decline' },
    { at: 10_000, verdict: 'decline' },
    { at: 14_000, verdict: 'slow' },
  ]);
});

caseTest('fps.restart.grace', 'restart opens a new grace period', () => {
  const monitor = createFpsMonitor('desktop');
  const verdicts: Verdict[] = [];

  drive(monitor, 20, 0, 19_980, verdicts);
  monitor.restart(20_000);
  drive(monitor, 40, 20_000, 26_000, verdicts);
  expect(verdicts).toEqual([{ at: 26_000, verdict: 'decline' }]);
});
