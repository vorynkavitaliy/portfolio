import {
  CEILING,
  CEILING_SOFT,
  CEILING_SOFT_RANGE,
  CLIMB_ASSIST_OFFSET,
  CLIMB_ASSIST_RANGE,
  DOCK_RESPONSE,
  DOCK_ROLL_GAIN,
  DOCK_ROLL_RESPONSE,
  DOCK_YAW_RESPONSE,
  EDGE_MARGIN,
  EDGE_RATE_BASE,
  EDGE_RATE_GAIN,
  EDGE_RATE_MAX,
  FLOOR_CLEARANCE,
  GROUND_CLEARANCE,
  GROUND_LOOKAHEAD,
  GROUND_RECOVERY,
  HOME_STATION,
  MAX_DT,
  ORBIT_START_ANGLE,
  PITCH_GAIN,
  PITCH_RESPONSE,
  ROLL_GAIN,
  ROLL_RESPONSE,
  SPEED_RESPONSE,
  TURN_RATE,
  TURN_RESPONSE,
} from '@/scene/flight/flight.constants';
import { clamp01, response, wrapAngle } from '@/scene/flight/flight-math';
import { isPlaneValid, placeOnOrbit } from '@/scene/flight/plane';

import type {
  FlightControl,
  FlightMode,
  PlaneState,
  StepOutcome,
  Terrain,
  Vec3,
} from '@/scene/flight/flight.types';

const ORIGIN: Readonly<Vec3> = { x: 0, y: 0, z: 0 };

const sanitizeDt = (dt: number): number => {
  return Number.isFinite(dt) ? Math.min(MAX_DT, Math.max(0, dt)) : 0;
};

const hover = (
  plane: PlaneState,
  station: Readonly<Vec3>,
  dock: Readonly<Vec3>,
  dt: number,
): void => {
  const kd = response(dt, DOCK_RESPONSE);

  plane.pos.x += (dock.x - plane.pos.x) * kd;
  plane.pos.y += (dock.y - plane.pos.y) * kd;
  plane.pos.z += (dock.z - plane.pos.z) * kd;

  const face = Math.atan2(station.x - plane.pos.x, station.z - plane.pos.z);
  const yawStep = wrapAngle(face - plane.yaw) * response(dt, DOCK_YAW_RESPONSE);

  plane.yaw = wrapAngle(plane.yaw + yawStep);
  plane.turn += (0 - plane.turn) * kd;
  plane.pitch += (0 - plane.pitch) * kd;
  plane.roll += (-yawStep * DOCK_ROLL_GAIN - plane.roll) * response(dt, DOCK_ROLL_RESPONSE);
  plane.speed += (0 - plane.speed) * kd;
};

const edgeReturn = (plane: PlaneState, half: number, dt: number): void => {
  const edgeR = Math.max(Math.abs(plane.pos.x), Math.abs(plane.pos.z));
  const beyond = edgeR - half - EDGE_MARGIN;

  if (beyond <= 0) {
    return;
  }

  const back = Math.atan2(-plane.pos.x, -plane.pos.z);
  const rate = Math.min(EDGE_RATE_MAX, EDGE_RATE_BASE + beyond * EDGE_RATE_GAIN);

  plane.yaw = wrapAngle(plane.yaw + wrapAngle(back - plane.yaw) * response(dt, rate));
};

const fly = (plane: PlaneState, control: FlightControl, terrain: Terrain, dt: number): void => {
  plane.turn += (control.turn - plane.turn) * response(dt, TURN_RESPONSE);
  plane.yaw = wrapAngle(plane.yaw + plane.turn * TURN_RATE * dt);
  edgeReturn(plane, terrain.half, dt);

  const sx = Math.sin(plane.yaw);
  const sz = Math.cos(plane.yaw);
  const { pos } = plane;

  const ground =
    Math.max(
      terrain.heightAt(pos.x, pos.z),
      terrain.heightAt(pos.x + sx * GROUND_LOOKAHEAD, pos.z + sz * GROUND_LOOKAHEAD),
      terrain.seaLevel,
    ) + GROUND_CLEARANCE;

  let climb = control.climb;
  const need = ground - pos.y;

  if (need > -CLIMB_ASSIST_OFFSET) {
    climb = Math.max(climb, clamp01((need + CLIMB_ASSIST_OFFSET) / CLIMB_ASSIST_RANGE));
  }

  if (pos.y > CEILING_SOFT) {
    climb = Math.min(climb, -clamp01((pos.y - CEILING_SOFT) / CEILING_SOFT_RANGE));
  }

  plane.pitch += (climb * PITCH_GAIN - plane.pitch) * response(dt, PITCH_RESPONSE);
  plane.roll += (-plane.turn * ROLL_GAIN - plane.roll) * response(dt, ROLL_RESPONSE);
  plane.speed += (control.speed - plane.speed) * response(dt, SPEED_RESPONSE);

  const cp = Math.cos(plane.pitch);
  const travel = plane.speed * dt;

  pos.x += sx * cp * travel;
  pos.y += Math.sin(plane.pitch) * travel;
  pos.z += sz * cp * travel;

  if (pos.y < ground) {
    pos.y += (ground - pos.y) * response(dt, GROUND_RECOVERY);
  }

  const floor = Math.max(terrain.heightAt(pos.x, pos.z), terrain.seaLevel) + FLOOR_CLEARANCE;

  if (pos.y < floor) {
    pos.y = floor;
  }

  if (pos.y > CEILING) {
    pos.y = CEILING;
  }
};

export const stepPlane = (
  plane: PlaneState,
  control: FlightControl,
  mode: Readonly<FlightMode>,
  stations: readonly Readonly<Vec3>[],
  terrain: Terrain,
  dt: number,
): StepOutcome => {
  const step = sanitizeDt(dt);
  const station = mode.kind === 'docked' ? stations[mode.station] : undefined;

  if (mode.kind === 'docked' && station !== undefined) {
    hover(plane, station, mode.dock, step);
  } else {
    fly(plane, control, terrain, step);
  }

  if (isPlaneValid(plane)) {
    return 'ok';
  }

  placeOnOrbit(plane, stations[HOME_STATION] ?? ORIGIN, ORBIT_START_ANGLE);

  return 'reset';
};
