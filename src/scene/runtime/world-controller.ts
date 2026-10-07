import { stationAt, stationIndex } from '@/core/world/stations';
import {
  addVisited,
  flashSend,
  setFlight,
  takeOff as takeOffAction,
} from '@/core/world/world-actions';
import { applyDockingCommand } from '@/scene/flight/docking';
import { triggerDock, triggerSend } from '@/scene/runtime/effects';
import { SEND_CHIMES } from '@/scene/runtime/runtime.constants';

import type { AnalyticsEvent } from '@/core/analytics/analytics';
import type { WorldStore } from '@/core/world/world-store';
import type {
  FlightPhase,
  MapPoint,
  WorldCommand,
  WorldController,
} from '@/core/world/world.types';
import type {
  DockingCommand,
  DockingEvent,
  DockingState,
  PlaneState,
  Terrain,
  Vec3,
} from '@/scene/flight/flight.types';
import type { EffectsState } from '@/scene/runtime/runtime.types';

export type ControllerAudio = Readonly<{
  chime: (index: number, delay: number) => void;
  blip: (up: boolean) => void;
}>;

export type ControllerMap = Readonly<{
  draw: (canvas: HTMLCanvasElement) => void;
  pick: (point: MapPoint) => number | null;
}>;

export type WorldControllerDeps = Readonly<{
  store: WorldStore;
  docking: DockingState;
  plane: PlaneState;
  stations: readonly Readonly<Vec3>[];
  terrain: Terrain;
  effects: EffectsState;
  audio: ControllerAudio;
  track: (event: AnalyticsEvent) => void;
  reducedMotion: boolean;
  setBoostHeld: (held: boolean) => void;
  map: ControllerMap;
}>;

export type RuntimeController = Readonly<{
  controller: WorldController;
  applyEvent: (event: DockingEvent) => void;
  command: (command: DockingCommand) => void;
}>;

const FREE: FlightPhase = { mode: 'free' };

export const createWorldController = (deps: WorldControllerDeps): RuntimeController => {
  const { store, docking, plane, stations, terrain, effects, audio, reducedMotion } = deps;

  const setPhase = (phase: FlightPhase): void => {
    store.update((state) => {
      return setFlight(state, phase);
    });
  };

  const applyEvent = (event: DockingEvent): void => {
    if (event.type === 'docked') {
      const id = stationAt(event.station);

      if (id === null) {
        return;
      }

      store.update((state) => {
        return addVisited(setFlight(state, { mode: 'docked', station: id }), id);
      });

      if (!reducedMotion) {
        triggerDock(effects, event.station, stations);
      }

      audio.chime(event.station, 0);
      audio.blip(true);
      deps.track({ name: 'station_docked', station: id });

      return;
    }

    if (event.type === 'autopilot-started') {
      const id = stationAt(event.station);

      if (id !== null) {
        setPhase({ mode: 'autopilot', target: id });
      }

      return;
    }

    if (event.type === 'undocked') {
      audio.blip(false);
    }

    setPhase(FREE);
  };

  const command = (next: DockingCommand): void => {
    for (const event of applyDockingCommand(docking, next, plane, stations, terrain)) {
      applyEvent(event);
    }
  };

  const celebrate = (): void => {
    if (!reducedMotion) {
      triggerSend(effects, stations);
      store.update(flashSend);
    }

    for (const chime of SEND_CHIMES) {
      audio.chime(chime.index, chime.delay);
    }
  };

  const handle = (worldCommand: WorldCommand): void => {
    if (worldCommand.type === 'take-off') {
      if (store.getSnapshot().boot.status === 'ready') {
        store.update(takeOffAction);

        return;
      }

      command({ type: 'take-off' });

      return;
    }

    if (worldCommand.type === 'autopilot') {
      command({ type: 'autopilot', station: stationIndex(worldCommand.station) });

      return;
    }

    if (worldCommand.type === 'boost') {
      deps.setBoostHeld(worldCommand.held);

      return;
    }

    celebrate();
  };

  const controller: WorldController = {
    handle,
    drawMap: deps.map.draw,
    stationAtMap: (point) => {
      const index = deps.map.pick(point);

      return index === null ? null : stationAt(index);
    },
  };

  return { controller, applyEvent, command };
};
