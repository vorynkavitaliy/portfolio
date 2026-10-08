import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { FLAT, STATIONS, planeAt } from '@tests/back/scene/flight/integrate.fixtures';
import { createWorldStore, INITIAL_WORLD } from '@/core/world/world-store';
import { createDocking } from '@/scene/flight/docking';
import { createEffects } from '@/scene/runtime/effects';
import { createWorldController } from '@/scene/runtime/world-controller';

import type { AnalyticsEvent } from '@/core/analytics/analytics';
import type { BootState, WorldSnapshot } from '@/core/world/world.types';

type Chime = Readonly<{ index: number; delay: number }>;

const setup = (
  options: Readonly<{ reducedMotion?: boolean; boot?: BootState; pick?: number | null }> = {},
) => {
  const initial: WorldSnapshot = {
    ...INITIAL_WORLD,
    view: 'world',
    boot: options.boot ?? { status: 'running' },
  };

  const store = createWorldStore(initial);
  const docking = createDocking();
  const home = STATIONS[0] ?? { x: 0, y: 0, z: 0 };
  const plane = planeAt(home.x, home.y + 10, home.z + 13);
  const effects = createEffects();
  const chimes: Chime[] = [];
  const blips: boolean[] = [];
  const events: AnalyticsEvent[] = [];
  const boosts: boolean[] = [];

  const runtime = createWorldController({
    store,
    docking,
    plane,
    stations: STATIONS,
    terrain: FLAT,
    effects,
    audio: {
      chime: (index, delay) => {
        chimes.push({ index, delay });
      },
      blip: (up) => {
        blips.push(up);
      },
    },
    track: (event) => {
      events.push(event);
    },
    reducedMotion: options.reducedMotion ?? false,
    setBoostHeld: (held) => {
      boosts.push(held);
    },
    map: {
      draw: () => {},
      pick: () => {
        return options.pick ?? null;
      },
    },
  });

  return { store, docking, plane, effects, chimes, blips, events, boosts, runtime };
};

caseTest('controller.dock.store', 'docking writes flight and visited', () => {
  const { store, runtime } = setup();

  runtime.applyEvent({ type: 'docked', station: 2, firstVisit: true });
  expect(store.getSnapshot().flight).toEqual({ mode: 'docked', station: 'frontend' });
  expect(store.getSnapshot().visited).toEqual(['frontend']);
});

caseTest('controller.dock.track-once', 'one analytics event per docking', () => {
  const { events, runtime } = setup();

  runtime.applyEvent({ type: 'docked', station: 2, firstVisit: true });
  expect(events).toEqual([{ name: 'station_docked', station: 'frontend' }]);
});

caseTest('controller.dock.effects', 'dock pulse on the docked beam', () => {
  const { effects, runtime } = setup();

  runtime.applyEvent({ type: 'docked', station: 2, firstVisit: true });
  expect(effects.beamBoost[2]).toBeCloseTo(2.6, 6);
  expect(effects.shake).toBe(0.35);
});

caseTest('controller.dock.reduced', 'no pulse under reduced motion', () => {
  const { effects, chimes, runtime } = setup({ reducedMotion: true });

  runtime.applyEvent({ type: 'docked', station: 2, firstVisit: true });
  expect(effects).toEqual(createEffects());
  expect(chimes).toEqual([{ index: 2, delay: 0 }]);
});

caseTest('controller.dock.sound', 'chime and rising blip', () => {
  const { chimes, blips, runtime } = setup();

  runtime.applyEvent({ type: 'docked', station: 2, firstVisit: true });
  expect(chimes).toEqual([{ index: 2, delay: 0 }]);
  expect(blips).toEqual([true]);
});

caseTest('controller.take-off.ready', 'loader take-off starts the world with sound', () => {
  const { store, runtime } = setup({ boot: { status: 'ready' } });

  runtime.controller.handle({ type: 'take-off' });

  const state = store.getSnapshot();

  expect(state.boot).toEqual({ status: 'running' });
  expect(state.sound).toBe(true);
  expect(state.flight).toEqual({ mode: 'intro' });
});

caseTest('controller.take-off.undock', 'panel take-off leaves Home', () => {
  const { store, docking, blips, runtime } = setup();

  runtime.command({ type: 'intro-done' });
  expect(store.getSnapshot().flight).toEqual({ mode: 'docked', station: 'home-base' });
  runtime.controller.handle({ type: 'take-off' });
  expect(docking.mode).toEqual({ kind: 'free' });
  expect(store.getSnapshot().flight).toEqual({ mode: 'free' });
  expect(blips).toEqual([true, false]);
});

caseTest('controller.autopilot.mapping', 'station id to index and back', () => {
  const { store, docking, runtime } = setup();

  runtime.command({ type: 'intro-done' });
  runtime.controller.handle({ type: 'autopilot', station: 'contact' });
  expect(docking.mode).toEqual({ kind: 'autopilot', target: 8 });
  expect(store.getSnapshot().flight).toEqual({ mode: 'autopilot', target: 'contact' });
});

caseTest('controller.autopilot.before-intro', 'ignored during the intro', () => {
  const { store, docking, runtime } = setup();
  const before = store.getSnapshot();

  runtime.controller.handle({ type: 'autopilot', station: 'contact' });
  expect(docking.mode).toEqual({ kind: 'intro' });
  expect(store.getSnapshot()).toBe(before);
});

caseTest('controller.send.flash', 'celebration at Contact', () => {
  const { store, effects, chimes, runtime } = setup();

  runtime.controller.handle({ type: 'celebrate-send' });
  expect(store.getSnapshot().flash).toEqual({ seq: 1, kind: 'send' });
  expect(effects.beamBoost[8]).toBe(5);

  expect(chimes).toEqual([
    { index: 0, delay: 0 },
    { index: 2, delay: 0.12 },
    { index: 4, delay: 0.24 },
  ]);
});

caseTest('controller.send.reduced', 'no flash or pulse under reduced motion', () => {
  const { store, effects, chimes, runtime } = setup({ reducedMotion: true });

  runtime.controller.handle({ type: 'celebrate-send' });
  expect(store.getSnapshot().flash).toBeNull();
  expect(effects).toEqual(createEffects());
  expect(chimes).toHaveLength(3);
});

caseTest('controller.boost', 'boost reaches the input', () => {
  const { boosts, runtime } = setup();

  runtime.controller.handle({ type: 'boost', held: true });
  runtime.controller.handle({ type: 'boost', held: false });
  expect(boosts).toEqual([true, false]);
});

caseTest('controller.reset', 'reset frees the plane', () => {
  const { store, runtime } = setup();

  runtime.applyEvent({ type: 'docked', station: 3, firstVisit: true });
  runtime.applyEvent({ type: 'reset' });
  expect(store.getSnapshot().flight).toEqual({ mode: 'free' });
});

caseTest('controller.map.pick', 'map index to station id', () => {
  expect(setup({ pick: 8 }).runtime.controller.stationAtMap({ u: 0.5, v: 0.5 })).toBe('contact');
  expect(setup({ pick: null }).runtime.controller.stationAtMap({ u: 0.5, v: 0.5 })).toBeNull();
});
