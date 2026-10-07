'use client';

import type { ReactNode } from 'react';

import type { StationId } from '@/core/world/stations';
import { useWorld } from '@/core/world/use-world';
import { worldStore } from '@/core/world/world-store';

type StationFrameProps = Readonly<{
  station: StationId;
  takeOff: Readonly<{ label: string; keyHint: string }>;
  children: ReactNode;
}>;

export const StationFrame = ({ station, takeOff, children }: StationFrameProps) => {
  const inWorld: boolean = useWorld((state) => {
    return state.view === 'world';
  });

  const docked: boolean = useWorld((state) => {
    return (
      state.view === 'world' && state.flight.mode === 'docked' && state.flight.station === station
    );
  });

  const handleTakeOff = (): void => {
    worldStore.dispatch({ type: 'take-off' });
  };

  return (
    <section
      id={station}
      data-station={station}
      aria-labelledby={`${station}-title`}
      data-docked={docked ? '' : undefined}
      inert={inWorld && !docked}
      className="relative pixel-edge"
    >
      <span
        data-motion="wipe"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] origin-left scale-x-0 bg-signal"
      />

      {inWorld ? (
        <button
          type="button"
          onClick={handleTakeOff}
          className="-mt-2 mr-0 mb-3.5 ml-auto block h-6.5 cursor-pointer border-0 bg-surface px-2.5 font-pixel text-[0.8rem] text-signal shadow-[inset_0_0_0_1px_var(--color-signal)] hover:bg-disc-hover"
        >
          <span>{takeOff.label}</span>

          <span aria-hidden="true" className="ml-1 coarse:hidden">
            ({takeOff.keyHint})
          </span>
        </button>
      ) : null}

      {children}
    </section>
  );
};
