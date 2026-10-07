'use client';

import type { ReactNode } from 'react';

import { useWorld } from '@/core/world/use-world';
import { useGSAP } from '@/motion/gsap.client';
import { playPanelEntrance } from '@/motion/panel-entrance';
import { DOCKED_PANEL_SELECTOR } from '@/sections/world/hud/hud.constants';

import type { StationId } from '@/core/world/stations';

export const PanelMotion = (): ReactNode => {
  const docked: StationId | null = useWorld((state) => {
    return state.flight.mode === 'docked' ? state.flight.station : null;
  });

  useGSAP(
    () => {
      if (docked === null) {
        return;
      }

      const panel = document.querySelector<HTMLElement>(DOCKED_PANEL_SELECTOR);

      if (panel !== null) {
        playPanelEntrance(panel);
      }
    },
    { dependencies: [docked], revertOnUpdate: true },
  );

  return null;
};
