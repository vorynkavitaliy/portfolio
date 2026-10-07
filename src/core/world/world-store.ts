import type { WorldCommand, WorldController, WorldSnapshot } from '@/core/world/world.types';

export const INITIAL_WORLD: WorldSnapshot = {
  view: 'boot',
  textReason: null,
  worldAvailable: false,
  boot: { status: 'idle' },
  flight: { mode: 'intro' },
  visited: [],
  sound: false,
  inputUsed: false,
  menu: 'none',
  slow: false,
  flash: null,
};

export type WorldStore = Readonly<{
  getSnapshot: () => WorldSnapshot;
  subscribe: (listener: () => void) => () => void;
  update: (change: (state: WorldSnapshot) => WorldSnapshot) => void;
  setController: (controller: WorldController | null) => void;
  controller: () => WorldController | null;
  dispatch: (command: WorldCommand) => boolean;
}>;

export const createWorldStore = (initial: WorldSnapshot = INITIAL_WORLD): WorldStore => {
  let snapshot: WorldSnapshot = initial;
  let activeController: WorldController | null = null;
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const update = (change: (state: WorldSnapshot) => WorldSnapshot): void => {
    const next: WorldSnapshot = change(snapshot);

    if (next === snapshot) {
      return;
    }

    snapshot = next;

    for (const listener of [...listeners]) {
      listener();
    }
  };

  const dispatch = (command: WorldCommand): boolean => {
    if (activeController === null) {
      return false;
    }

    activeController.handle(command);

    return true;
  };

  return {
    getSnapshot: () => {
      return snapshot;
    },
    subscribe,
    update,
    setController: (controller) => {
      activeController = controller;
    },
    controller: () => {
      return activeController;
    },
    dispatch,
  };
};

export const worldStore: WorldStore = createWorldStore();
