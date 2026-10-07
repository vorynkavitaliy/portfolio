import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/flight/docking.case-test';
import {
  CLIFF,
  FLAT,
  planeAt,
  stationAt,
  STATIONS,
  STEP_60,
} from '@tests/back/scene/flight/integrate.fixtures';
import { controlFor, createControl } from '@/scene/flight/control';
import {
  applyDockingCommand,
  createDocking,
  resetDocking,
  stepDocking,
} from '@/scene/flight/docking';
import { stepPlane } from '@/scene/flight/integrate';
import { placeOnOrbit } from '@/scene/flight/plane';

import type { DockingEvent, DockingState, PlaneState, Steer } from '@/scene/flight/flight.types';

const NO_STEER: Steer = { turn: 0, climb: 0, magnitude: 0, boost: false };
const FULL_STEER: Steer = { turn: 1, climb: 1, magnitude: Math.SQRT2, boost: true };

const homeOrbit = (): PlaneState => {
  const plane = planeAt(0, 0, 0);

  placeOnOrbit(plane, stationAt(0), 0.75 * Math.PI);

  return plane;
};

const nearStation = (plane: PlaneState, index: number, distance: number): void => {
  const station = stationAt(index);

  plane.pos.x = station.x - distance;
  plane.pos.y = station.y + 10;
  plane.pos.z = station.z;
};

const afterIntro = (plane: PlaneState): DockingState => {
  const state = createDocking();

  applyDockingCommand(state, { type: 'intro-done' }, plane, STATIONS, FLAT);

  return state;
};

const dockedAt = (index: number): Readonly<{ state: DockingState; plane: PlaneState }> => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);
  nearStation(plane, index, 5);
  stepDocking(state, plane, NO_STEER, STATIONS, FLAT);

  return { state, plane };
};

const visitedCount = (mask: number): number => {
  let count = 0;

  for (let index = 0; index < STATIONS.length; index += 1) {
    count += (mask >> index) & 1;
  }

  return count;
};

caseTest('docking.create', 'initial docking state', () => {
  expect(createDocking()).toEqual({
    mode: { kind: 'intro' },
    orbitSide: 1,
    cooldown: 0,
    visited: 0,
    introDone: false,
  });
});

caseTest('docking.intro.never-docks', 'nothing docks during the intro', () => {
  const state = createDocking();
  const plane = planeAt(stationAt(3).x, 20, stationAt(3).z);

  for (let step = 0; step < 100; step += 1) {
    expect(stepDocking(state, plane, FULL_STEER, STATIONS, FLAT)).toBeNull();
  }

  expect(state.mode).toEqual({ kind: 'intro' });
  expect(state.visited).toBe(0);

  resetDocking(state, plane, STATIONS);
  plane.pos.x = stationAt(3).x;
  plane.pos.z = stationAt(3).z;

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toBeNull();
  expect(state.mode).toEqual({ kind: 'free' });
});

caseTest('docking.intro-done.docks-home', 'the intro ends docked at Home', () => {
  const plane = homeOrbit();
  const state = createDocking();

  expect(applyDockingCommand(state, { type: 'intro-done' }, plane, STATIONS, FLAT)).toEqual([
    { type: 'docked', station: 0, firstVisit: true },
  ]);

  expect(state.introDone).toBe(true);
  expect(state.visited).toBe(1);
  expect(visitedCount(state.visited)).toBe(1);
  expect(state.orbitSide).toBe(1);

  expect(state.mode).toEqual({
    kind: 'docked',
    station: 0,
    dock: { x: -27.11522368914976, y: 18, z: 22.115223689149765 },
  });
});

caseTest('docking.free.link-range', 'free flight docks within 15 blocks', () => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);

  const station = stationAt(2);

  plane.pos.x = station.x + 15;
  plane.pos.y = station.y + 60;
  plane.pos.z = station.z;
  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toBeNull();

  plane.pos.x = station.x + 14.9;

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toEqual({
    type: 'docked',
    station: 2,
    firstVisit: true,
  });

  expect(state.mode.kind).toBe('docked');
});

caseTest('docking.dock-point', 'the hover point next to the beacon', () => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, CLIFF);
  plane.pos.x = 13.5;
  plane.pos.y = 25;
  plane.pos.z = -55.5;
  plane.yaw = 2;

  expect(stepDocking(state, plane, NO_STEER, STATIONS, CLIFF)).toEqual({
    type: 'docked',
    station: 3,
    firstVisit: true,
  });

  expect(state.mode).toEqual({
    kind: 'docked',
    station: 3,
    dock: { x: 12.346153846153847, y: 44, z: -52.73076923076923 },
  });

  expect(state.orbitSide).toBe(-1);
});

caseTest('docking.dock-point.degenerate', 'a plane right over the beacon', () => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);
  plane.pos.x = stationAt(4).x;
  plane.pos.y = 30;
  plane.pos.z = stationAt(4).z;
  stepDocking(state, plane, NO_STEER, STATIONS, FLAT);

  expect(state.mode).toEqual({
    kind: 'docked',
    station: 4,
    dock: { x: 26.5, y: 17, z: -9.5 },
  });
});

caseTest('docking.autopilot.passes-non-target', 'autopilot flies past other beacons', () => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'autopilot', station: 5 }, plane, STATIONS, FLAT);
  nearStation(plane, 2, 1);

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toBeNull();
  expect(state.mode).toEqual({ kind: 'autopilot', target: 5 });
});

caseTest('docking.autopilot.target-docks', 'autopilot docks at its target', () => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'autopilot', station: 5 }, plane, STATIONS, FLAT);
  nearStation(plane, 5, 10);

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toEqual({
    type: 'docked',
    station: 5,
    firstVisit: true,
  });
});

caseTest('docking.docked.ignores-steer', 'steering does not undock', () => {
  const { state, plane } = dockedAt(2);
  const mode = state.mode;

  for (let step = 0; step < 30; step += 1) {
    expect(stepDocking(state, plane, FULL_STEER, STATIONS, FLAT)).toBeNull();
  }

  expect(state.mode).toBe(mode);
  expect(state.mode.kind).toBe('docked');
});

caseTest('docking.takeoff', 'take-off returns to free flight', () => {
  const { state, plane } = dockedAt(2);

  expect(applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT)).toEqual([
    { type: 'undocked', station: 2 },
  ]);

  expect(state.mode).toEqual({ kind: 'free' });
  expect(state.cooldown).toBe(1 << 2);
});

caseTest('docking.takeoff.cooldown', 'no re-dock until 24 blocks away', () => {
  const { state, plane } = dockedAt(2);
  const visited = state.visited;

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);

  for (const distance of [10, 22, 10]) {
    nearStation(plane, 2, distance);
    expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toBeNull();
  }

  nearStation(plane, 2, 24.5);
  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toBeNull();

  nearStation(plane, 2, 10);

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toEqual({
    type: 'docked',
    station: 2,
    firstVisit: false,
  });

  expect(state.visited).toBe(visited);
});

caseTest('docking.takeoff.other-stations', 'other stations dock right away', () => {
  const { state, plane } = dockedAt(2);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);
  nearStation(plane, 3, 5);

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toEqual({
    type: 'docked',
    station: 3,
    firstVisit: true,
  });
});

caseTest('docking.takeoff.ignored', 'take-off only from a dock after the intro', () => {
  const intro = createDocking();
  const plane = homeOrbit();

  expect(applyDockingCommand(intro, { type: 'take-off' }, plane, STATIONS, FLAT)).toEqual([]);
  expect(intro).toEqual(createDocking());

  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);

  const before = structuredClone(state);

  expect(applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT)).toEqual([]);
  expect(state).toEqual(before);
});

caseTest('docking.visited.count', 'the counter counts distinct stations', () => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  for (const index of [6, 3, 8]) {
    applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);
    nearStation(plane, index, 5);
    stepDocking(state, plane, NO_STEER, STATIONS, FLAT);
  }

  expect(visitedCount(state.visited)).toBe(4);

  applyDockingCommand(state, { type: 'autopilot', station: 6 }, plane, STATIONS, FLAT);
  nearStation(plane, 6, 5);

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toEqual({
    type: 'docked',
    station: 6,
    firstVisit: false,
  });

  expect(visitedCount(state.visited)).toBe(4);
});

caseTest('docking.autopilot.current', 'autopilot to the docked station does nothing', () => {
  const { state, plane } = dockedAt(2);
  const mode = state.mode;

  expect(
    applyDockingCommand(state, { type: 'autopilot', station: 2 }, plane, STATIONS, FLAT),
  ).toEqual([]);

  expect(state.mode).toBe(mode);
});

caseTest('docking.autopilot.while-docked', 'autopilot elsewhere undocks and flies', () => {
  const { state, plane } = dockedAt(2);

  expect(
    applyDockingCommand(state, { type: 'autopilot', station: 6 }, plane, STATIONS, FLAT),
  ).toEqual([
    { type: 'undocked', station: 2 },
    { type: 'autopilot-started', station: 6 },
  ]);

  expect(state.mode).toEqual({ kind: 'autopilot', target: 6 });
  expect(state.cooldown).toBe(1 << 2);
});

caseTest('docking.autopilot.clears-target-cooldown', 'autopilot back to a cooling station', () => {
  const { state, plane } = dockedAt(2);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);
  applyDockingCommand(state, { type: 'autopilot', station: 2 }, plane, STATIONS, FLAT);
  nearStation(plane, 2, 10);

  expect(stepDocking(state, plane, NO_STEER, STATIONS, FLAT)).toEqual({
    type: 'docked',
    station: 2,
    firstVisit: false,
  });
});

caseTest('docking.autopilot.cancel', 'steering past 0.35 cancels the autopilot', () => {
  const plane = homeOrbit();
  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'autopilot', station: 5 }, plane, STATIONS, FLAT);
  plane.pos.x = 0;
  plane.pos.z = 60;

  expect(
    stepDocking(state, plane, { ...NO_STEER, turn: 0.35, magnitude: 0.35 }, STATIONS, FLAT),
  ).toBeNull();

  expect(state.mode).toEqual({ kind: 'autopilot', target: 5 });

  expect(
    stepDocking(state, plane, { ...NO_STEER, turn: 0.36, magnitude: 0.36 }, STATIONS, FLAT),
  ).toEqual({ type: 'autopilot-cancelled' });

  expect(state.mode).toEqual({ kind: 'free' });
});

caseTest('docking.autopilot.invalid', 'bad targets and early requests are ignored', () => {
  const plane = homeOrbit();
  const intro = createDocking();

  expect(
    applyDockingCommand(intro, { type: 'autopilot', station: 3 }, plane, STATIONS, FLAT),
  ).toEqual([]);

  expect(intro).toEqual(createDocking());

  const state = afterIntro(plane);

  applyDockingCommand(state, { type: 'take-off' }, plane, STATIONS, FLAT);

  for (const station of [-1, 9, 1.5, Number.NaN]) {
    expect(
      applyDockingCommand(state, { type: 'autopilot', station }, plane, STATIONS, FLAT),
    ).toEqual([]);

    expect(state.mode).toEqual({ kind: 'free' });
  }
});

caseTest('docking.reset', 'reset returns to the Home orbit, free', () => {
  const { state, plane } = dockedAt(4);

  applyDockingCommand(state, { type: 'autopilot', station: 7 }, plane, STATIONS, FLAT);

  const visited = state.visited;

  expect(resetDocking(state, plane, STATIONS)).toEqual({ type: 'reset' });
  expect(plane.pos).toEqual({ x: -36.30761184457488, y: 21, z: 31.307611844574883 });
  expect(plane).toMatchObject({ yaw: -2.356194490192345, pitch: 0, roll: 0, turn: 0 });
  expect(state).toMatchObject({ mode: { kind: 'free' }, cooldown: 0, visited });
});

caseTest('docking.sim.autopilot', 'autopilot from Home docks at This world', () => {
  const plane = homeOrbit();
  const state = createDocking();
  const control = createControl();
  const events: DockingEvent[] = [];

  events.push(...applyDockingCommand(state, { type: 'intro-done' }, plane, STATIONS, FLAT));

  for (let step = 0; step < 300; step += 1) {
    controlFor(state.mode, state.orbitSide, plane, NO_STEER, FLAT, STATIONS, control);
    stepPlane(plane, control, state.mode, STATIONS, FLAT, STEP_60);
  }

  events.push(
    ...applyDockingCommand(state, { type: 'autopilot', station: 7 }, plane, STATIONS, FLAT),
  );

  let dockedStep = -1;

  for (let step = 0; step < 60 * 40 && dockedStep < 0; step += 1) {
    controlFor(state.mode, state.orbitSide, plane, NO_STEER, FLAT, STATIONS, control);
    stepPlane(plane, control, state.mode, STATIONS, FLAT, STEP_60);

    const event = stepDocking(state, plane, NO_STEER, STATIONS, FLAT);

    if (event !== null) {
      events.push(event);
      dockedStep = event.type === 'docked' ? step : dockedStep;
    }
  }

  expect(dockedStep).toBe(279);

  expect(events).toEqual([
    { type: 'docked', station: 0, firstVisit: true },
    { type: 'undocked', station: 0 },
    { type: 'autopilot-started', station: 7 },
    { type: 'docked', station: 7, firstVisit: true },
  ]);
});
