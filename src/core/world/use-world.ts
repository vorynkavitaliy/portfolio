import { useSyncExternalStore } from 'react';

import { INITIAL_WORLD, worldStore, type WorldStore } from '@/core/world/world-store';
import type { WorldSnapshot } from '@/core/world/world.types';

export const useWorld = <T>(
  select: (state: WorldSnapshot) => T,
  store: WorldStore = worldStore,
): T => {
  return useSyncExternalStore(
    store.subscribe,
    () => {
      return select(store.getSnapshot());
    },
    () => {
      return select(INITIAL_WORLD);
    },
  );
};
