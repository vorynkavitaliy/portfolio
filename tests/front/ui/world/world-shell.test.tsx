import { useEffect, type ComponentType, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/world/world-shell.case-test';
import { ANALYTICS_EVENT } from '@/core/analytics/analytics';
import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { STATION_IDS } from '@/core/world/stations';
import {
  addVisited,
  failWorld,
  markReady,
  openText,
  setFlight,
  takeOff,
} from '@/core/world/world-actions';
import { INITIAL_WORLD, worldStore } from '@/core/world/world-store';
import { LOADER_ESCAPE_MS } from '@/sections/world/boot';
import { WorldShell, type WorldShellCopy } from '@/sections/world/world-shell.client';

import type { WorldSnapshot } from '@/core/world/world.types';
import type { WorldStageProps } from '@/scene/scene-loader.client';
import type { WorldData, WorldRequest } from '@/scene/world/world.types';

const mocks = vi.hoisted(() => {
  return {
    startWorldGeneration:
      vi.fn<(request: WorldRequest, onProgress: (value: number) => void) => Promise<WorldData>>(),
    loadWorldStage: vi.fn<() => Promise<ComponentType<WorldStageProps>>>(),
  };
});

vi.mock('@/scene/scene-loader.client', () => {
  return {
    startWorldGeneration: mocks.startWorldGeneration,
    loadWorldStage: mocks.loadWorldStage,
  };
});

vi.mock('@/sections/world/hud/world-hud.client', async () => {
  const { createElement } = await import('react');

  return {
    WorldHud: (): ReactNode => {
      return createElement('div', { 'data-fake-hud': '' });
    },
  };
});

const COPY: WorldShellCopy = {
  loader: WORLD_COPY.loader,
  header: WORLD_COPY.header,
  notices: WORLD_COPY.notices,
};

const LABELS: readonly string[] = STATION_IDS.map((id) => {
  return STATIONS_COPY[id].label;
});

const TAKE_OFF = { name: WORLD_COPY.loader.takeOff, exact: true } as const;

type StageLog = { mounts: number; unmounts: number; props: WorldStageProps | null };

const stageLog: StageLog = { mounts: 0, unmounts: 0, props: null };

const FakeStage = (props: WorldStageProps): ReactNode => {
  useEffect(() => {
    stageLog.props = props;
  }, [props]);

  useEffect(() => {
    stageLog.mounts += 1;

    return () => {
      stageLog.unmounts += 1;
    };
  }, []);

  return <div data-fake-stage="" />;
};

const realNow = performance.now.bind(performance);

let generation: PromiseWithResolvers<WorldData>;
let stageChunk: PromiseWithResolvers<ComponentType<WorldStageProps>>;
let events: unknown[];

let progress: (value: number) => void = () => {
  return undefined;
};

const recordEvent = (event: Event): void => {
  if (event instanceof CustomEvent) {
    events.push(event.detail);
  }
};

const defineNavigator = (key: string, value: unknown): void => {
  Object.defineProperty(navigator, key, { configurable: true, value });
};

const setState = (change: (state: WorldSnapshot) => WorldSnapshot): void => {
  worldStore.update(change);
};

const state = (): WorldSnapshot => {
  return worldStore.getSnapshot();
};

beforeEach(() => {
  events = [];
  stageLog.mounts = 0;
  stageLog.unmounts = 0;
  stageLog.props = null;
  generation = Promise.withResolvers<WorldData>();
  stageChunk = Promise.withResolvers<ComponentType<WorldStageProps>>();
  mocks.startWorldGeneration.mockReset();
  mocks.loadWorldStage.mockReset();

  mocks.startWorldGeneration.mockImplementation((_request, onProgress) => {
    progress = onProgress;

    return generation.promise;
  });

  mocks.loadWorldStage.mockReturnValue(stageChunk.promise);

  setState(() => {
    return INITIAL_WORLD;
  });

  worldStore.setController(null);
  defineNavigator('deviceMemory', 8);
  defineNavigator('hardwareConcurrency', 8);
  defineNavigator('connection', { saveData: false });

  const start: number = realNow();

  vi.spyOn(performance, 'now').mockImplementation(() => {
    return realNow() - start;
  });

  window.addEventListener(ANALYTICS_EVENT, recordEvent);
});

afterEach(() => {
  window.removeEventListener(ANALYTICS_EVENT, recordEvent);
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'deviceMemory');
  Reflect.deleteProperty(navigator, 'hardwareConcurrency');
  Reflect.deleteProperty(navigator, 'connection');
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  worldStore.setController(null);

  setState(() => {
    return INITIAL_WORLD;
  });
});

const shell = (): ReactNode => {
  return (
    <WorldShell
      copy={COPY}
      stationLabels={LABELS}
      navTemplate={WORLD_COPY.navLabel}
      skyName={WORLD_COPY.skyName}
    >
      <section id="home-base" data-station="home-base">
        <h2>Home base</h2>
      </section>
    </WorldShell>
  );
};

const expectRealWebgl2 = (): void => {
  const context = document.createElement('canvas').getContext('webgl2');

  expect(context).not.toBeNull();
  context?.getExtension('WEBGL_lose_context')?.loseContext();
};

const disableWebgl2 = (): void => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  expect(document.createElement('canvas').getContext('webgl2')).toBeNull();
};

const loaderElement = (): HTMLElement | null => {
  return document.querySelector<HTMLElement>('[data-loader]');
};

const isDisplayed = (element: Element | null): boolean => {
  if (element === null) {
    return false;
  }

  const style = getComputedStyle(element);

  return style.display !== 'none' && style.visibility !== 'hidden';
};

const litCells = (): number => {
  return document.querySelectorAll('[data-loader] [data-on]').length;
};

const renderLoading = async () => {
  expectRealWebgl2();

  const screen = await render(shell());

  await expect
    .poll(() => {
      return mocks.startWorldGeneration.mock.calls.length;
    })
    .toBe(1);

  return screen;
};

const renderReady = async () => {
  const screen = await renderLoading();

  progress(1);
  stageChunk.resolve(FakeStage);
  await expect.element(screen.getByText('Building scene 85%')).toBeVisible();
  setState(markReady);
  await expect.element(screen.getByRole('button', TAKE_OFF)).toBeEnabled();

  return screen;
};

const renderRunning = async () => {
  const screen = await renderReady();

  await screen.getByRole('button', TAKE_OFF).click();

  await expect
    .poll(() => {
      return state().boot.status;
    })
    .toBe('running');

  return screen;
};

const textEvents = (): unknown[] => {
  return events.filter((event) => {
    return (
      typeof event === 'object' &&
      event !== null &&
      Reflect.get(event, 'name') === 'text_version_opened'
    );
  });
};

const headerButtons = (): number => {
  return document.querySelectorAll('header button').length;
};

caseTest('shell.ssr.boot', 'server render is the boot state', () => {
  setState((current) => {
    return takeOff(
      markReady({
        ...current,
        view: 'world',
        boot: { status: 'loading', worker: 1, engine: true },
      }),
    );
  });

  const html: string = renderToString(shell());
  const page = new DOMParser().parseFromString(html, 'text/html');
  const root = page.querySelector('[data-view]');

  expect(root?.getAttribute('data-view')).toBe('boot');
  expect(root?.getAttribute('data-boot')).toBe('idle');
  expect(page.querySelector('main#text [data-station="home-base"]')).not.toBeNull();

  const loader = page.querySelector('div.loader[data-loader]');

  expect(loader?.textContent).toContain(WORLD_COPY.loader.name);
  expect(loader?.textContent).toContain(WORLD_COPY.loader.line);
  expect(loader?.textContent).toContain('Generating world 0%');
  expect(loader?.querySelector('button')?.hasAttribute('disabled')).toBe(true);
  expect(loader?.querySelector('button')?.textContent).toBe(WORLD_COPY.loader.takeOff);
  expect(loader?.querySelector('a[href="#text"]')?.textContent).toBe(WORLD_COPY.loader.textLink);

  expect(page.querySelector('header a[href="#home-base"]')?.textContent).toBe(
    WORLD_COPY.header.brand,
  );

  expect(page.querySelectorAll('header button')).toHaveLength(0);
});

caseTest('shell.world.start', 'capable device starts loading on idle', async () => {
  const idle = vi.spyOn(window, 'requestIdleCallback');
  const screen = await renderLoading();

  expect(screen.container.querySelector('[data-view]')?.getAttribute('data-view')).toBe('world');
  expect(isDisplayed(loaderElement())).toBe(true);
  expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 1500 });
  expect(mocks.startWorldGeneration).toHaveBeenCalledTimes(1);
  expect(mocks.startWorldGeneration.mock.calls[0]?.[0]).toEqual({ skyName: WORLD_COPY.skyName });
  expect(mocks.loadWorldStage).toHaveBeenCalledTimes(1);
});

caseTest('shell.progress', 'progress label, percent and cells', async () => {
  const screen = await renderLoading();

  progress(0.5);
  await expect.element(screen.getByText('Generating world 30%')).toBeVisible();
  expect(litCells()).toBe(5);
  progress(1);
  stageChunk.resolve(FakeStage);
  await expect.element(screen.getByText('Building scene 85%')).toBeVisible();
  expect(litCells()).toBe(14);
});

caseTest('shell.take-off.disabled', 'Take off waits for ready', async () => {
  const screen = await renderLoading();

  await expect.element(screen.getByRole('button', TAKE_OFF)).toBeDisabled();
  progress(1);
  stageChunk.resolve(FakeStage);
  await expect.element(screen.getByText('Building scene 85%')).toBeVisible();
  await expect.element(screen.getByRole('button', TAKE_OFF)).toBeDisabled();
  setState(markReady);
  await expect.element(screen.getByRole('button', TAKE_OFF)).toBeEnabled();
  await expect.element(screen.getByText('World ready 100%')).toBeVisible();
});

caseTest('shell.take-off.focus', 'focus moves to Take off from body', async () => {
  const screen = await renderLoading();

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  expect(document.activeElement).toBe(document.body);
  setState(markReady);
  await expect.element(screen.getByRole('button', TAKE_OFF)).toHaveFocus();
});

caseTest('shell.take-off.focus-kept', 'focus elsewhere is not stolen', async () => {
  const screen = await renderLoading();
  const link = screen.getByRole('link', { name: WORLD_COPY.loader.textLink, exact: true });

  link.element().focus();
  await expect.element(link).toHaveFocus();
  setState(markReady);
  await expect.element(screen.getByRole('button', TAKE_OFF)).toBeEnabled();
  await expect.element(link).toHaveFocus();
});

caseTest('shell.take-off.click', 'Take off starts the world with sound', async () => {
  const screen = await renderRunning();

  expect(state().sound).toBe(true);
  expect(screen.container.querySelector('[data-view]')?.getAttribute('data-boot')).toBe('running');

  expect(
    events.filter((event) => {
      return (
        typeof event === 'object' && event !== null && Reflect.get(event, 'name') === 'take_off'
      );
    }),
  ).toEqual([{ name: 'take_off' }]);

  expect(isDisplayed(loaderElement())).toBe(false);
  expect(headerButtons()).toBe(4);
});

caseTest('shell.take-off.gesture', 'sound is on inside the click task', async () => {
  const screen = await renderReady();
  const seen: string[] = [];

  const onClick = (): void => {
    seen.push(`${state().boot.status}:${String(state().sound)}`);
  };

  document.addEventListener('click', onClick);
  await screen.getByRole('button', TAKE_OFF).click();
  document.removeEventListener('click', onClick);
  expect(seen).toEqual(['running:true']);
});

caseTest('shell.text-link', 'loader link opens the text version', async () => {
  const screen = await renderLoading();

  await screen.getByRole('link', { name: WORLD_COPY.loader.textLink, exact: true }).click();

  await expect
    .poll(() => {
      return state().view;
    })
    .toBe('text');

  expect(textEvents()).toEqual([{ name: 'text_version_opened', source: 'loader' }]);
  expect(isDisplayed(loaderElement())).toBe(false);
  expect(isDisplayed(document.querySelector('main#text'))).toBe(true);
});

caseTest('shell.controls.hidden', 'no world buttons before Take off', async () => {
  const screen = await renderLoading();

  expect(headerButtons()).toBe(0);

  await expect
    .element(screen.getByRole('link', { name: WORLD_COPY.header.brand, exact: true }))
    .toBeVisible();

  setState(markReady);
  await expect.element(screen.getByRole('button', TAKE_OFF)).toBeEnabled();
  expect(headerButtons()).toBe(0);
});

caseTest('shell.controls.text', 'text view offers the world after the brand', async () => {
  defineNavigator('deviceMemory', 2);

  const screen = await render(shell());
  const toggle = screen.getByRole('button', { name: WORLD_COPY.header.toWorld, exact: true });

  await expect.element(toggle).toBeVisible();
  expect(headerButtons()).toBe(1);
  await expect.element(toggle).not.toHaveAttribute('aria-pressed');

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  await userEvent.tab();

  await expect
    .element(screen.getByRole('link', { name: WORLD_COPY.header.brand, exact: true }))
    .toHaveFocus();

  await userEvent.tab();
  await expect.element(toggle).toHaveFocus();
});

caseTest('shell.controls.unavailable', 'no toggle when the world cannot run', async () => {
  disableWebgl2();
  await render(shell());

  await expect
    .poll(() => {
      return state().view;
    })
    .toBe('text');

  expect(headerButtons()).toBe(0);
});

caseTest('shell.controls.running', 'four world buttons', async () => {
  const screen = await renderRunning();
  const autopilot = screen.getByRole('button', { name: WORLD_COPY.header.autopilot, exact: true });
  const map = screen.getByRole('button', { name: WORLD_COPY.header.map, exact: true });
  const toText = screen.getByRole('button', { name: WORLD_COPY.header.toText, exact: true });

  await expect.element(autopilot).toHaveAttribute('aria-expanded', 'false');
  await expect.element(autopilot).toHaveAttribute('aria-controls', 'autopilot-menu');
  await expect.element(map).toHaveAttribute('aria-expanded', 'false');
  await expect.element(map).toHaveAttribute('aria-controls', 'road-map');
  await expect.element(toText).not.toHaveAttribute('aria-pressed');

  await expect
    .element(screen.getByRole('button', { name: WORLD_COPY.header.soundOn, exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
});

caseTest('shell.menu', 'menu buttons open one menu at a time', async () => {
  const screen = await renderRunning();
  const autopilot = screen.getByRole('button', { name: WORLD_COPY.header.autopilot, exact: true });
  const map = screen.getByRole('button', { name: WORLD_COPY.header.map, exact: true });

  await autopilot.click();
  expect(state().menu).toBe('autopilot');
  await expect.element(autopilot).toHaveAttribute('aria-expanded', 'true');
  await map.click();
  expect(state().menu).toBe('map');
  await expect.element(map).toHaveAttribute('aria-expanded', 'true');
  await expect.element(autopilot).toHaveAttribute('aria-expanded', 'false');
  await map.click();
  expect(state().menu).toBe('none');
  await expect.element(map).toHaveAttribute('aria-expanded', 'false');
});

caseTest('shell.sound', 'sound toggle label and pressed state', async () => {
  const screen = await renderRunning();
  const on = screen.getByRole('button', { name: WORLD_COPY.header.soundOn, exact: true });

  await expect.element(on).toHaveAttribute('aria-pressed', 'true');
  await on.click();
  expect(state().sound).toBe(false);

  const off = screen.getByRole('button', { name: WORLD_COPY.header.soundOff, exact: true });

  await expect.element(off).toHaveAttribute('aria-pressed', 'false');
  await off.click();
  expect(state().sound).toBe(true);

  await expect
    .element(screen.getByRole('button', { name: WORLD_COPY.header.soundOn, exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
});

caseTest('shell.view-switch', 'text and back keeps the world', async () => {
  const screen = await renderRunning();

  setState((current) => {
    return addVisited(
      addVisited(setFlight(current, { mode: 'docked', station: 'systems' }), 'home-base'),
      'systems',
    );
  });

  await screen.getByRole('button', { name: WORLD_COPY.header.toText, exact: true }).click();
  expect(state().view).toBe('text');
  expect(textEvents()).toEqual([{ name: 'text_version_opened', source: 'toggle' }]);
  await screen.getByRole('button', { name: WORLD_COPY.header.toWorld, exact: true }).click();
  expect(state().view).toBe('world');
  expect(state().boot).toEqual({ status: 'running' });
  expect(state().flight).toEqual({ mode: 'docked', station: 'systems' });
  expect(state().visited).toEqual(['home-base', 'systems']);
  expect(stageLog.mounts).toBe(1);
  expect(stageLog.unmounts).toBe(0);
  expect(textEvents()).toHaveLength(1);
});

caseTest('shell.notice.no-webgl2', 'no WebGL2 opens text with a notice', async () => {
  disableWebgl2();

  const screen = await render(shell());

  await expect.element(screen.getByText(WORLD_COPY.notices.noWebgl2)).toBeVisible();
  expect(state().view).toBe('text');
  expect(textEvents()).toEqual([{ name: 'text_version_opened', source: 'fallback' }]);
  expect(mocks.startWorldGeneration).not.toHaveBeenCalled();
  expect(mocks.loadWorldStage).not.toHaveBeenCalled();
  expect(headerButtons()).toBe(0);
});

caseTest('shell.notice.failed', 'runtime failure opens text with a notice', async () => {
  const screen = await renderLoading();

  stageChunk.resolve(FakeStage);

  await expect
    .poll(() => {
      return stageLog.mounts;
    })
    .toBe(1);

  setState((current) => {
    return failWorld(current, 'renderer-failed');
  });

  await expect.element(screen.getByText(WORLD_COPY.notices.failed)).toBeVisible();
  expect(state().view).toBe('text');
  expect(document.querySelector('[data-fake-stage]')).toBeNull();
  expect(stageLog.unmounts).toBe(1);
});

caseTest('shell.watchdog', 'a stalled load times out', async () => {
  const timers = vi.spyOn(window, 'setTimeout');
  const screen = await renderLoading();

  const watchdog = timers.mock.calls.find((call) => {
    return call[1] === 20_000;
  });

  expect(watchdog).toBeDefined();

  const handler = watchdog?.[0];

  if (typeof handler === 'function') {
    handler();
  }

  await expect.element(screen.getByText(WORLD_COPY.notices.failed)).toBeVisible();
  expect(state().boot).toEqual({ status: 'failed', reason: 'timeout' });
  expect(state().view).toBe('text');
});

caseTest('shell.watchdog.cleared', 'ready clears the watchdog', async () => {
  const timers = vi.spyOn(window, 'setTimeout');
  const clears = vi.spyOn(window, 'clearTimeout');

  await renderLoading();

  const index: number = timers.mock.calls.findIndex((call) => {
    return call[1] === 20_000;
  });

  expect(index).toBeGreaterThanOrEqual(0);

  const id: unknown = timers.mock.results[index]?.value;

  expect(clears).not.toHaveBeenCalledWith(id);
  setState(markReady);

  await expect
    .poll(() => {
      return clears.mock.calls.some((call) => {
        return call[0] === id;
      });
    })
    .toBe(true);
});

caseTest('shell.chunk-failed', 'a rejected stage chunk falls back', async () => {
  const screen = await renderLoading();

  stageChunk.reject(new Error('chunk'));
  await expect.element(screen.getByText(WORLD_COPY.notices.failed)).toBeVisible();
  expect(state().boot).toEqual({ status: 'failed', reason: 'chunk-failed' });
  expect(state().view).toBe('text');
  expect(textEvents()).toEqual([{ name: 'text_version_opened', source: 'fallback' }]);
});

caseTest('shell.worker-failed', 'a failed generation falls back', async () => {
  const screen = await renderLoading();

  generation.reject(new Error('worker-failed'));
  await expect.element(screen.getByText(WORLD_COPY.notices.failed)).toBeVisible();
  expect(state().boot).toEqual({ status: 'failed', reason: 'worker-failed' });
  expect(state().view).toBe('text');
});

caseTest('shell.deep-link', '#text opens text first', async () => {
  history.replaceState(null, '', '#text');

  const screen = await render(shell());

  await expect
    .poll(() => {
      return state().view;
    })
    .toBe('text');

  expect(state().textReason).toBe('deep-link');
  expect(textEvents()).toEqual([{ name: 'text_version_opened', source: 'deep-link' }]);
  expect(mocks.startWorldGeneration).not.toHaveBeenCalled();
  await screen.getByRole('button', { name: WORLD_COPY.header.toWorld, exact: true }).click();
  expect(state().view).toBe('world');

  await expect
    .poll(() => {
      return mocks.startWorldGeneration.mock.calls.length;
    })
    .toBe(1);
});

caseTest('shell.low-end', 'low-end defaults to text and opts into the world', async () => {
  defineNavigator('deviceMemory', 2);

  const screen = await render(shell());

  await expect
    .poll(() => {
      return state().view;
    })
    .toBe('text');

  expect(state().textReason).toBe('low-end');
  expect(textEvents()).toEqual([{ name: 'text_version_opened', source: 'low-end' }]);
  expect(mocks.startWorldGeneration).not.toHaveBeenCalled();
  expect(isDisplayed(loaderElement())).toBe(false);
  await screen.getByRole('button', { name: WORLD_COPY.header.toWorld, exact: true }).click();
  expect(state().view).toBe('world');
  expect(isDisplayed(loaderElement())).toBe(true);

  await expect
    .poll(() => {
      return mocks.startWorldGeneration.mock.calls.length;
    })
    .toBe(1);
});

caseTest('shell.stage-props', 'stage receives generation, labels and template', async () => {
  await renderLoading();
  stageChunk.resolve(FakeStage);

  await expect
    .poll(() => {
      return stageLog.mounts;
    })
    .toBe(1);

  expect(stageLog.props?.generation).toBe(generation.promise);

  expect(stageLog.props?.labels).toEqual(
    STATION_IDS.map((id) => {
      return STATIONS_COPY[id].label;
    }),
  );

  expect(stageLog.props?.navTemplate).toBe(WORLD_COPY.navLabel);
});

caseTest('shell.hud-world-only', 'HUD only in world view', async () => {
  await renderReady();

  await expect
    .poll(() => {
      return document.querySelector('[data-fake-hud]');
    })
    .not.toBeNull();

  setState((current) => {
    return openText(current, 'visitor');
  });

  await expect
    .poll(() => {
      return document.querySelector('[data-fake-hud]');
    })
    .toBeNull();
});

caseTest('shell.escape-css', 'CSS escape equals LOADER_ESCAPE_MS', () => {
  const raw: string = getComputedStyle(document.documentElement)
    .getPropertyValue('--loader-escape')
    .trim();

  const match = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(raw);

  expect(match).not.toBeNull();

  const amount = Number(match?.[1]);
  const ms: number = match?.[2] === 's' ? amount * 1000 : amount;

  expect(ms).toBe(LOADER_ESCAPE_MS);
});
