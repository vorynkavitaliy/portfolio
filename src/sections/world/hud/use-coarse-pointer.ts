import { useSyncExternalStore } from 'react';

import { COARSE_POINTER_QUERY } from '@/sections/world/hud/hud.constants';

const subscribe = (listener: () => void): (() => void) => {
  const query: MediaQueryList = window.matchMedia(COARSE_POINTER_QUERY);

  query.addEventListener('change', listener);

  return () => {
    query.removeEventListener('change', listener);
  };
};

const read = (): boolean => {
  return window.matchMedia(COARSE_POINTER_QUERY).matches;
};

const readOnServer = (): boolean => {
  return false;
};

export const useCoarsePointer = (): boolean => {
  return useSyncExternalStore(subscribe, read, readOnServer);
};
