import { failWorld, openText, openWorld, setWorldAvailable } from '@/core/world/world-actions';

import type { TextVersionSource } from '@/core/analytics/analytics';
import type { BootState, TextReason, WorldSnapshot } from '@/core/world/world.types';

export const LOADER_ESCAPE_MS = 12_000;

export const WATCHDOG_MS = 20_000;

export const IDLE_TIMEOUT_MS = 1500;

export const TEXT_HASH = '#text';

export const LOW_END_MEMORY_GB = 4;

export const LOW_END_MAX_CORES = 2;

export const LOADER_WEIGHTS = { worker: 0.6, engine: 0.25, built: 0.15 } as const;

export type CapabilityProbe = Readonly<{
  hash: string;
  sinceNavigationMs: number;
  webgl2: boolean;
  saveData: boolean | null;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
}>;

export type InitialView =
  | Readonly<{ view: 'world' }>
  | Readonly<{ view: 'text'; reason: TextReason; worldAvailable: boolean }>;

export type LoseContext = Readonly<{ loseContext: () => void }>;

export type ProbeContext = Readonly<{
  getExtension: (name: 'WEBGL_lose_context') => LoseContext | null;
}>;

export type ProbeCanvas = Readonly<{ getContext: (id: 'webgl2') => ProbeContext | null }>;

export type CapabilitySource = Readonly<{
  hash: string;
  now: () => number;
  navigator: unknown;
  createCanvas: () => ProbeCanvas;
}>;

export type LoaderStage = 'generating' | 'engine' | 'building' | 'ready';

export type LoaderStatus = Readonly<{
  stage: LoaderStage;
  progress: number;
  percent: number;
  ready: boolean;
}>;

const fieldOf = (source: unknown, key: string): unknown => {
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }

  return Reflect.get(source, key);
};

const reportedNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
};

export const probeWebgl2 = (createCanvas: () => ProbeCanvas): boolean => {
  try {
    const context = createCanvas().getContext('webgl2');

    if (context === null) {
      return false;
    }

    context.getExtension('WEBGL_lose_context')?.loseContext();

    return true;
  } catch {
    return false;
  }
};

export const readCapabilities = (source: CapabilitySource): CapabilityProbe => {
  const saveData: unknown = fieldOf(fieldOf(source.navigator, 'connection'), 'saveData');

  return {
    hash: source.hash,
    sinceNavigationMs: source.now(),
    webgl2: probeWebgl2(source.createCanvas),
    saveData: typeof saveData === 'boolean' ? saveData : null,
    deviceMemory: reportedNumber(fieldOf(source.navigator, 'deviceMemory')),
    hardwareConcurrency: reportedNumber(fieldOf(source.navigator, 'hardwareConcurrency')),
  };
};

export const isLowEnd = (probe: CapabilityProbe): boolean => {
  if (probe.saveData === true) {
    return true;
  }

  if (probe.deviceMemory !== null && probe.deviceMemory < LOW_END_MEMORY_GB) {
    return true;
  }

  return probe.hardwareConcurrency !== null && probe.hardwareConcurrency <= LOW_END_MAX_CORES;
};

export const decideInitialView = (probe: CapabilityProbe): InitialView => {
  if (probe.hash === TEXT_HASH) {
    return { view: 'text', reason: 'deep-link', worldAvailable: probe.webgl2 };
  }

  if (probe.sinceNavigationMs >= LOADER_ESCAPE_MS) {
    return { view: 'text', reason: 'escape', worldAvailable: probe.webgl2 };
  }

  if (!probe.webgl2) {
    return { view: 'text', reason: 'no-webgl2', worldAvailable: false };
  }

  if (isLowEnd(probe)) {
    return { view: 'text', reason: 'low-end', worldAvailable: true };
  }

  return { view: 'world' };
};

export const applyInitialView = (state: WorldSnapshot, decision: InitialView): WorldSnapshot => {
  if (state.view !== 'boot') {
    return state;
  }

  if (decision.view === 'world') {
    return setWorldAvailable(openWorld(state), true);
  }

  if (decision.reason === 'no-webgl2') {
    return failWorld(state, 'no-webgl2');
  }

  return setWorldAvailable(openText(state, decision.reason), decision.worldAvailable);
};

export const loaderStatus = (boot: BootState): LoaderStatus => {
  if (boot.status === 'ready' || boot.status === 'running') {
    return { stage: 'ready', progress: 1, percent: 100, ready: true };
  }

  if (boot.status !== 'loading') {
    return { stage: 'generating', progress: 0, percent: 0, ready: false };
  }

  const progress: number =
    LOADER_WEIGHTS.worker * boot.worker + (boot.engine ? LOADER_WEIGHTS.engine : 0);

  const stage: LoaderStage = boot.worker < 1 ? 'generating' : boot.engine ? 'building' : 'engine';

  return { stage, progress, percent: Math.round(progress * 100), ready: false };
};

export const textSourceFor = (reason: TextReason): TextVersionSource | null => {
  switch (reason) {
    case 'deep-link':
      return 'deep-link';
    case 'low-end':
      return 'low-end';
    case 'escape':
    case 'no-webgl2':
    case 'failed':
      return 'fallback';
    case 'visitor':
      return null;
  }
};

export const scheduleIdle = (run: () => void, timeout: number): (() => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    const handle: number = window.requestIdleCallback(run, { timeout });

    return () => {
      window.cancelIdleCallback(handle);
    };
  }

  const timer = window.setTimeout(run, 0);

  return () => {
    window.clearTimeout(timer);
  };
};
