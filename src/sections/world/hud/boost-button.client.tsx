'use client';

import { useEffect, type ReactNode } from 'react';

import { WORLD_COPY } from '@/content/world.content';
import { useWorld } from '@/core/world/use-world';
import { worldStore } from '@/core/world/world-store';

const setBoost = (held: boolean): void => {
  worldStore.dispatch({ type: 'boost', held });
};

const press = (): void => {
  setBoost(true);
};

const release = (): void => {
  setBoost(false);
};

export const BoostButton = (): ReactNode => {
  const flying: boolean = useWorld((state) => {
    return state.flight.mode !== 'docked';
  });

  useEffect(() => {
    if (!flying) {
      return;
    }

    return release;
  }, [flying]);

  if (!flying) {
    return null;
  }

  return (
    <button
      type="button"
      data-boost=""
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-10 hidden h-14 min-w-24 touch-none items-center justify-center border-0 bg-signal px-4 font-pixel text-[1.05rem] text-on-signal shadow-[inset_0_-4px_0_rgb(0_0_0/0.28)] select-none pixel-edge active:translate-y-0.5 coarse:inline-flex"
    >
      {WORLD_COPY.hud.boost}
    </button>
  );
};
