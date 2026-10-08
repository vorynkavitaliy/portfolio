import { expect } from 'vitest';

import { caseTest } from '@tests/back/core/world/world-actions.case-test';
import { STATION_IDS, stationAt, stationIndex } from '@/core/world/stations';
import {
  addVisited,
  failWorld,
  flashSend,
  markInputUsed,
  markReady,
  markSlow,
  openText,
  openWorld,
  setEngineLoaded,
  setFlight,
  setMenu,
  setSound,
  setWorkerProgress,
  setWorldAvailable,
  startLoading,
  takeOff,
} from '@/core/world/world-actions';
import { INITIAL_WORLD } from '@/core/world/world-store';
import type { WorldFailReason, WorldSnapshot } from '@/core/world/world.types';

const IDLE: WorldSnapshot = INITIAL_WORLD;

const LOADING: WorldSnapshot = { ...IDLE, boot: { status: 'loading', worker: 0.5, engine: false } };

const READY: WorldSnapshot = { ...IDLE, boot: { status: 'ready' } };

const RUNNING: WorldSnapshot = { ...IDLE, view: 'world', boot: { status: 'running' } };

const FAILED: WorldSnapshot = { ...IDLE, boot: { status: 'failed', reason: 'timeout' } };

caseTest('world.stations.order', 'nine ids in prototype order', () => {
  expect([...STATION_IDS]).toEqual([
    'home-base',
    'full-cycle',
    'frontend',
    'backend',
    'ai',
    'deploy',
    'systems',
    'this-world',
    'contact',
  ]);
});

caseTest('world.stations.count', 'there are nine stations', () => {
  expect(STATION_IDS).toHaveLength(9);
});

caseTest('world.stations.index', 'index is the array position', () => {
  expect(stationIndex('home-base')).toBe(0);
  expect(stationIndex('systems')).toBe(6);
  expect(stationIndex('contact')).toBe(8);
});

caseTest('world.stations.at', 'at maps back and rejects out of range', () => {
  expect(stationAt(0)).toBe('home-base');
  expect(stationAt(8)).toBe('contact');
  expect(stationAt(9)).toBeNull();
  expect(stationAt(-1)).toBeNull();
});

caseTest('world.actions.open-text', 'text view with reason, menu closed', () => {
  const state = openText({ ...RUNNING, menu: 'map' }, 'visitor');

  expect(state.view).toBe('text');
  expect(state.textReason).toBe('visitor');
  expect(state.menu).toBe('none');
});

caseTest('world.actions.open-text.same', 'repeating changes nothing', () => {
  const text = openText(IDLE, 'deep-link');

  expect(openText(text, 'deep-link')).toBe(text);
  expect(openText(text, 'escape')).not.toBe(text);
});

caseTest('world.actions.open-world', 'world view clears the reason', () => {
  const text = openText(IDLE, 'visitor');
  const world = openWorld(text);

  expect(world.view).toBe('world');
  expect(world.textReason).toBeNull();
  expect(openWorld(world)).toBe(world);
});

caseTest('world.actions.keep-state-on-switch', 'visited and flight survive the round trip', () => {
  const docked: WorldSnapshot = {
    ...RUNNING,
    flight: { mode: 'docked', station: 'systems' },
    visited: ['home-base', 'systems'],
  };

  const back = openWorld(openText(docked, 'visitor'));

  expect(back.visited).toEqual(['home-base', 'systems']);
  expect(back.flight).toEqual({ mode: 'docked', station: 'systems' });
});

caseTest('world.actions.world-available', 'flag is stored', () => {
  const on = setWorldAvailable(IDLE, true);

  expect(on.worldAvailable).toBe(true);
  expect(setWorldAvailable(on, true)).toBe(on);
  expect(setWorldAvailable(on, false).worldAvailable).toBe(false);
});

caseTest('world.actions.start-loading', 'only idle starts loading', () => {
  expect(startLoading(IDLE).boot).toEqual({ status: 'loading', worker: 0, engine: false });
  expect(startLoading(LOADING)).toBe(LOADING);
  expect(startLoading(READY)).toBe(READY);
  expect(startLoading(RUNNING)).toBe(RUNNING);
  expect(startLoading(FAILED)).toBe(FAILED);
});

caseTest('world.actions.worker-progress', 'progress is clamped to 0..1', () => {
  expect(setWorkerProgress(LOADING, 0.4).boot).toEqual({
    status: 'loading',
    worker: 0.4,
    engine: false,
  });

  expect(setWorkerProgress(LOADING, 1.7).boot).toEqual({
    status: 'loading',
    worker: 1,
    engine: false,
  });

  expect(setWorkerProgress(LOADING, -0.2).boot).toEqual({
    status: 'loading',
    worker: 0,
    engine: false,
  });
});

caseTest('world.actions.worker-progress.not-loading', 'ignored outside loading', () => {
  expect(setWorkerProgress(IDLE, 0.5)).toBe(IDLE);
  expect(setWorkerProgress(READY, 0.5)).toBe(READY);
});

caseTest('world.actions.engine-loaded', 'engine flag while loading', () => {
  expect(setEngineLoaded(LOADING).boot).toEqual({ status: 'loading', worker: 0.5, engine: true });
  expect(setEngineLoaded(IDLE)).toBe(IDLE);
  expect(setEngineLoaded(READY)).toBe(READY);
});

caseTest('world.actions.mark-ready', 'loading becomes ready', () => {
  expect(markReady(LOADING).boot).toEqual({ status: 'ready' });
  expect(markReady(IDLE)).toBe(IDLE);
  expect(markReady(RUNNING)).toBe(RUNNING);
  expect(markReady(FAILED)).toBe(FAILED);
});

caseTest('world.actions.take-off', 'ready becomes running with intro and flash', () => {
  const state = takeOff({ ...READY, flight: { mode: 'free' }, menu: 'map' });

  expect(state.boot).toEqual({ status: 'running' });
  expect(state.flight).toEqual({ mode: 'intro' });
  expect(state.menu).toBe('none');
  expect(state.flash).toEqual({ seq: 1, kind: 'take-off' });
});

caseTest('world.actions.take-off.sound', 'sound turns on', () => {
  expect(READY.sound).toBe(false);
  expect(takeOff(READY).sound).toBe(true);
});

caseTest('world.actions.take-off.not-ready', 'other states are untouched', () => {
  for (const state of [IDLE, LOADING, RUNNING, FAILED]) {
    expect(takeOff(state)).toBe(state);
    expect(takeOff(state).sound).toBe(false);
  }
});

caseTest('world.actions.take-off.flash-seq', 'seq increments', () => {
  const state = takeOff({ ...READY, flash: { seq: 4, kind: 'send' } });

  expect(state.flash).toEqual({ seq: 5, kind: 'take-off' });
});

caseTest('world.actions.fail.no-webgl2', 'no WebGL2 is its own reason', () => {
  const state = failWorld({ ...LOADING, worldAvailable: true, menu: 'autopilot' }, 'no-webgl2');

  expect(state.boot).toEqual({ status: 'failed', reason: 'no-webgl2' });
  expect(state.view).toBe('text');
  expect(state.textReason).toBe('no-webgl2');
  expect(state.worldAvailable).toBe(false);
  expect(state.menu).toBe('none');
});

caseTest('world.actions.fail.other', 'every other failure reads failed', () => {
  const reasons: readonly WorldFailReason[] = [
    'chunk-failed',
    'worker-failed',
    'renderer-failed',
    'context-lost',
    'timeout',
  ];

  for (const reason of reasons) {
    const state = failWorld({ ...LOADING, worldAvailable: true }, reason);

    expect(state.boot).toEqual({ status: 'failed', reason });
    expect(state.view).toBe('text');
    expect(state.textReason).toBe('failed');
    expect(state.worldAvailable).toBe(false);
  }
});

caseTest('world.actions.fail.from-running', 'running world falls back to text', () => {
  const state = failWorld({ ...RUNNING, menu: 'map' }, 'context-lost');

  expect(state.menu).toBe('none');
  expect(state.view).toBe('text');
});

caseTest('world.actions.fail.first-reason-wins', 'a second failure is ignored', () => {
  const first = failWorld({ ...LOADING, worldAvailable: true }, 'chunk-failed');
  const second = failWorld(first, 'context-lost');

  expect(second).toBe(first);
  expect(second.boot).toEqual({ status: 'failed', reason: 'chunk-failed' });
});

caseTest('world.actions.set-menu', 'menu is stored', () => {
  const open = setMenu(IDLE, 'autopilot');

  expect(open.menu).toBe('autopilot');
  expect(setMenu(open, 'autopilot')).toBe(open);
  expect(setMenu(open, 'map').menu).toBe('map');
  expect(setMenu(open, 'none').menu).toBe('none');
});

caseTest('world.actions.set-sound', 'sound toggles', () => {
  const on = setSound(IDLE, true);

  expect(on.sound).toBe(true);
  expect(setSound(on, true)).toBe(on);
  expect(setSound(on, false).sound).toBe(false);
  expect(setSound(IDLE, false)).toBe(IDLE);
});

caseTest('world.actions.set-flight', 'phases are stored and compared by value', () => {
  const free = setFlight(IDLE, { mode: 'free' });

  expect(free.flight).toEqual({ mode: 'free' });
  expect(setFlight(free, { mode: 'free' })).toBe(free);

  const toSystems = setFlight(free, { mode: 'autopilot', target: 'systems' });

  expect(toSystems.flight).toEqual({ mode: 'autopilot', target: 'systems' });
  expect(setFlight(toSystems, { mode: 'autopilot', target: 'systems' })).toBe(toSystems);
  expect(setFlight(toSystems, { mode: 'autopilot', target: 'contact' })).not.toBe(toSystems);

  const docked = setFlight(toSystems, { mode: 'docked', station: 'systems' });

  expect(docked.flight).toEqual({ mode: 'docked', station: 'systems' });
  expect(setFlight(docked, { mode: 'docked', station: 'systems' })).toBe(docked);

  expect(setFlight(docked, { mode: 'docked', station: 'contact' }).flight).toEqual({
    mode: 'docked',
    station: 'contact',
  });
});

caseTest('world.actions.visited.first-order', 'first-visit order is kept', () => {
  const state = addVisited(addVisited(addVisited(IDLE, 'systems'), 'contact'), 'home-base');

  expect(state.visited).toEqual(['systems', 'contact', 'home-base']);
});

caseTest('world.actions.visited.dedupe', 'a station counts once', () => {
  const once = addVisited(IDLE, 'home-base');

  expect(addVisited(once, 'home-base')).toBe(once);
  expect(once.visited).toEqual(['home-base']);
});

caseTest('world.actions.visited.count', 'Linked 4/9 after three further stations', () => {
  let state: WorldSnapshot = addVisited(IDLE, 'home-base');

  for (const id of ['full-cycle', 'systems', 'contact'] as const) {
    state = addVisited(state, id);
  }

  expect(state.visited).toHaveLength(4);
  expect(addVisited(state, 'systems').visited).toHaveLength(4);
});

caseTest('world.actions.input-used', 'input flag', () => {
  const used = markInputUsed(IDLE);

  expect(used.inputUsed).toBe(true);
  expect(markInputUsed(used)).toBe(used);
});

caseTest('world.actions.slow', 'slow flag', () => {
  const slow = markSlow(IDLE);

  expect(slow.slow).toBe(true);
  expect(markSlow(slow)).toBe(slow);
});

caseTest('world.actions.flash-send', 'send flash counts up', () => {
  expect(flashSend(IDLE).flash).toEqual({ seq: 1, kind: 'send' });
  expect(flashSend(takeOff(READY)).flash).toEqual({ seq: 2, kind: 'send' });
});

caseTest('world.actions.pure', 'inputs are never mutated', () => {
  const frozen: WorldSnapshot = Object.freeze({
    ...LOADING,
    flight: Object.freeze({ mode: 'free' } as const),
    boot: Object.freeze({ status: 'loading', worker: 0.5, engine: false } as const),
    visited: Object.freeze(['home-base'] as const),
    flash: Object.freeze({ seq: 1, kind: 'take-off' } as const),
  });

  const before: string = JSON.stringify(frozen);

  openText(frozen, 'visitor');
  openWorld(frozen);
  setWorldAvailable(frozen, true);
  startLoading(frozen);
  setWorkerProgress(frozen, 0.9);
  setEngineLoaded(frozen);
  markReady(frozen);
  takeOff({ ...frozen, boot: { status: 'ready' } });
  failWorld(frozen, 'timeout');
  setMenu(frozen, 'map');
  setSound(frozen, true);
  setFlight(frozen, { mode: 'docked', station: 'systems' });
  addVisited(frozen, 'systems');
  markInputUsed(frozen);
  markSlow(frozen);
  flashSend(frozen);

  expect(JSON.stringify(frozen)).toBe(before);
});
