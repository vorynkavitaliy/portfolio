import type { StationId } from '@/core/world/stations';
import type {
  FlightPhase,
  TextReason,
  WorldFailReason,
  WorldMenu,
  WorldSnapshot,
} from '@/core/world/world.types';

const sameFlight = (a: FlightPhase, b: FlightPhase): boolean => {
  if (a.mode !== b.mode) {
    return false;
  }

  if (a.mode === 'autopilot' && b.mode === 'autopilot') {
    return a.target === b.target;
  }

  if (a.mode === 'docked' && b.mode === 'docked') {
    return a.station === b.station;
  }

  return true;
};

export const openText = (state: WorldSnapshot, reason: TextReason): WorldSnapshot => {
  if (state.view === 'text' && state.textReason === reason && state.menu === 'none') {
    return state;
  }

  return { ...state, view: 'text', textReason: reason, menu: 'none' };
};

export const openWorld = (state: WorldSnapshot): WorldSnapshot => {
  if (state.view === 'world' && state.textReason === null) {
    return state;
  }

  return { ...state, view: 'world', textReason: null };
};

export const setWorldAvailable = (state: WorldSnapshot, available: boolean): WorldSnapshot => {
  if (state.worldAvailable === available) {
    return state;
  }

  return { ...state, worldAvailable: available };
};

export const startLoading = (state: WorldSnapshot): WorldSnapshot => {
  if (state.boot.status !== 'idle') {
    return state;
  }

  return { ...state, boot: { status: 'loading', worker: 0, engine: false } };
};

export const setWorkerProgress = (state: WorldSnapshot, value: number): WorldSnapshot => {
  if (state.boot.status !== 'loading') {
    return state;
  }

  const worker: number = Math.min(1, Math.max(0, value));

  if (worker === state.boot.worker) {
    return state;
  }

  return { ...state, boot: { ...state.boot, worker } };
};

export const setEngineLoaded = (state: WorldSnapshot): WorldSnapshot => {
  if (state.boot.status !== 'loading' || state.boot.engine) {
    return state;
  }

  return { ...state, boot: { ...state.boot, engine: true } };
};

export const markReady = (state: WorldSnapshot): WorldSnapshot => {
  if (state.boot.status !== 'loading') {
    return state;
  }

  return { ...state, boot: { status: 'ready' } };
};

export const takeOff = (state: WorldSnapshot): WorldSnapshot => {
  if (state.boot.status !== 'ready') {
    return state;
  }

  return {
    ...state,
    boot: { status: 'running' },
    flight: { mode: 'intro' },
    sound: true,
    menu: 'none',
    flash: { seq: (state.flash?.seq ?? 0) + 1, kind: 'take-off' },
  };
};

export const failWorld = (state: WorldSnapshot, reason: WorldFailReason): WorldSnapshot => {
  if (state.boot.status === 'failed') {
    return state;
  }

  return {
    ...state,
    boot: { status: 'failed', reason },
    view: 'text',
    textReason: reason === 'no-webgl2' ? 'no-webgl2' : 'failed',
    worldAvailable: false,
    menu: 'none',
  };
};

export const setMenu = (state: WorldSnapshot, menu: WorldMenu): WorldSnapshot => {
  if (state.menu === menu) {
    return state;
  }

  return { ...state, menu };
};

export const setSound = (state: WorldSnapshot, on: boolean): WorldSnapshot => {
  if (state.sound === on) {
    return state;
  }

  return { ...state, sound: on };
};

export const setFlight = (state: WorldSnapshot, phase: FlightPhase): WorldSnapshot => {
  if (sameFlight(state.flight, phase)) {
    return state;
  }

  return { ...state, flight: phase };
};

export const addVisited = (state: WorldSnapshot, id: StationId): WorldSnapshot => {
  if (state.visited.includes(id)) {
    return state;
  }

  return { ...state, visited: [...state.visited, id] };
};

export const markInputUsed = (state: WorldSnapshot): WorldSnapshot => {
  if (state.inputUsed) {
    return state;
  }

  return { ...state, inputUsed: true };
};

export const markSlow = (state: WorldSnapshot): WorldSnapshot => {
  if (state.slow) {
    return state;
  }

  return { ...state, slow: true };
};

export const flashSend = (state: WorldSnapshot): WorldSnapshot => {
  return { ...state, flash: { seq: (state.flash?.seq ?? 0) + 1, kind: 'send' } };
};
