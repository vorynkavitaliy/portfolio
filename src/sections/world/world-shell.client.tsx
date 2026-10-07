'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';

import { track } from '@/core/analytics/analytics';
import { useWorld } from '@/core/world/use-world';
import {
  failWorld,
  setEngineLoaded,
  setWorkerProgress,
  startLoading,
} from '@/core/world/world-actions';
import { worldStore } from '@/core/world/world-store';
import { loadWorldStage, startWorldGeneration } from '@/scene/scene-loader.client';
import {
  applyInitialView,
  decideInitialView,
  IDLE_TIMEOUT_MS,
  readCapabilities,
  scheduleIdle,
  textSourceFor,
  WATCHDOG_MS,
} from '@/sections/world/boot';
import { HeaderControls } from '@/sections/world/header-controls.client';
import { Loader } from '@/sections/world/loader.client';
import { Notice } from '@/sections/world/notice.client';
import { StationLink } from '@/shared/station-link.client';

import type { WorldCopy } from '@/content/content.types';
import type { BootState, WorldFailReason, WorldView } from '@/core/world/world.types';
import type { WorldStageProps } from '@/scene/scene-loader.client';

export type WorldShellCopy = Readonly<{
  loader: WorldCopy['loader'];
  header: WorldCopy['header'];
  notices: WorldCopy['notices'];
}>;

type WorldShellProps = Readonly<{
  copy: WorldShellCopy;
  stationLabels: readonly string[];
  navTemplate: string;
  skyName: readonly string[];
  children: ReactNode;
}>;

type StageComponent = ComponentType<WorldStageProps>;

type Generation = WorldStageProps['generation'];

export const loadWorldHud = async (): Promise<ComponentType> => {
  const hud = await import('@/sections/world/hud/world-hud.client');

  return hud.WorldHud;
};

const fail = (reason: WorldFailReason): void => {
  worldStore.update((state) => {
    return failWorld(state, reason);
  });
};

const createProbeCanvas = (): HTMLCanvasElement => {
  return document.createElement('canvas');
};

const decideOnHydration = (): void => {
  const decision = decideInitialView(
    readCapabilities({
      hash: window.location.hash,
      now: () => {
        return performance.now();
      },
      navigator: window.navigator,
      createCanvas: createProbeCanvas,
    }),
  );

  worldStore.update((state) => {
    return applyInitialView(state, decision);
  });
};

const trackAutomaticTextOpen = (): (() => void) => {
  let previous = worldStore.getSnapshot();

  return worldStore.subscribe(() => {
    const next = worldStore.getSnapshot();
    const opened: boolean = previous.view !== 'text' && next.view === 'text';

    previous = next;

    if (!opened || next.textReason === null) {
      return;
    }

    const source = textSourceFor(next.textReason);

    if (source !== null) {
      track({ name: 'text_version_opened', source });
    }
  });
};

export const WorldShell = ({
  copy,
  stationLabels,
  navTemplate,
  skyName,
  children,
}: WorldShellProps): ReactNode => {
  const view: WorldView = useWorld((state) => {
    return state.view;
  });

  const bootStatus: BootState['status'] = useWorld((state) => {
    return state.boot.status;
  });

  const [generation, setGeneration] = useState<Generation | null>(null);
  const [Stage, setStage] = useState<StageComponent | null>(null);
  const [Hud, setHud] = useState<ComponentType | null>(null);

  useEffect(() => {
    return trackAutomaticTextOpen();
  }, []);

  useEffect(() => {
    decideOnHydration();
  }, []);

  useEffect(() => {
    if (view !== 'world' || bootStatus !== 'idle') {
      return;
    }

    return scheduleIdle(() => {
      worldStore.update(startLoading);

      const started: Generation = startWorldGeneration({ skyName }, (value) => {
        worldStore.update((state) => {
          return setWorkerProgress(state, value);
        });
      });

      started.catch(() => {
        fail('worker-failed');
      });

      setGeneration(started);

      loadWorldStage().then(
        (component) => {
          worldStore.update(setEngineLoaded);

          setStage(() => {
            return component;
          });
        },
        () => {
          fail('chunk-failed');
        },
      );

      loadWorldHud().then(
        (component) => {
          setHud(() => {
            return component;
          });
        },
        () => {
          fail('chunk-failed');
        },
      );
    }, IDLE_TIMEOUT_MS);
  }, [view, bootStatus, skyName]);

  useEffect(() => {
    if (bootStatus !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => {
      fail('timeout');
    }, WATCHDOG_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [bootStatus]);

  return (
    <div data-view={view} data-boot={bootStatus}>
      <header className="pointer-events-none fixed inset-x-4 top-[calc(16px+env(safe-area-inset-top,0px))] z-20 flex items-center justify-between gap-2 *:pointer-events-auto">
        <StationLink
          station="home-base"
          className="font-pixel text-[1.125rem] font-semibold tracking-[0.04em] text-text no-underline [text-shadow:0_2px_0_var(--color-shadow)]"
        >
          {copy.header.brand}
        </StationLink>

        <HeaderControls copy={copy.header} />
      </header>

      <main id="text">
        <Notice copy={copy.notices} />

        {children}
      </main>

      <Loader copy={copy.loader} />

      {Stage !== null && generation !== null && bootStatus !== 'failed' ? (
        <div className="hidden world:block">
          <Stage generation={generation} labels={stationLabels} navTemplate={navTemplate} />
        </div>
      ) : null}

      {Hud !== null && view === 'world' && bootStatus !== 'failed' ? <Hud /> : null}
    </div>
  );
};
