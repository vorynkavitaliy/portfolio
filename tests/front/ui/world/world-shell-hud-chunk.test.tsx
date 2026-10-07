import { beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/world/world-shell.case-test';
import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { STATION_IDS } from '@/core/world/stations';
import { INITIAL_WORLD, worldStore } from '@/core/world/world-store';
import { WorldShell } from '@/sections/world/world-shell.client';

import type { ComponentType } from 'react';
import type { WorldStageProps } from '@/scene/scene-loader.client';
import type { WorldData } from '@/scene/world/world.types';

const mocks = vi.hoisted(() => {
  return {
    startWorldGeneration: vi.fn<() => Promise<WorldData>>(),
    loadWorldStage: vi.fn<() => Promise<ComponentType<WorldStageProps>>>(),
  };
});

vi.mock('@/scene/scene-loader.client', () => {
  return {
    startWorldGeneration: mocks.startWorldGeneration,
    loadWorldStage: mocks.loadWorldStage,
  };
});

vi.mock('@/sections/world/hud/world-hud.client', () => {
  return {
    get WorldHud() {
      throw new Error('hud-chunk');
    },
  };
});

beforeEach(() => {
  mocks.startWorldGeneration.mockReturnValue(
    new Promise<WorldData>(() => {
      return undefined;
    }),
  );

  mocks.loadWorldStage.mockReturnValue(
    new Promise<ComponentType<WorldStageProps>>(() => {
      return undefined;
    }),
  );

  worldStore.update(() => {
    return INITIAL_WORLD;
  });

  worldStore.setController(null);
  Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
});

caseTest('shell.hud-chunk-failed', 'a rejected HUD chunk falls back', async () => {
  const screen = await render(
    <WorldShell
      copy={{
        loader: WORLD_COPY.loader,
        header: WORLD_COPY.header,
        notices: WORLD_COPY.notices,
      }}
      stationLabels={STATION_IDS.map((id) => {
        return STATIONS_COPY[id].label;
      })}
      navTemplate={WORLD_COPY.navLabel}
      skyName={WORLD_COPY.skyName}
    >
      <section id="home-base" data-station="home-base">
        <h2>Home base</h2>
      </section>
    </WorldShell>,
  );

  await expect.element(screen.getByText(WORLD_COPY.notices.failed)).toBeVisible();
  expect(worldStore.getSnapshot().boot).toEqual({ status: 'failed', reason: 'chunk-failed' });
  expect(worldStore.getSnapshot().view).toBe('text');
  await expect.element(screen.getByRole('heading', { name: 'Home base' })).toBeVisible();
});
