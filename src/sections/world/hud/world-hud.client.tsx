'use client';

import type { ReactNode } from 'react';

import { useWorld } from '@/core/world/use-world';
import { AutopilotMenu } from '@/sections/world/hud/autopilot-menu.client';
import { BoostButton } from '@/sections/world/hud/boost-button.client';
import { DockAnnouncer } from '@/sections/world/hud/dock-announcer.client';
import { FlightHint } from '@/sections/world/hud/flight-hint.client';
import { Flash } from '@/sections/world/hud/flash.client';
import { Magnet } from '@/sections/world/hud/magnet.client';
import { PanelMotion } from '@/sections/world/hud/panel-motion.client';
import { RoadMap } from '@/sections/world/hud/road-map.client';
import { SlowPrompt } from '@/sections/world/hud/slow-prompt.client';
import { StationBar } from '@/sections/world/hud/station-bar.client';
import { TitleCard } from '@/sections/world/hud/title-card.client';
import { useWorldKeys } from '@/sections/world/hud/use-world-keys';

const RunningHud = (): ReactNode => {
  useWorldKeys();

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-10 flex flex-col items-center gap-2 px-4">
        <StationBar />

        <FlightHint />
      </div>

      <AutopilotMenu />

      <RoadMap />

      <BoostButton />

      <TitleCard />

      <Flash />

      <DockAnnouncer />

      <SlowPrompt />

      <PanelMotion />

      <Magnet />
    </>
  );
};

export const WorldHud = (): ReactNode => {
  const running: boolean = useWorld((state) => {
    return state.view === 'world' && state.boot.status === 'running';
  });

  return running ? <RunningHud /> : null;
};
