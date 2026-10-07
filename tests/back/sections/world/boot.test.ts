import { expect } from 'vitest';

import { caseTest } from '@tests/back/sections/world/boot.case-test';
import { INITIAL_WORLD } from '@/core/world/world-store';
import {
  applyInitialView,
  decideInitialView,
  IDLE_TIMEOUT_MS,
  LOADER_ESCAPE_MS,
  loaderStatus,
  probeWebgl2,
  readCapabilities,
  textSourceFor,
  WATCHDOG_MS,
} from '@/sections/world/boot';

import type { CapabilityProbe, ProbeCanvas, ProbeContext } from '@/sections/world/boot';
import type { WorldSnapshot } from '@/core/world/world.types';

const CAPABLE: CapabilityProbe = {
  hash: '',
  sinceNavigationMs: 100,
  webgl2: true,
  saveData: false,
  deviceMemory: 8,
  hardwareConcurrency: 8,
};

const probe = (change: Partial<CapabilityProbe>): CapabilityProbe => {
  return { ...CAPABLE, ...change };
};

const canvasWith = (context: ProbeContext | null, asked: string[]): ProbeCanvas => {
  return {
    getContext: (id) => {
      asked.push(id);

      return context;
    },
  };
};

caseTest('boot.constants', 'escape, watchdog and idle timeouts', () => {
  expect(LOADER_ESCAPE_MS).toBe(12_000);
  expect(WATCHDOG_MS).toBe(20_000);
  expect(IDLE_TIMEOUT_MS).toBe(1500);
});

caseTest('boot.view.default', 'a capable device gets the world', () => {
  expect(decideInitialView(CAPABLE)).toEqual({ view: 'world' });
});

caseTest('boot.view.deep-link', '#text opens the text version', () => {
  expect(decideInitialView(probe({ hash: '#text' }))).toEqual({
    view: 'text',
    reason: 'deep-link',
    worldAvailable: true,
  });

  expect(decideInitialView(probe({ hash: '#text', webgl2: false }))).toEqual({
    view: 'text',
    reason: 'deep-link',
    worldAvailable: false,
  });

  expect(decideInitialView(probe({ hash: '#contact' }))).toEqual({ view: 'world' });
});

caseTest('boot.view.escape', 'hydration after the CSS escape keeps the text version', () => {
  expect(decideInitialView(probe({ sinceNavigationMs: 12_000 }))).toEqual({
    view: 'text',
    reason: 'escape',
    worldAvailable: true,
  });

  expect(decideInitialView(probe({ sinceNavigationMs: 11_999 }))).toEqual({ view: 'world' });
});

caseTest('boot.view.no-webgl2', 'no WebGL2 opens text without the world', () => {
  expect(decideInitialView(probe({ webgl2: false }))).toEqual({
    view: 'text',
    reason: 'no-webgl2',
    worldAvailable: false,
  });
});

caseTest('boot.view.no-webgl2-before-low-end', 'the notice reason wins on weak devices', () => {
  expect(decideInitialView(probe({ webgl2: false, deviceMemory: 2, saveData: true }))).toEqual({
    view: 'text',
    reason: 'no-webgl2',
    worldAvailable: false,
  });
});

caseTest('boot.view.save-data', 'Save-Data defaults to text', () => {
  expect(decideInitialView(probe({ saveData: true }))).toEqual({
    view: 'text',
    reason: 'low-end',
    worldAvailable: true,
  });

  expect(decideInitialView(probe({ saveData: false }))).toEqual({ view: 'world' });
});

caseTest('boot.view.memory', 'under 4 GB defaults to text', () => {
  expect(decideInitialView(probe({ deviceMemory: 2 }))).toEqual({
    view: 'text',
    reason: 'low-end',
    worldAvailable: true,
  });

  expect(decideInitialView(probe({ deviceMemory: 4 }))).toEqual({ view: 'world' });
});

caseTest('boot.view.cores', 'two cores or fewer default to text', () => {
  expect(decideInitialView(probe({ hardwareConcurrency: 2 }))).toEqual({
    view: 'text',
    reason: 'low-end',
    worldAvailable: true,
  });

  expect(decideInitialView(probe({ hardwareConcurrency: 3 }))).toEqual({ view: 'world' });
});

caseTest('boot.view.unreported', 'unreported signals are ignored', () => {
  expect(
    decideInitialView(probe({ saveData: null, deviceMemory: null, hardwareConcurrency: null })),
  ).toEqual({ view: 'world' });
});

caseTest('boot.apply.world', 'world decision opens the world', () => {
  const next: WorldSnapshot = applyInitialView(INITIAL_WORLD, { view: 'world' });

  expect(next.view).toBe('world');
  expect(next.worldAvailable).toBe(true);
  expect(next.textReason).toBeNull();
  expect(next.boot).toEqual({ status: 'idle' });
});

caseTest('boot.apply.text', 'low-end decision opens text and offers the world', () => {
  const next: WorldSnapshot = applyInitialView(INITIAL_WORLD, {
    view: 'text',
    reason: 'low-end',
    worldAvailable: true,
  });

  expect(next.view).toBe('text');
  expect(next.textReason).toBe('low-end');
  expect(next.worldAvailable).toBe(true);
  expect(next.boot).toEqual({ status: 'idle' });
});

caseTest('boot.apply.no-webgl2', 'no WebGL2 fails the world', () => {
  const next: WorldSnapshot = applyInitialView(INITIAL_WORLD, {
    view: 'text',
    reason: 'no-webgl2',
    worldAvailable: false,
  });

  expect(next.boot).toEqual({ status: 'failed', reason: 'no-webgl2' });
  expect(next.view).toBe('text');
  expect(next.textReason).toBe('no-webgl2');
  expect(next.worldAvailable).toBe(false);
});

caseTest('boot.apply.once', 'a decided view is not decided again', () => {
  const decided: WorldSnapshot = { ...INITIAL_WORLD, view: 'text', textReason: 'visitor' };

  expect(applyInitialView(decided, { view: 'world' })).toBe(decided);

  expect(
    applyInitialView(decided, { view: 'text', reason: 'no-webgl2', worldAvailable: false }),
  ).toBe(decided);
});

caseTest('boot.probe.webgl2', 'probe asks for webgl2 and releases the context', () => {
  const asked: string[] = [];
  const released: string[] = [];

  const context: ProbeContext = {
    getExtension: (name) => {
      released.push(name);

      return {
        loseContext: () => {
          released.push('lost');
        },
      };
    },
  };

  expect(
    probeWebgl2(() => {
      return canvasWith(context, asked);
    }),
  ).toBe(true);

  expect(asked).toEqual(['webgl2']);
  expect(released).toEqual(['WEBGL_lose_context', 'lost']);
});

caseTest('boot.probe.missing', 'null context means no WebGL2', () => {
  const asked: string[] = [];

  expect(
    probeWebgl2(() => {
      return canvasWith(null, asked);
    }),
  ).toBe(false);

  expect(asked).toEqual(['webgl2']);
});

caseTest('boot.probe.throws', 'a throwing canvas means no WebGL2', () => {
  const throwing: ProbeCanvas = {
    getContext: () => {
      throw new Error('blocked');
    },
  };

  expect(
    probeWebgl2(() => {
      return throwing;
    }),
  ).toBe(false);

  expect(
    probeWebgl2(() => {
      throw new Error('no canvas');
    }),
  ).toBe(false);
});

caseTest('boot.read.navigator', 'navigator signals and absent values', () => {
  const asked: string[] = [];

  expect(
    readCapabilities({
      hash: '#text',
      now: () => {
        return 4321;
      },
      navigator: { connection: { saveData: true }, deviceMemory: 2, hardwareConcurrency: 6 },
      createCanvas: () => {
        return canvasWith(null, asked);
      },
    }),
  ).toEqual({
    hash: '#text',
    sinceNavigationMs: 4321,
    webgl2: false,
    saveData: true,
    deviceMemory: 2,
    hardwareConcurrency: 6,
  });

  expect(
    readCapabilities({
      hash: '',
      now: () => {
        return 0;
      },
      navigator: { connection: { saveData: 'yes' }, deviceMemory: '8', hardwareConcurrency: 0 },
      createCanvas: () => {
        return canvasWith(null, asked);
      },
    }),
  ).toMatchObject({ saveData: null, deviceMemory: null, hardwareConcurrency: null });

  expect(
    readCapabilities({
      hash: '',
      now: () => {
        return 0;
      },
      navigator: {},
      createCanvas: () => {
        return canvasWith(null, asked);
      },
    }),
  ).toMatchObject({ saveData: null, deviceMemory: null, hardwareConcurrency: null });
});

caseTest('boot.loader.idle', 'nothing loaded yet', () => {
  expect(loaderStatus({ status: 'idle' })).toEqual({
    stage: 'generating',
    progress: 0,
    percent: 0,
    ready: false,
  });
});

caseTest('boot.loader.worker', 'half the worker', () => {
  const status = loaderStatus({ status: 'loading', worker: 0.5, engine: false });

  expect(status.stage).toBe('generating');
  expect(status.progress).toBeCloseTo(0.3, 10);
  expect(status.percent).toBe(30);
  expect(status.ready).toBe(false);
});

caseTest('boot.loader.engine', 'worker done, engine pending', () => {
  const status = loaderStatus({ status: 'loading', worker: 1, engine: false });

  expect(status.stage).toBe('engine');
  expect(status.percent).toBe(60);
});

caseTest('boot.loader.engine-first', 'engine before the worker', () => {
  const status = loaderStatus({ status: 'loading', worker: 0.5, engine: true });

  expect(status.stage).toBe('generating');
  expect(status.percent).toBe(55);
});

caseTest('boot.loader.building', 'worker and engine done', () => {
  const status = loaderStatus({ status: 'loading', worker: 1, engine: true });

  expect(status.stage).toBe('building');
  expect(status.percent).toBe(85);
  expect(status.ready).toBe(false);
});

caseTest('boot.loader.ready', 'ready and running are complete', () => {
  const complete = { stage: 'ready', progress: 1, percent: 100, ready: true };

  expect(loaderStatus({ status: 'ready' })).toEqual(complete);
  expect(loaderStatus({ status: 'running' })).toEqual(complete);
});

caseTest('boot.text-source', 'analytics source per text reason', () => {
  expect(textSourceFor('deep-link')).toBe('deep-link');
  expect(textSourceFor('low-end')).toBe('low-end');
  expect(textSourceFor('escape')).toBe('fallback');
  expect(textSourceFor('no-webgl2')).toBe('fallback');
  expect(textSourceFor('failed')).toBe('fallback');
  expect(textSourceFor('visitor')).toBeNull();
});
