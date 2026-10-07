'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';

import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { STATION_IDS } from '@/core/world/stations';
import { useWorld } from '@/core/world/use-world';
import { AUTOPILOT_MENU_ID } from '@/sections/world/world.constants';
import { autopilotAndClose } from '@/sections/world/hud/hud-actions';
import { VISITED_MARK } from '@/sections/world/hud/hud.constants';
import { useMenuFocus } from '@/sections/world/hud/use-menu-focus';

import type { StationId } from '@/core/world/stations';

const MENU_CLASS =
  'pixel-edge fixed right-4 top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-30 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-1 bg-panel p-3 shadow-[inset_0_0_0_2px_var(--color-edge)]';

const ITEM_CLASS =
  'flex cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-2.5 py-2 text-left font-pixel text-[0.95rem] text-text hover:bg-menu-hover focus-visible:bg-menu-hover coarse:py-3';

const moveFocus = (event: KeyboardEvent<HTMLElement>): void => {
  const items: readonly HTMLElement[] = [
    ...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ];

  const current: number = items.findIndex((item) => {
    return item === document.activeElement;
  });

  const last: number = items.length - 1;

  const next: Readonly<Record<string, number>> = {
    ArrowDown: current >= last ? 0 : current + 1,
    ArrowUp: current <= 0 ? last : current - 1,
    Home: 0,
    End: last,
  };

  const index: number | undefined = next[event.key];

  if (index === undefined) {
    return;
  }

  event.preventDefault();
  items[index]?.focus();
};

export const AutopilotMenu = (): ReactNode => {
  const open: boolean = useWorld((state) => {
    return state.menu === 'autopilot';
  });

  const visited: readonly StationId[] = useWorld((state) => {
    return state.visited;
  });

  const rootRef = useRef<HTMLDivElement>(null);

  useMenuFocus('autopilot', open, rootRef);

  return (
    <div
      ref={rootRef}
      id={AUTOPILOT_MENU_ID}
      role="menu"
      aria-label={WORLD_COPY.menus.autopilotTitle}
      hidden={!open}
      onKeyDown={moveFocus}
      className={MENU_CLASS}
    >
      <p aria-hidden="true" className="m-0 px-2.5 pb-1.5 font-pixel text-[0.85rem] text-muted">
        {WORLD_COPY.menus.autopilotTitle}
      </p>

      {STATION_IDS.map((id, index) => {
        const seen: boolean = visited.includes(id);

        return (
          <button
            key={id}
            type="button"
            role="menuitem"
            data-menu-station={id}
            className={ITEM_CLASS}
            onClick={() => {
              autopilotAndClose(id);
            }}
          >
            <span>{STATIONS_COPY[id].label}</span>

            {seen ? <span className="sr-only">{WORLD_COPY.menus.visited}</span> : null}

            <span aria-hidden="true" className={seen ? 'text-signal' : 'text-muted'}>
              {seen ? VISITED_MARK : String(index).padStart(2, '0')}
            </span>
          </button>
        );
      })}
    </div>
  );
};
