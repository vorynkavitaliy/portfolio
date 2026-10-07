import {
  AUTOPILOT_CANCEL,
  DOCK_BEARINGS,
  DOCK_DISTANCE,
  DOCK_GROUND_CLEARANCE,
  DOCK_HEIGHT,
  DOCK_MIN_OFFSET_SQ,
  DOCK_NEIGHBOUR_CLEARANCE,
  HOME_DOCK_DISTANCE,
  HOME_DOCK_HEIGHT,
  HOME_STATION,
  LINK_RANGE,
  ORBIT_START_ANGLE,
  TAKEOFF_GRACE_DISTANCE,
  UNLINK_RANGE,
} from '@/scene/flight/flight.constants';
import { horizontalDistance } from '@/scene/flight/flight-math';
import { placeOnOrbit } from '@/scene/flight/plane';

import type {
  DockingCommand,
  DockingEvent,
  DockingState,
  FlightMode,
  PlaneState,
  Steer,
  Terrain,
  Vec3,
} from '@/scene/flight/flight.types';

const NO_EVENTS: readonly DockingEvent[] = Object.freeze([]);

const freeMode = (): FlightMode => {
  return { kind: 'free' };
};

const bit = (index: number): number => {
  return 1 << index;
};

const hasBit = (mask: number, index: number): boolean => {
  return (mask & bit(index)) !== 0;
};

const isStationIndex = (index: number, stations: readonly Readonly<Vec3>[]): boolean => {
  return Number.isInteger(index) && index >= 0 && index < stations.length;
};

export const createDocking = (): DockingState => {
  return {
    mode: { kind: 'intro' },
    orbitSide: 1,
    cooldown: 0,
    takeOff: null,
    visited: 0,
    introDone: false,
  };
};

const neighbourClearance = (
  index: number,
  stations: readonly Readonly<Vec3>[],
  x: number,
  z: number,
): number => {
  let nearest = Number.POSITIVE_INFINITY;

  stations.forEach((station, other) => {
    if (other !== index) {
      nearest = Math.min(nearest, horizontalDistance(station.x, station.z, x, z));
    }
  });

  return nearest;
};

const dockBearing = (
  index: number,
  stations: readonly Readonly<Vec3>[],
  top: Readonly<Vec3>,
  ux: number,
  uz: number,
  distance: number,
): Readonly<{ x: number; z: number }> => {
  let best = { x: ux, z: uz };

  let bestClearance = neighbourClearance(
    index,
    stations,
    top.x + ux * distance,
    top.z + uz * distance,
  );

  if (bestClearance >= DOCK_NEIGHBOUR_CLEARANCE) {
    return best;
  }

  for (let turn = 1; turn < DOCK_BEARINGS; turn += 1) {
    const step = turn % 2 === 1 ? (turn + 1) / 2 : -turn / 2;
    const angle = (step * 2 * Math.PI) / DOCK_BEARINGS;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = ux * cos - uz * sin;
    const z = ux * sin + uz * cos;

    const clearance = neighbourClearance(
      index,
      stations,
      top.x + x * distance,
      top.z + z * distance,
    );

    if (clearance >= DOCK_NEIGHBOUR_CLEARANCE) {
      return { x, z };
    }

    if (clearance > bestClearance) {
      best = { x, z };
      bestClearance = clearance;
    }
  }

  return best;
};

const graceHolds = (state: DockingState, plane: Readonly<PlaneState>): boolean => {
  const { takeOff } = state;

  if (takeOff === null) {
    return false;
  }

  if (horizontalDistance(takeOff.x, takeOff.z, plane.pos.x, plane.pos.z) < TAKEOFF_GRACE_DISTANCE) {
    return true;
  }

  state.takeOff = null;

  return false;
};

const takeOffPoint = (plane: Readonly<PlaneState>): Vec3 => {
  return { x: plane.pos.x, y: plane.pos.y, z: plane.pos.z };
};

export const dockPoint = (
  index: number,
  stations: readonly Readonly<Vec3>[],
  plane: Readonly<PlaneState>,
  terrain: Terrain,
): Vec3 => {
  const top = stations[index] ?? plane.pos;
  const isHome = index === HOME_STATION;
  let ox = plane.pos.x - top.x;
  let oz = plane.pos.z - top.z;

  if (ox * ox + oz * oz < DOCK_MIN_OFFSET_SQ) {
    ox = 0;
    oz = 1;
  }

  const inverse = 1 / Math.sqrt(ox * ox + oz * oz);
  const distance = isHome ? HOME_DOCK_DISTANCE : DOCK_DISTANCE;
  const bearing = dockBearing(index, stations, top, ox * inverse, oz * inverse, distance);
  const x = top.x + bearing.x * distance;
  const z = top.z + bearing.z * distance;
  const lift = isHome ? HOME_DOCK_HEIGHT : DOCK_HEIGHT;
  const y = Math.max(top.y + lift, terrain.heightAt(x, z) + DOCK_GROUND_CLEARANCE);

  return { x, y, z };
};

const link = (
  state: DockingState,
  index: number,
  plane: Readonly<PlaneState>,
  stations: readonly Readonly<Vec3>[],
  terrain: Terrain,
): DockingEvent => {
  const top = stations[index] ?? plane.pos;
  const rx = plane.pos.x - top.x;
  const rz = plane.pos.z - top.z;
  const firstVisit = !hasBit(state.visited, index);

  state.orbitSide = Math.sin(plane.yaw) * rz - Math.cos(plane.yaw) * rx >= 0 ? 1 : -1;
  state.mode = { kind: 'docked', station: index, dock: dockPoint(index, stations, plane, terrain) };
  state.visited |= bit(index);

  return { type: 'docked', station: index, firstVisit };
};

export const stepDocking = (
  state: DockingState,
  plane: Readonly<PlaneState>,
  steer: Steer,
  stations: readonly Readonly<Vec3>[],
  terrain: Terrain,
): DockingEvent | null => {
  const grace = graceHolds(state, plane);
  const cancels = state.introDone && steer.magnitude > AUTOPILOT_CANCEL;

  if (cancels && state.mode.kind === 'autopilot') {
    state.mode = freeMode();

    return { type: 'autopilot-cancelled' };
  }

  for (let index = 0; index < stations.length; index += 1) {
    const top = stations[index];

    if (top === undefined) {
      continue;
    }

    const distance = horizontalDistance(top.x, top.z, plane.pos.x, plane.pos.z);

    if (hasBit(state.cooldown, index)) {
      if (!grace && distance > UNLINK_RANGE) {
        state.cooldown &= ~bit(index);
      }

      continue;
    }

    if (!state.introDone || !(distance < LINK_RANGE)) {
      continue;
    }

    const { mode } = state;
    const isTarget = mode.kind === 'autopilot' && mode.target === index;
    const isFree = mode.kind === 'free' && !grace;

    if (isFree || isTarget) {
      return link(state, index, plane, stations, terrain);
    }
  }

  return null;
};

export const applyDockingCommand = (
  state: DockingState,
  command: DockingCommand,
  plane: Readonly<PlaneState>,
  stations: readonly Readonly<Vec3>[],
  terrain: Terrain,
): readonly DockingEvent[] => {
  const { mode } = state;

  if (command.type === 'intro-done') {
    if (state.introDone) {
      return NO_EVENTS;
    }

    state.introDone = true;

    return [link(state, HOME_STATION, plane, stations, terrain)];
  }

  if (!state.introDone) {
    return NO_EVENTS;
  }

  if (command.type === 'take-off') {
    if (mode.kind !== 'docked') {
      return NO_EVENTS;
    }

    state.cooldown |= bit(mode.station);
    state.mode = freeMode();
    state.takeOff = takeOffPoint(plane);

    return [{ type: 'undocked', station: mode.station }];
  }

  const target = command.station;

  if (!isStationIndex(target, stations)) {
    return NO_EVENTS;
  }

  if (mode.kind === 'docked' && mode.station === target) {
    return NO_EVENTS;
  }

  const events: DockingEvent[] = [];

  if (mode.kind === 'docked') {
    state.cooldown |= bit(mode.station);
    events.push({ type: 'undocked', station: mode.station });
    state.takeOff = takeOffPoint(plane);
  }

  state.cooldown &= ~bit(target);
  state.mode = { kind: 'autopilot', target };
  events.push({ type: 'autopilot-started', station: target });

  return events;
};

export const resetDocking = (
  state: DockingState,
  plane: PlaneState,
  stations: readonly Readonly<Vec3>[],
): DockingEvent => {
  const home = stations[HOME_STATION];

  if (home !== undefined) {
    placeOnOrbit(plane, home, ORBIT_START_ANGLE);
  }

  state.mode = freeMode();
  state.orbitSide = 1;
  state.cooldown = 0;
  state.takeOff = null;

  return { type: 'reset' };
};
