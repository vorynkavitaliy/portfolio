import {
  AUTOPILOT_ARRIVED,
  AUTOPILOT_CLEARANCE,
  AUTOPILOT_CLIMB_RANGE,
  AUTOPILOT_CRUISE_RADIUS,
  AUTOPILOT_LOOKAHEAD_FAR,
  AUTOPILOT_LOOKAHEAD_NEAR,
  AUTOPILOT_NEAR_RADIUS,
  AUTOPILOT_NEAR_SPEED,
  AUTOPILOT_TURN_GAIN,
  BOOST_SPEED,
  CRUISE_SPEED,
  HOME_STATION,
  ORBIT_CLIMB_RANGE,
  ORBIT_HEIGHT,
  ORBIT_MIN_RADIUS,
  ORBIT_RADIUS,
  ORBIT_RADIUS_GAIN,
  ORBIT_SPEED,
  ORBIT_TURN_BIAS,
  ORBIT_TURN_GAIN,
} from '@/scene/flight/flight.constants';
import { clamp, wrapAngle } from '@/scene/flight/flight-math';

import type {
  FlightControl,
  FlightMode,
  PlaneState,
  Steer,
  Terrain,
  Vec3,
} from '@/scene/flight/flight.types';

const orbitControl = (
  station: Readonly<Vec3>,
  orbitSide: 1 | -1,
  plane: Readonly<PlaneState>,
  out: FlightControl,
): void => {
  let rx = plane.pos.x - station.x;
  let rz = plane.pos.z - station.z;
  let radius = Math.hypot(rx, rz);

  if (radius < ORBIT_MIN_RADIUS) {
    rx = ORBIT_MIN_RADIUS;
    rz = 0;
    radius = ORBIT_MIN_RADIUS;
  }

  const theta = Math.atan2(rx, rz);
  const tangent = Math.atan2(orbitSide * Math.cos(theta), -orbitSide * Math.sin(theta));
  const desired = tangent + orbitSide * clamp((radius - ORBIT_RADIUS) * ORBIT_RADIUS_GAIN, -1, 1);

  out.turn = clamp(
    orbitSide * ORBIT_TURN_BIAS + wrapAngle(desired - plane.yaw) * ORBIT_TURN_GAIN,
    -1,
    1,
  );

  out.climb = clamp((station.y + ORBIT_HEIGHT - plane.pos.y) / ORBIT_CLIMB_RANGE, -1, 1);
  out.speed = ORBIT_SPEED;
};

const autopilotControl = (
  station: Readonly<Vec3>,
  plane: Readonly<PlaneState>,
  steer: Steer,
  terrain: Terrain,
  out: FlightControl,
): void => {
  const { x, y, z } = plane.pos;
  const dx = station.x - x;
  const dz = station.z - z;
  const distance = Math.hypot(dx, dz);
  const sx = Math.sin(plane.yaw);
  const sz = Math.cos(plane.yaw);

  const clearance =
    Math.max(
      terrain.heightAt(x, z),
      terrain.heightAt(x + sx * AUTOPILOT_LOOKAHEAD_NEAR, z + sz * AUTOPILOT_LOOKAHEAD_NEAR),
      terrain.heightAt(x + sx * AUTOPILOT_LOOKAHEAD_FAR, z + sz * AUTOPILOT_LOOKAHEAD_FAR),
    ) + AUTOPILOT_CLEARANCE;

  const hover = station.y + ORBIT_HEIGHT;
  const wantY = distance > AUTOPILOT_CRUISE_RADIUS ? Math.max(hover, clearance) : hover;
  const arrived = distance < AUTOPILOT_ARRIVED;

  out.turn = arrived
    ? 0
    : clamp(wrapAngle(Math.atan2(dx, dz) - plane.yaw) * AUTOPILOT_TURN_GAIN, -1, 1);

  out.climb = clamp((wantY - y) / AUTOPILOT_CLIMB_RANGE, -1, 1);

  if (steer.boost) {
    out.speed = BOOST_SPEED;
  } else {
    out.speed = distance < AUTOPILOT_NEAR_RADIUS ? AUTOPILOT_NEAR_SPEED : CRUISE_SPEED;
  }
};

const freeControl = (steer: Steer, out: FlightControl): void => {
  out.turn = steer.turn;
  out.climb = steer.climb;
  out.speed = steer.boost ? BOOST_SPEED : CRUISE_SPEED;
};

export const createControl = (): FlightControl => {
  return { turn: 0, climb: 0, speed: CRUISE_SPEED };
};

export const controlFor = (
  mode: Readonly<FlightMode>,
  orbitSide: 1 | -1,
  plane: Readonly<PlaneState>,
  steer: Steer,
  terrain: Terrain,
  stations: readonly Readonly<Vec3>[],
  out: FlightControl,
): void => {
  if (mode.kind === 'free') {
    freeControl(steer, out);

    return;
  }

  if (mode.kind === 'autopilot') {
    const target = stations[mode.target];

    if (target === undefined) {
      freeControl(steer, out);

      return;
    }

    autopilotControl(target, plane, steer, terrain, out);

    return;
  }

  const index = mode.kind === 'docked' ? mode.station : HOME_STATION;
  const station = stations[index];

  if (station === undefined) {
    freeControl(steer, out);

    return;
  }

  orbitControl(station, orbitSide, plane, out);
};
