import { controlFor, createControl } from '@/scene/flight/control';
import { applyDockingCommand, createDocking, dockPoint, stepDocking } from '@/scene/flight/docking';
import { CEILING, ORBIT_START_ANGLE } from '@/scene/flight/flight.constants';
import { wrapAngle } from '@/scene/flight/flight-math';
import { stepPlane } from '@/scene/flight/integrate';
import { createPlane, placeOnOrbit } from '@/scene/flight/plane';
import { createSteer, steerFrom } from '@/scene/flight/steer';
import { createTerrain, generateHeights } from '@/scene/world/heightmap';
import { computeStationBases, computeStationTops } from '@/scene/world/stations';
import { MAP_HALF, MAP_SIZE, SEA_LEVEL } from '@/scene/world/world.constants';

import type {
  DockingCommand,
  DockingEvent,
  DockingState,
  PlaneState,
  Terrain,
  Vec3,
} from '@/scene/flight/flight.types';

export const STEP_60 = 1 / 60;
export const STEP_SLOW = 0.05;
export const STATION_COUNT = 9;
export const HOME = 0;
export const DOCK_BOUND_SECONDS = 40;
export const FLOOR_MARGIN = 2.5;
export const KEY_TURN_THRESHOLD = 0.15;
export const WAYPOINT_ACCEPT = 18;
export const DOCK_SIDES: readonly number[] = [0, 1, 2, 3].map((quarter) => {
  return ORBIT_START_ANGLE + (quarter * Math.PI) / 2;
});

export type Waypoint = readonly [number, number];

export type RealMap = Readonly<{
  terrain: Terrain;
  stations: readonly Vec3[];
  heights: Int16Array;
}>;

export type Sim = {
  plane: PlaneState;
  docking: DockingState;
  frames: number;
  lowestMargin: number;
  highest: number;
  events: DockingEvent[];
  docks: boolean;
};

export type Spot = Readonly<{ ix: number; iz: number; x: number; z: number; height: number }>;

let cache: RealMap | undefined;

export const realMap = (): RealMap => {
  if (cache === undefined) {
    const bases = computeStationBases();
    const heights = generateHeights(bases, () => {});
    const tops = computeStationTops(bases);
    const stations: Vec3[] = [];

    for (let index = 0; index < STATION_COUNT; index += 1) {
      stations.push({
        x: tops[index * 3] ?? 0,
        y: tops[index * 3 + 1] ?? 0,
        z: tops[index * 3 + 2] ?? 0,
      });
    }

    cache = { terrain: createTerrain(heights), stations, heights };
  }

  return cache;
};

export const stationOf = (map: RealMap, index: number): Vec3 => {
  const station = map.stations[index];

  if (station === undefined) {
    throw new Error(`no station ${index}`);
  }

  return station;
};

export const surfaceBelow = (terrain: Terrain, plane: Readonly<PlaneState>): number => {
  return Math.max(terrain.heightAt(plane.pos.x, plane.pos.z), terrain.seaLevel);
};

export const horizontal = (a: Readonly<Vec3>, b: Readonly<Vec3>): number => {
  return Math.hypot(a.x - b.x, a.z - b.z);
};

const steerOut = createSteer();
const controlOut = createControl();
const NO_KEYS: ReadonlySet<string> = new Set<string>();

export const advance = (
  map: RealMap,
  sim: Sim,
  keys: ReadonlySet<string>,
  dt: number = STEP_60,
): void => {
  const steer = steerFrom(keys, { active: false, dx: 0, dy: 0 }, false, steerOut);

  const event = sim.docks
    ? stepDocking(sim.docking, sim.plane, steer, map.stations, map.terrain)
    : null;

  if (event !== null) {
    sim.events.push(event);
  }

  controlFor(
    sim.docking.mode,
    sim.docking.orbitSide,
    sim.plane,
    steer,
    map.terrain,
    map.stations,
    controlOut,
  );

  stepPlane(sim.plane, controlOut, sim.docking.mode, map.stations, map.terrain, dt);
  sim.frames += 1;

  sim.lowestMargin = Math.min(
    sim.lowestMargin,
    sim.plane.pos.y - surfaceBelow(map.terrain, sim.plane),
  );

  sim.highest = Math.max(sim.highest, sim.plane.pos.y);
};

export const resetCounters = (sim: Sim): void => {
  sim.frames = 0;
  sim.lowestMargin = Infinity;
  sim.highest = -Infinity;
  sim.events = [];
};

export const issue = (map: RealMap, sim: Sim, command: DockingCommand): void => {
  sim.events.push(
    ...applyDockingCommand(sim.docking, command, sim.plane, map.stations, map.terrain),
  );
};

export const startDocked = (map: RealMap, index: number, theta: number): Sim => {
  const plane = createPlane();

  placeOnOrbit(plane, stationOf(map, index), theta);
  plane.speed = 0;

  const docking = createDocking();

  docking.introDone = true;
  docking.visited = 1 << index;

  docking.mode = {
    kind: 'docked',
    station: index,
    dock: dockPoint(index, map.stations, plane, map.terrain),
  };

  const sim: Sim = {
    plane,
    docking,
    frames: 0,
    lowestMargin: Infinity,
    highest: -Infinity,
    events: [],
    docks: true,
  };

  for (let frame = 0; frame < 5 * 60; frame += 1) {
    advance(map, sim, NO_KEYS);
  }

  resetCounters(sim);

  return sim;
};

export const startFromIntro = (map: RealMap): Sim => {
  return startDocked(map, HOME, ORBIT_START_ANGLE);
};

export const startFree = (
  map: RealMap,
  x: number,
  z: number,
  yaw: number,
  climbAbove: number,
  speed: number,
): Sim => {
  const plane = createPlane();

  plane.pos.x = x;
  plane.pos.z = z;

  plane.pos.y = Math.min(
    CEILING,
    surfaceBelow(map.terrain, { ...plane, pos: { x, y: 0, z } }) + climbAbove,
  );

  plane.yaw = yaw;
  plane.speed = speed;

  const docking = createDocking();

  docking.introDone = true;
  docking.mode = { kind: 'free' };

  return {
    plane,
    docking,
    frames: 0,
    lowestMargin: Infinity,
    highest: -Infinity,
    events: [],
    docks: false,
  };
};

export const dockedAt = (sim: Sim): number | null => {
  return sim.docking.mode.kind === 'docked' ? sim.docking.mode.station : null;
};

export const dockedStations = (sim: Sim): readonly number[] => {
  const stations: number[] = [];

  for (const event of sim.events) {
    if (event.type === 'docked') {
      stations.push(event.station);
    }
  }

  return stations;
};

export const bearingError = (plane: Readonly<PlaneState>, target: Readonly<Vec3>): number => {
  return wrapAngle(Math.atan2(target.x - plane.pos.x, target.z - plane.pos.z) - plane.yaw);
};

export const pilotKeys = (
  plane: Readonly<PlaneState>,
  target: Readonly<Vec3>,
): ReadonlySet<string> => {
  const error = bearingError(plane, target);

  if (error > KEY_TURN_THRESHOLD) {
    return new Set(['ShiftLeft', 'KeyA']);
  }

  if (error < -KEY_TURN_THRESHOLD) {
    return new Set(['ShiftLeft', 'KeyD']);
  }

  return new Set(['ShiftLeft']);
};

export const KEYBOARD_ROUTES: Readonly<Record<number, readonly Waypoint[]>> = {
  1: [],
  2: [
    [-20, 50],
    [-60, -10],
  ],
  3: [
    [-30, 60],
    [-50, -50],
  ],
  4: [
    [-30, 70],
    [-20, 20],
  ],
  5: [
    [30, 70],
    [50, 70],
  ],
  6: [],
  7: [
    [-30, 70],
    [0, 30],
  ],
  8: [[10, 50]],
};

export const HOME_LEAVE_WAYPOINT: Waypoint = [-30, 60];

export type PilotResult = Readonly<{ seconds: number; docked: number | null; sim: Sim }>;

export const flyKeyboardRoute = (
  map: RealMap,
  sim: Sim,
  route: readonly Waypoint[],
  target: number,
  limitSeconds: number,
): PilotResult => {
  const goal = stationOf(map, target);

  const points: Vec3[] = [
    ...route.map(([x, z]) => {
      return { x, y: 0, z };
    }),
    goal,
  ];

  let leg = 0;

  while (sim.frames < limitSeconds * 60 && sim.docking.mode.kind !== 'docked') {
    const point = points[leg] ?? goal;

    if (leg < points.length - 1 && horizontal(point, sim.plane.pos) < WAYPOINT_ACCEPT) {
      leg += 1;
    }

    advance(map, sim, pilotKeys(sim.plane, points[leg] ?? goal));
  }

  return { seconds: sim.frames * STEP_60, docked: dockedAt(sim), sim };
};

export const flyAutopilot = (
  map: RealMap,
  sim: Sim,
  target: number,
  limitSeconds: number,
): PilotResult => {
  issue(map, sim, { type: 'autopilot', station: target });

  while (sim.frames < limitSeconds * 60 && sim.docking.mode.kind !== 'docked') {
    advance(map, sim, NO_KEYS);
  }

  return { seconds: sim.frames * STEP_60, docked: dockedAt(sim), sim };
};

const squareHolds = (
  heights: Int16Array,
  ix: number,
  iz: number,
  radius: number,
  holds: (height: number) => boolean,
): boolean => {
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dz = -radius; dz <= radius; dz += 1) {
      const x = ix + dx;
      const z = iz + dz;

      if (x < 0 || z < 0 || x >= MAP_SIZE || z >= MAP_SIZE) {
        return false;
      }

      if (!holds(heights[x * MAP_SIZE + z] ?? 0)) {
        return false;
      }
    }
  }

  return true;
};

const spotAt = (heights: Int16Array, ix: number, iz: number): Spot => {
  return {
    ix,
    iz,
    x: ix - MAP_HALF + 0.5,
    z: iz - MAP_HALF + 0.5,
    height: heights[ix * MAP_SIZE + iz] ?? 0,
  };
};

export const highestSpot = (heights: Int16Array): Spot => {
  let best = 0;

  for (let index = 1; index < heights.length; index += 1) {
    if ((heights[index] ?? 0) > (heights[best] ?? 0)) {
      best = index;
    }
  }

  return spotAt(heights, Math.floor(best / MAP_SIZE), best % MAP_SIZE);
};

export const widestSpot = (
  heights: Int16Array,
  holdsFor: (centre: number) => (height: number) => boolean,
): Readonly<{ spot: Spot; radius: number }> => {
  let bestRadius = -1;
  let bestSpot = spotAt(heights, 0, 0);

  for (let ix = 0; ix < MAP_SIZE; ix += 1) {
    for (let iz = 0; iz < MAP_SIZE; iz += 1) {
      const holds = holdsFor(heights[ix * MAP_SIZE + iz] ?? 0);
      let radius = 0;

      while (squareHolds(heights, ix, iz, radius, holds)) {
        radius += 1;
      }

      if (radius - 1 > bestRadius) {
        bestRadius = radius - 1;
        bestSpot = spotAt(heights, ix, iz);
      }
    }
  }

  return { spot: bestSpot, radius: bestRadius };
};

export const flatSpot = (heights: Int16Array): Readonly<{ spot: Spot; radius: number }> => {
  return widestSpot(heights, (centre) => {
    return (height) => {
      return height === centre && height > SEA_LEVEL;
    };
  });
};

export const waterSpot = (heights: Int16Array): Readonly<{ spot: Spot; radius: number }> => {
  return widestSpot(heights, () => {
    return (height) => {
      return height < SEA_LEVEL;
    };
  });
};
