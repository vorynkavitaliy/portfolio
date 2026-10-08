import { connection } from 'next/server';

import type { ReactNode } from 'react';

import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { STATION_IDS, type StationId } from '@/core/world/stations';
import { Contact } from '@/sections/contact/contact.component';
import { HomeBase } from '@/sections/home-base/home-base.component';
import { MissionBrief } from '@/sections/mission-brief/mission-brief.component';
import { Systems } from '@/sections/systems/systems.component';
import { StationFrame } from '@/sections/world/station-frame.client';
import { WorldShell, type WorldShellCopy } from '@/sections/world/world-shell.client';

const SHELL_COPY: WorldShellCopy = {
  loader: WORLD_COPY.loader,
  header: WORLD_COPY.header,
  notices: WORLD_COPY.notices,
};

const TAKE_OFF = { label: WORLD_COPY.panel.takeOff, keyHint: WORLD_COPY.panel.takeOffKey };

const STATION_LABELS: readonly string[] = STATION_IDS.map((id) => {
  return STATIONS_COPY[id].label;
});

const renderStation = (station: StationId): ReactNode => {
  switch (station) {
    case 'home-base':
      return <HomeBase />;
    case 'systems':
      return <Systems />;
    case 'contact':
      return <Contact />;
    case 'full-cycle':
    case 'frontend':
    case 'backend':
    case 'ai':
    case 'deploy':
    case 'this-world':
      return <MissionBrief station={station} />;
  }
};

export default async function HomePage() {
  await connection();

  return (
    <WorldShell
      copy={SHELL_COPY}
      stationLabels={STATION_LABELS}
      navTemplate={WORLD_COPY.navLabel}
      skyName={WORLD_COPY.skyName}
    >
      {STATION_IDS.map((station) => {
        return (
          <StationFrame key={station} station={station} takeOff={TAKE_OFF}>
            {renderStation(station)}
          </StationFrame>
        );
      })}
    </WorldShell>
  );
}
