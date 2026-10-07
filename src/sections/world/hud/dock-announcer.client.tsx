'use client';

import type { ReactNode } from 'react';

import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { fillTemplate } from '@/core/text/fill-template';
import { useWorld } from '@/core/world/use-world';

import type { StationId } from '@/core/world/stations';

export const DockAnnouncer = (): ReactNode => {
  const docked: StationId | null = useWorld((state) => {
    return state.flight.mode === 'docked' ? state.flight.station : null;
  });

  return (
    <div role="status" aria-live="polite" data-dock-announcer="" className="sr-only">
      {docked === null
        ? ''
        : fillTemplate(WORLD_COPY.announceDocked, { station: STATIONS_COPY[docked].label })}
    </div>
  );
};
