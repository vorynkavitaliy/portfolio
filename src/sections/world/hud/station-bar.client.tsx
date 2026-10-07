'use client';

import type { ReactNode } from 'react';

import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { fillTemplate } from '@/core/text/fill-template';
import { STATION_IDS } from '@/core/world/stations';
import { useWorld } from '@/core/world/use-world';
import { autopilotTo } from '@/sections/world/hud/hud-actions';

import type { StationId } from '@/core/world/stations';

const CELL_CLASS =
  'relative block h-3.5 w-7 cursor-pointer overflow-hidden border-0 bg-bar-off p-0 aria-[current=true]:shadow-[0_0_0_2px_var(--color-signal)] coarse:h-5 coarse:w-9';

export const StationBar = (): ReactNode => {
  const visited: readonly StationId[] = useWorld((state) => {
    return state.visited;
  });

  const here: StationId | null = useWorld((state) => {
    return state.flight.mode === 'docked' ? state.flight.station : null;
  });

  return (
    <div className="pointer-events-auto flex items-center gap-3">
      <div
        role="group"
        aria-label={WORLD_COPY.hud.barLabel}
        className="flex gap-1 bg-panel p-1.5 pixel-edge"
      >
        {STATION_IDS.map((id) => {
          return (
            <button
              key={id}
              type="button"
              data-station-cell={id}
              aria-label={fillTemplate(WORLD_COPY.hud.barCell, {
                station: STATIONS_COPY[id].label,
              })}
              aria-current={here === id ? 'true' : undefined}
              className={CELL_CLASS}
              onClick={() => {
                autopilotTo(id);
              }}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 origin-left bg-signal ${visited.includes(id) ? 'scale-x-100' : 'scale-x-0'}`}
              />
            </button>
          );
        })}
      </div>

      <p className="m-0 font-pixel text-[0.95rem] text-text [text-shadow:0_2px_0_var(--color-shadow)]">
        {fillTemplate(WORLD_COPY.hud.linked, { n: visited.length, total: STATION_IDS.length })}
      </p>
    </div>
  );
};
