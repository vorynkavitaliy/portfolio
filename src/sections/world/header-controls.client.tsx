'use client';

import type { ReactNode } from 'react';

import { track } from '@/core/analytics/analytics';
import { useWorld } from '@/core/world/use-world';
import { openText, openWorld, setMenu, setSound } from '@/core/world/world-actions';
import { worldStore } from '@/core/world/world-store';
import { AUTOPILOT_MENU_ID, HEADER_ICONS, ROAD_MAP_ID } from '@/sections/world/world.constants';

import type { WorldCopy } from '@/content/content.types';
import type { WorldMenu } from '@/core/world/world.types';

type HeaderControlsProps = Readonly<{ copy: WorldCopy['header'] }>;

type Controls = 'none' | 'text' | 'world';

const HEADER_BUTTON =
  'pixel-edge inline-flex h-9.5 cursor-pointer items-center gap-2 border-0 bg-panel px-3.5 font-pixel text-[0.95rem] text-text shadow-edge-dim transition-[box-shadow,color] duration-140 hover:text-white hover:shadow-edge aria-expanded:text-white aria-expanded:shadow-edge aria-pressed:text-white aria-pressed:shadow-edge max-wide:px-2.5 coarse:h-11 coarse:min-w-11';

const LABEL = 'max-wide:sr-only';

const toggleMenu = (menu: Exclude<WorldMenu, 'none'>): void => {
  worldStore.update((state) => {
    return setMenu(state, state.menu === menu ? 'none' : menu);
  });
};

const openTextVersion = (): void => {
  worldStore.update((state) => {
    return openText(state, 'visitor');
  });

  track({ name: 'text_version_opened', source: 'toggle' });
};

const openWorldView = (): void => {
  worldStore.update(openWorld);
};

const toggleSound = (): void => {
  worldStore.update((state) => {
    return setSound(state, !state.sound);
  });
};

const toggleAutopilot = (): void => {
  toggleMenu('autopilot');
};

const toggleMap = (): void => {
  toggleMenu('map');
};

export const HeaderControls = ({ copy }: HeaderControlsProps): ReactNode => {
  const controls: Controls = useWorld((state) => {
    if (state.view === 'text') {
      return state.worldAvailable ? 'text' : 'none';
    }

    return state.view === 'world' && state.boot.status === 'running' ? 'world' : 'none';
  });

  const menu: WorldMenu = useWorld((state) => {
    return state.menu;
  });

  const sound: boolean = useWorld((state) => {
    return state.sound;
  });

  if (controls === 'none') {
    return null;
  }

  if (controls === 'text') {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" data-magnet="" onClick={openWorldView} className={HEADER_BUTTON}>
          <span aria-hidden="true">{HEADER_ICONS.view}</span>

          <span className={LABEL}>{copy.toWorld}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        data-magnet=""
        aria-expanded={menu === 'autopilot'}
        aria-controls={AUTOPILOT_MENU_ID}
        onClick={toggleAutopilot}
        className={HEADER_BUTTON}
      >
        <span aria-hidden="true">{HEADER_ICONS.autopilot}</span>

        <span className={LABEL}>{copy.autopilot}</span>
      </button>

      <button
        type="button"
        data-magnet=""
        aria-expanded={menu === 'map'}
        aria-controls={ROAD_MAP_ID}
        onClick={toggleMap}
        className={HEADER_BUTTON}
      >
        <span aria-hidden="true">{HEADER_ICONS.map}</span>

        <span className={LABEL}>{copy.map}</span>
      </button>

      <button type="button" data-magnet="" onClick={openTextVersion} className={HEADER_BUTTON}>
        <span aria-hidden="true">{HEADER_ICONS.view}</span>

        <span className={LABEL}>{copy.toText}</span>
      </button>

      <button
        type="button"
        data-magnet=""
        aria-pressed={sound}
        onClick={toggleSound}
        className={HEADER_BUTTON}
      >
        <span aria-hidden="true">{HEADER_ICONS.sound}</span>

        <span className={LABEL}>{sound ? copy.soundOn : copy.soundOff}</span>
      </button>
    </div>
  );
};
