'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

import { track } from '@/core/analytics/analytics';
import { fillTemplate } from '@/core/text/fill-template';
import { useWorld } from '@/core/world/use-world';
import { openText, takeOff } from '@/core/world/world-actions';
import { worldStore } from '@/core/world/world-store';
import { loaderStatus } from '@/sections/world/boot';
import { LOADER_CELLS } from '@/sections/world/world.constants';

import type { WorldCopy } from '@/content/content.types';
import type { BootState } from '@/core/world/world.types';

type LoaderProps = Readonly<{ copy: WorldCopy['loader'] }>;

const CELLS: readonly number[] = Array.from({ length: LOADER_CELLS }, (_, index) => {
  return index;
});

const TAKE_OFF_CLASS =
  'pixel-edge inline-flex h-11 cursor-pointer items-center justify-center border-0 bg-signal px-5 font-pixel text-[1.05rem] text-on-signal shadow-[inset_0_-4px_0_rgb(0_0_0/0.28)] transition hover:brightness-105 active:translate-y-0.5 disabled:cursor-progress disabled:opacity-45';

const focusIsFree = (): boolean => {
  return document.activeElement === null || document.activeElement === document.body;
};

export const Loader = ({ copy }: LoaderProps): ReactNode => {
  const boot: BootState = useWorld((state) => {
    return state.boot;
  });

  const awaitingTakeOff: boolean = useWorld((state) => {
    return state.view === 'world' && state.boot.status === 'ready';
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const status = loaderStatus(boot);
  const lit: number = Math.round(status.progress * LOADER_CELLS);

  const progressText: string = fillTemplate(copy.progress, {
    stage: copy.stages[status.stage],
    percent: status.percent,
  });

  useEffect(() => {
    const button = buttonRef.current;

    if (awaitingTakeOff && button !== null && focusIsFree()) {
      button.focus({ preventScroll: true });
    }
  }, [awaitingTakeOff]);

  const handleTakeOff = (): void => {
    if (worldStore.getSnapshot().boot.status !== 'ready') {
      return;
    }

    worldStore.update(takeOff);
    track({ name: 'take_off' });
  };

  const handleText = (event: MouseEvent<HTMLAnchorElement>): void => {
    if (worldStore.getSnapshot().view === 'text') {
      event.preventDefault();

      return;
    }

    worldStore.update((state) => {
      return openText(state, 'visitor');
    });

    track({ name: 'text_version_opened', source: 'loader' });
  };

  return (
    <div
      data-loader=""
      className="loader fixed inset-0 z-40 grid place-items-center bg-[radial-gradient(120%_90%_at_50%_100%,var(--color-loader-top)_0%,var(--color-loader-bottom)_60%)] p-6"
    >
      <div className="grid w-[min(560px,100%)] justify-items-center gap-4.5 text-center">
        <p className="m-0 font-pixel text-[clamp(2rem,7vw,3.4rem)] leading-none tracking-[0.02em] text-white [text-shadow:0_4px_0_var(--color-shadow)]">
          {copy.name}
        </p>

        <p className="m-0 text-muted">{copy.line}</p>

        <div
          aria-hidden="true"
          className="grid w-full grid-cols-16 gap-0.75 bg-field p-1.25 shadow-[inset_0_0_0_2px_var(--color-edge-dim)] pixel-edge"
        >
          {CELLS.map((index) => {
            const on: boolean = index < lit;

            return (
              <i
                key={index}
                data-on={on ? '' : undefined}
                className="h-3.5 bg-load-off data-on:bg-load-on data-on:shadow-[inset_0_-3px_0_var(--color-load-on-shade)]"
              />
            );
          })}
        </div>

        <p aria-live="polite" className="m-0 font-pixel text-text">
          {progressText}
        </p>

        <button
          ref={buttonRef}
          type="button"
          disabled={!status.ready}
          data-magnet=""
          onClick={handleTakeOff}
          className={TAKE_OFF_CLASS}
        >
          {copy.takeOff}
        </button>

        <a
          href="#text"
          onClick={handleText}
          className="font-pixel text-[0.95rem] text-muted underline underline-offset-4"
        >
          {copy.textLink}
        </a>
      </div>
    </div>
  );
};
