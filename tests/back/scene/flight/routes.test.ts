import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/flight/routes.case-test';
import {
  advance,
  DOCK_BOUND_SECONDS,
  DOCK_SIDES,
  dockedStations,
  FLOOR_MARGIN,
  flatSpot,
  flyAutopilot,
  flyKeyboardRoute,
  highestSpot,
  HOME,
  HOME_LEAVE_WAYPOINT,
  horizontal,
  issue,
  KEYBOARD_ROUTES,
  pilotKeys,
  realMap,
  resetCounters,
  startFree,
  startFromIntro,
  startDocked,
  STATION_COUNT,
  STEP_60,
  STEP_SLOW,
  stationOf,
  waterSpot,
} from '@tests/back/scene/flight/routes.fixtures';
import { applyDockingCommand, createDocking, dockPoint } from '@/scene/flight/docking';
import { BOOST_SPEED, CEILING, CRUISE_SPEED, LINK_RANGE } from '@/scene/flight/flight.constants';
import { createPlane, placeOnOrbit } from '@/scene/flight/plane';

import type { RealMap, Sim, Spot } from '@tests/back/scene/flight/routes.fixtures';

const NO_KEYS: ReadonlySet<string> = new Set<string>();

const OTHER_STATIONS: readonly number[] = Array.from({ length: STATION_COUNT - 1 }, (_, index) => {
  return index + 1;
});

const HEADINGS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7].map((quarter) => {
  return (quarter * Math.PI) / 4;
});

const FOUR_HEADINGS: readonly number[] = [0, 1, 2, 3].map((quarter) => {
  return (quarter * Math.PI) / 2;
});

const HOLD_SECONDS = 30;
const EDGE_CROSS = 82;
const EDGE_RETURN_SECONDS = 10;
const EDGE_RUN_SECONDS = 40;
const EDGE_INSIDE = 64;
const START_ABOVE = 30;
const DESCENT_REACHED = 6;
const SPEEDS: readonly number[] = [CRUISE_SPEED, BOOST_SPEED];
const STEPS: readonly number[] = [STEP_60, STEP_SLOW];

const places = (map: RealMap): readonly Readonly<{ name: string; spot: Spot }>[] => {
  return [
    { name: 'highest column', spot: highestSpot(map.heights) },
    { name: 'flat plateau', spot: flatSpot(map.heights).spot },
    { name: 'open water', spot: waterSpot(map.heights).spot },
  ];
};

const holdKeys = (key: string): ReadonlySet<string> => {
  return new Set([key]);
};

const holdLoop = (
  map: RealMap,
  sim: Sim,
  keys: ReadonlySet<string>,
  dt: number,
  boost: boolean,
): void => {
  const held = boost ? new Set([...keys, 'ShiftLeft']) : keys;

  for (let step = 0; step < Math.round(HOLD_SECONDS / dt); step += 1) {
    advance(map, sim, held, dt);
  }
};

const leaveHome = (map: RealMap): Sim => {
  const sim = startFromIntro(map);

  issue(map, sim, { type: 'take-off' });

  return sim;
};

const TAKEOFF_QUIET_SECONDS = 2;
const DOCK_CLEAR_MARGIN = 2;

const APPROACHES: readonly number[] = Array.from({ length: 16 }, (_, step) => {
  return (step * Math.PI) / 8;
});

const hoverFiveSeconds = (map: RealMap, sim: Sim): Sim => {
  for (let frame = 0; frame < 5 * 60; frame += 1) {
    advance(map, sim, NO_KEYS);
  }

  resetCounters(sim);

  return sim;
};

const homeAfterIntro = (map: RealMap, theta: number): Sim => {
  const plane = createPlane();
  const docking = createDocking();

  placeOnOrbit(plane, stationOf(map, HOME), theta);
  applyDockingCommand(docking, { type: 'intro-done' }, plane, map.stations, map.terrain);

  return hoverFiveSeconds(map, {
    plane,
    docking,
    frames: 0,
    lowestMargin: Infinity,
    highest: -Infinity,
    events: [],
    docks: true,
  });
};

const quietAfterTakeOff = (
  map: RealMap,
  sim: Sim,
): Readonly<{ docked: readonly number[]; mode: string }> => {
  issue(map, sim, { type: 'take-off' });

  for (let frame = 0; frame < TAKEOFF_QUIET_SECONDS * 60; frame += 1) {
    advance(map, sim, NO_KEYS);
  }

  return { docked: dockedStations(sim), mode: sim.docking.mode.kind };
};

const edgeStarts = (map: RealMap): readonly Readonly<{ x: number; z: number }>[] => {
  return [
    { x: 0, z: 0 },
    ...map.stations.map((station) => {
      return { x: station.x, z: station.z };
    }),
  ];
};

caseTest('routes.keyboard.stations', 'keyboard pilot docks at each of the 8 other stations', () => {
  const map = realMap();

  for (const target of OTHER_STATIONS) {
    const result = flyKeyboardRoute(
      map,
      leaveHome(map),
      KEYBOARD_ROUTES[target] ?? [],
      target,
      DOCK_BOUND_SECONDS,
    );

    expect({ target, docked: result.docked, all: dockedStations(result.sim) }).toEqual({
      target,
      docked: target,
      all: [target],
    });

    expect(result.seconds).toBeLessThanOrEqual(DOCK_BOUND_SECONDS);
  }
});

caseTest('routes.keyboard.home', 'keyboard pilot returns to Home after leaving it', () => {
  const map = realMap();
  const home = stationOf(map, HOME);
  const sim = leaveHome(map);
  const [lx, lz] = HOME_LEAVE_WAYPOINT;
  const leave = { x: lx, y: 0, z: lz };

  while (horizontal(sim.plane.pos, home) <= 24 && sim.frames < DOCK_BOUND_SECONDS * 60) {
    advance(map, sim, pilotKeys(sim.plane, leave));
  }

  expect(horizontal(sim.plane.pos, home)).toBeGreaterThan(24);
  expect(sim.docking.mode.kind).toBe('free');

  resetCounters(sim);

  const result = flyKeyboardRoute(map, sim, [], HOME, DOCK_BOUND_SECONDS);

  expect(result.docked).toBe(HOME);
  expect(result.seconds).toBeLessThanOrEqual(DOCK_BOUND_SECONDS);
});

caseTest('routes.keyboard.safe', 'keyboard routes keep the floor and the ceiling', () => {
  const map = realMap();

  for (const target of OTHER_STATIONS) {
    const result = flyKeyboardRoute(
      map,
      leaveHome(map),
      KEYBOARD_ROUTES[target] ?? [],
      target,
      DOCK_BOUND_SECONDS,
    );

    expect(result.sim.lowestMargin).toBeGreaterThanOrEqual(FLOOR_MARGIN);
    expect(result.sim.highest).toBeLessThanOrEqual(CEILING);
  }
});

caseTest('routes.autopilot.all-pairs', 'autopilot docks at every station from every other', () => {
  const map = realMap();
  const worst = new Map<string, number>();

  for (let from = 0; from < STATION_COUNT; from += 1) {
    for (let to = 0; to < STATION_COUNT; to += 1) {
      if (from === to) {
        continue;
      }

      for (const side of DOCK_SIDES) {
        const sim = startDocked(map, from, side);
        const result = flyAutopilot(map, sim, to, DOCK_BOUND_SECONDS);

        expect({ from, to, docked: result.docked, all: dockedStations(sim) }).toEqual({
          from,
          to,
          docked: to,
          all: [to],
        });

        expect(result.seconds).toBeLessThanOrEqual(DOCK_BOUND_SECONDS);
        worst.set(`${from}->${to}`, Math.max(worst.get(`${from}->${to}`) ?? 0, result.seconds));
      }
    }
  }

  expect(worst.size).toBe(STATION_COUNT * (STATION_COUNT - 1));
});

caseTest('routes.autopilot.safe', 'autopilot routes keep the floor and the ceiling', () => {
  const map = realMap();

  for (let from = 0; from < STATION_COUNT; from += 1) {
    for (let to = 0; to < STATION_COUNT; to += 1) {
      if (from === to) {
        continue;
      }

      for (const side of DOCK_SIDES) {
        const sim = startDocked(map, from, side);

        flyAutopilot(map, sim, to, DOCK_BOUND_SECONDS);

        expect(sim.lowestMargin).toBeGreaterThanOrEqual(FLOOR_MARGIN);
        expect(sim.highest).toBeLessThanOrEqual(CEILING);
      }
    }
  }
});

caseTest('routes.floor.descend', 'holding descend never goes below the floor', () => {
  const map = realMap();

  for (const { name, spot } of places(map)) {
    for (const yaw of FOUR_HEADINGS) {
      for (const speed of SPEEDS) {
        for (const dt of STEPS) {
          const sim = startFree(map, spot.x, spot.z, yaw, START_ABOVE, speed);

          holdLoop(map, sim, holdKeys('KeyS'), dt, speed === BOOST_SPEED);

          expect({ name, yaw, speed, dt, ok: sim.lowestMargin >= FLOOR_MARGIN }).toEqual({
            name,
            yaw,
            speed,
            dt,
            ok: true,
          });

          expect(sim.lowestMargin).toBeLessThan(DESCENT_REACHED);
        }
      }
    }
  }
});

caseTest('routes.ceiling.climb', 'holding climb never passes 80', () => {
  const map = realMap();

  for (const { name, spot } of places(map)) {
    for (const yaw of FOUR_HEADINGS) {
      for (const dt of STEPS) {
        const sim = startFree(map, spot.x, spot.z, yaw, START_ABOVE, CRUISE_SPEED);

        holdLoop(map, sim, holdKeys('KeyW'), dt, true);

        expect({ name, yaw, dt, highest: sim.highest <= CEILING }).toEqual({
          name,
          yaw,
          dt,
          highest: true,
        });

        expect(sim.highest).toBeGreaterThan(CEILING - 10);
      }
    }
  }
});

const edgeRun = (
  map: RealMap,
  start: Readonly<{ x: number; z: number }>,
  yaw: number,
  speed: number,
): Readonly<{
  crossedAt: number;
  returnedAt: number;
  slowest: number;
  margin: number;
  highest: number;
}> => {
  const sim = startFree(map, start.x, start.z, yaw, START_ABOVE, speed);
  const held = speed === BOOST_SPEED ? new Set(['ShiftLeft']) : NO_KEYS;
  let crossedAt = -1;
  let returnedAt = -1;
  let slowest = Infinity;

  while (sim.frames < EDGE_RUN_SECONDS * 60 && returnedAt < 0) {
    advance(map, sim, held);
    slowest = Math.min(slowest, sim.plane.speed);

    const radius = Math.max(Math.abs(sim.plane.pos.x), Math.abs(sim.plane.pos.z));

    if (crossedAt < 0 && radius > EDGE_CROSS) {
      crossedAt = sim.frames;
    }

    if (crossedAt >= 0 && radius <= EDGE_INSIDE) {
      returnedAt = sim.frames;
    }
  }

  return {
    crossedAt,
    returnedAt,
    slowest,
    margin: sim.lowestMargin,
    highest: sim.highest,
  };
};

caseTest('routes.edge.return', 'flying out comes back without input', () => {
  const map = realMap();
  let worst = 0;

  for (const start of edgeStarts(map)) {
    for (const speed of SPEEDS) {
      for (const yaw of HEADINGS) {
        const run = edgeRun(map, start, yaw, speed);

        expect({ start, speed, yaw, crossed: run.crossedAt > 0 }).toEqual({
          start,
          speed,
          yaw,
          crossed: true,
        });

        expect({ start, speed, yaw, returned: run.returnedAt > 0 }).toEqual({
          start,
          speed,
          yaw,
          returned: true,
        });

        expect((run.returnedAt - run.crossedAt) * STEP_60).toBeLessThanOrEqual(EDGE_RETURN_SECONDS);
        expect(run.slowest).toBeGreaterThanOrEqual(CRUISE_SPEED - 1e-9);
        worst = Math.max(worst, run.returnedAt - run.crossedAt);
      }
    }
  }

  expect(worst).toBeGreaterThan(0);
});

caseTest('routes.edge.floor', 'edge-return runs keep the floor and the ceiling', () => {
  const map = realMap();

  for (const start of edgeStarts(map)) {
    for (const speed of SPEEDS) {
      for (const yaw of HEADINGS) {
        const run = edgeRun(map, start, yaw, speed);

        expect(run.margin).toBeGreaterThanOrEqual(FLOOR_MARGIN);
        expect(run.highest).toBeLessThanOrEqual(CEILING);
      }
    }
  }
});

caseTest('routes.takeoff.no-redock', 'take-off leaves the plane free for 2 s of cruise', () => {
  const map = realMap();

  for (const theta of APPROACHES) {
    expect({ theta, ...quietAfterTakeOff(map, homeAfterIntro(map, theta)) }).toEqual({
      theta,
      docked: [],
      mode: 'free',
    });

    for (let station = 0; station < STATION_COUNT; station += 1) {
      expect({
        station,
        theta,
        ...quietAfterTakeOff(map, startDocked(map, station, theta)),
      }).toEqual({ station, theta, docked: [], mode: 'free' });
    }
  }
});

caseTest('routes.dock-point.clear', 'no hover point lies in link range of another station', () => {
  const map = realMap();
  const plane = createPlane();

  for (let station = 0; station < STATION_COUNT; station += 1) {
    for (const theta of APPROACHES) {
      placeOnOrbit(plane, stationOf(map, station), theta);

      const dock = dockPoint(station, map.stations, plane, map.terrain);

      map.stations.forEach((other, index) => {
        if (index !== station) {
          expect({
            station,
            theta,
            index,
            far: horizontal(dock, other) >= LINK_RANGE + DOCK_CLEAR_MARGIN,
          }).toEqual({
            station,
            theta,
            index,
            far: true,
          });
        }
      });
    }
  }
});
