import { expect, vi } from 'vitest';

import { caseTest } from '@tests/back/core/world/world-store.case-test';
import { createWorldStore, INITIAL_WORLD } from '@/core/world/world-store';
import type { WorldController, WorldSnapshot } from '@/core/world/world.types';

const withSound = (state: WorldSnapshot): WorldSnapshot => {
  return { ...state, sound: true };
};

const makeController = (): { controller: WorldController; handle: ReturnType<typeof vi.fn> } => {
  const handle = vi.fn();

  return {
    handle,
    controller: {
      handle,
      drawMap: () => {
        return undefined;
      },
      stationAtMap: () => {
        return null;
      },
    },
  };
};

caseTest('world.store.initial.visited-empty', 'no station is visited at start', () => {
  expect(INITIAL_WORLD.visited).toEqual([]);
});

caseTest('world.store.initial.sound-off', 'sound starts off', () => {
  expect(INITIAL_WORLD.sound).toBe(false);
});

caseTest('world.store.initial.seed', 'a seed snapshot is used as given', () => {
  const seed: WorldSnapshot = { ...INITIAL_WORLD, sound: true };

  expect(createWorldStore(seed).getSnapshot()).toBe(seed);
});

caseTest('world.store.snapshot-stable', 'getSnapshot is cached between updates', () => {
  const store = createWorldStore();

  expect(store.getSnapshot()).toBe(store.getSnapshot());
});

caseTest(
  'world.store.notify-sync',
  'listener runs before update returns and sees the new state',
  () => {
    const store = createWorldStore();
    const seen: boolean[] = [];

    store.subscribe(() => {
      seen.push(store.getSnapshot().sound);
    });

    store.update(withSound);

    expect(seen).toEqual([true]);
  },
);

caseTest('world.store.same-object-silent', 'returning the same object notifies nobody', () => {
  const store = createWorldStore();
  const listener = vi.fn();
  store.subscribe(listener);

  store.update((state) => {
    return state;
  });

  expect(listener).not.toHaveBeenCalled();
});

caseTest('world.store.new-object-notifies-once', 'every listener fires once per change', () => {
  const store = createWorldStore();
  const first = vi.fn();
  const second = vi.fn();
  store.subscribe(first);
  store.subscribe(second);

  store.update(withSound);

  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot().sound).toBe(true);
});

caseTest('world.store.listener-order', 'listeners run in subscription order inside update', () => {
  const store = createWorldStore();
  const order: string[] = [];

  store.subscribe(() => {
    order.push('first');
  });

  store.subscribe(() => {
    order.push('second');
  });

  store.update(withSound);
  order.push('after-update');

  expect(order).toEqual(['first', 'second', 'after-update']);
});

caseTest('world.store.unsubscribe', 'an unsubscribed listener stays silent', () => {
  const store = createWorldStore();
  const listener = vi.fn();
  const stop = store.subscribe(listener);

  stop();
  store.update(withSound);

  expect(listener).not.toHaveBeenCalled();
});

caseTest('world.store.dispatch-no-controller', 'dispatch reports that nobody listens', () => {
  const store = createWorldStore();

  expect(store.dispatch({ type: 'take-off' })).toBe(false);
});

caseTest('world.store.dispatch-controller', 'the controller receives the command', () => {
  const store = createWorldStore();
  const { controller, handle } = makeController();
  store.setController(controller);

  expect(store.dispatch({ type: 'autopilot', station: 'systems' })).toBe(true);
  expect(handle).toHaveBeenCalledTimes(1);
  expect(handle).toHaveBeenCalledWith({ type: 'autopilot', station: 'systems' });
});

caseTest('world.store.controller-cleared', 'clearing the controller stops delivery', () => {
  const store = createWorldStore();
  const { controller, handle } = makeController();

  expect(store.controller()).toBeNull();

  store.setController(controller);
  expect(store.controller()).toBe(controller);

  store.setController(null);
  expect(store.controller()).toBeNull();
  expect(store.dispatch({ type: 'boost', held: true })).toBe(false);
  expect(handle).not.toHaveBeenCalled();
});

caseTest('world.store.isolated', 'stores do not share state or listeners', () => {
  const one = createWorldStore();
  const two = createWorldStore();
  const listener = vi.fn();
  two.subscribe(listener);

  one.update(withSound);

  expect(two.getSnapshot().sound).toBe(false);
  expect(listener).not.toHaveBeenCalled();
});
