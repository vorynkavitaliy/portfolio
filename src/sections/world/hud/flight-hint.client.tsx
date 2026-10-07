'use client';

import type { ReactNode } from 'react';

import { WORLD_COPY } from '@/content/world.content';
import { useWorld } from '@/core/world/use-world';
import { useCoarsePointer } from '@/sections/world/hud/use-coarse-pointer';

const { hints } = WORLD_COPY.hud;

export const FlightHint = (): ReactNode => {
  const coarse: boolean = useCoarsePointer();

  const docked: boolean = useWorld((state) => {
    return state.flight.mode === 'docked';
  });

  const inputUsed: boolean = useWorld((state) => {
    return state.inputUsed;
  });

  const text: string = docked
    ? coarse
      ? hints.dockedTouch
      : hints.dockedKeyboard
    : coarse
      ? hints.touch
      : hints.keyboard;

  const visible: boolean = docked || !inputUsed;

  return (
    <p
      data-hint=""
      data-visible={visible ? 'true' : 'false'}
      className="m-0 max-w-[92vw] text-center font-pixel text-[0.95rem] text-text opacity-100 transition-opacity duration-400 [text-shadow:0_2px_0_var(--color-shadow)] data-[visible=false]:opacity-0 max-wide:text-[0.8rem]"
    >
      {text}
    </p>
  );
};
