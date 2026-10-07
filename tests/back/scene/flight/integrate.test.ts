import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/flight/integrate.case-test';
import {
  CLIFF,
  FIXTURE_SEA,
  FLAT,
  planeAt,
  RIDGE,
  stationAt,
  STATIONS,
  STEP_60,
  WATER,
} from '@tests/back/scene/flight/integrate.fixtures';
import { stepPlane } from '@/scene/flight/integrate';

import type { FlightControl, FlightMode, PlaneState, Terrain } from '@/scene/flight/flight.types';

const FREE: FlightMode = { kind: 'free' };
const HOME_ORBIT = { x: -36.30761184457488, y: 21, z: 31.307611844574883 };

const control = (turn: number, climb: number, speed: number): FlightControl => {
  return { turn, climb, speed };
};

const fly = (
  plane: PlaneState,
  ctl: FlightControl,
  terrain: Terrain,
  steps: number,
  dt: number,
  each: (step: number) => void = () => {},
): void => {
  for (let step = 0; step < steps; step += 1) {
    stepPlane(plane, ctl, FREE, STATIONS, terrain, dt);
    each(step);
  }
};

const edgeRadius = (plane: PlaneState): number => {
  return Math.max(Math.abs(plane.pos.x), Math.abs(plane.pos.z));
};

caseTest('integrate.speed.ease', 'boost eases from 13 toward 26', () => {
  const plane = planeAt(0, 30, 0);

  fly(plane, control(0, 0, 26), FLAT, 60, STEP_60);

  expect(plane.speed).toBe(23.099307918070423);
  expect(plane.speed).toBeCloseTo(13 + 13 * (1 - Math.exp(-1.5)), 9);
});

caseTest('integrate.free.one-second', 'one second of free flight', () => {
  const plane = planeAt(0, 30, 0, { yaw: 0.4 });

  fly(plane, control(0.5, -0.3, 26), FLAT, 60, STEP_60);

  expect(plane).toEqual({
    pos: { x: 11.109440792093212, y: 28.04128789641234, z: 15.468232696763764 },
    yaw: 0.8654681497156984,
    pitch: -0.13768725020641512,
    roll: -0.33310160707736525,
    speed: 23.099307918070423,
    turn: 0.49663102650045726,
  });
});

caseTest('integrate.floor.descend', 'holding descend never goes below the floor', () => {
  const runs: readonly (readonly [Terrain, PlaneState])[] = [
    [FLAT, planeAt(0, 30, 0)],
    [RIDGE, planeAt(0, 50, -40)],
    [WATER, planeAt(0, 30, 0, { yaw: 1 })],
  ];

  for (const dt of [STEP_60, 0.05]) {
    for (const [terrain, start] of runs) {
      const plane = { ...start, pos: { ...start.pos } };
      let margin = Infinity;

      fly(plane, control(0, -1, 26), terrain, Math.round(30 / dt), dt, () => {
        const surface = Math.max(terrain.heightAt(plane.pos.x, plane.pos.z), FIXTURE_SEA);

        margin = Math.min(margin, plane.pos.y - surface);
      });

      expect(margin).toBeGreaterThanOrEqual(2.5);
    }
  }
});

caseTest('integrate.floor.clamp', 'a steep dive is clamped to the floor', () => {
  const plane = planeAt(0, 12.5, 0, { pitch: -1.5, speed: 26 });

  stepPlane(plane, control(0, -1, 26), FREE, STATIONS, FLAT, 0.05);

  expect(plane.pos.y).toBe(12.5);

  const sea = planeAt(0, 9.5, 0, { pitch: -1.5, speed: 26 });

  stepPlane(sea, control(0, -1, 26), FREE, STATIONS, WATER, 0.05);

  expect(sea.pos.y).toBe(9.5);
});

caseTest('integrate.floor.climb-assist', 'terrain ahead pitches the plane up early', () => {
  const plane = planeAt(-30, 25, 0, { yaw: Math.PI / 2 });
  let first: Readonly<{ step: number; x: number; y: number }> | null = null;

  fly(plane, control(0, 0, 13), CLIFF, 600, STEP_60, (step) => {
    if (first === null && plane.pitch > 0) {
      first = { step, x: plane.pos.x, y: plane.pos.y };
    }
  });

  expect(first).toEqual({ step: 111, x: -5.733378439071125, y: 26.81208919455498 });
});

caseTest('integrate.ceiling.climb', 'holding climb never passes 80', () => {
  for (const dt of [STEP_60, 0.05]) {
    const plane = planeAt(0, 60, 0, { yaw: 0.3 });
    let highest = -Infinity;

    fly(plane, control(0.2, 1, 26), FLAT, Math.round(30 / dt), dt, () => {
      highest = Math.max(highest, plane.pos.y);
    });

    expect(highest).toBeLessThanOrEqual(80);
  }
});

caseTest('integrate.ceiling.soft', 'above 72 the nose goes down', () => {
  const plane = planeAt(0, 76, 0);

  stepPlane(plane, control(0, 1, 13), FREE, STATIONS, FLAT, 0.05);

  expect(plane.pitch).toBe(-0.029375774353851136);
  expect(plane.pos.y).toBe(75.98090849273832);
});

caseTest('integrate.ceiling.clamp', 'a steep climb is clamped at 80', () => {
  const plane = planeAt(0, 79.9, 0, { pitch: 1.2, speed: 26 });

  stepPlane(plane, control(0, 1, 26), FREE, STATIONS, FLAT, 0.05);

  expect(plane.pos.y).toBe(80);
});

caseTest('integrate.edge.threshold', 'the turn back starts beyond 18 blocks', () => {
  const inside = planeAt(81.5, 30, 0);
  const beyond = planeAt(82.5, 30, 0);

  stepPlane(inside, control(0, 0, 13), FREE, STATIONS, FLAT, 0.05);
  stepPlane(beyond, control(0, 0, 13), FREE, STATIONS, FLAT, 0.05);

  expect(inside.yaw).toBe(0);
  expect(beyond.yaw).toBe(-0.04946974518821298);
});

caseTest('integrate.edge.firmer', 'the turn back is firmer farther out', () => {
  const near = planeAt(90, 30, 0);
  const far = planeAt(120, 30, 0);

  stepPlane(near, control(0, 0, 13), FREE, STATIONS, FLAT, 0.05);
  stepPlane(far, control(0, 0, 13), FREE, STATIONS, FLAT, 0.05);

  expect(near.yaw).toBe(-0.09443174060607051);
  expect(far.yaw).toBe(-0.1776249626402601);
});

caseTest('integrate.edge.return', 'flying out comes back without input', () => {
  let worst = 0;
  let slowest = Infinity;

  for (const speed of [13, 26]) {
    for (let heading = 0; heading < 8; heading += 1) {
      const plane = planeAt(0, 30, 0, { yaw: (heading * Math.PI) / 4 });
      let crossed = -1;
      let back = -1;

      for (let step = 0; step < 60 * 60 && back < 0; step += 1) {
        stepPlane(plane, control(0, 0, speed), FREE, STATIONS, FLAT, STEP_60);
        slowest = Math.min(slowest, plane.speed);

        const radius = edgeRadius(plane);

        if (crossed < 0 && radius > 82) {
          crossed = step;
        }

        if (crossed >= 0 && radius <= 64) {
          back = step;
        }
      }

      expect(back).toBeGreaterThan(crossed);
      worst = Math.max(worst, back - crossed);
    }
  }

  expect(worst / 60).toBeLessThanOrEqual(10);
  expect(worst).toBe(288);
  expect(slowest).toBeGreaterThanOrEqual(13);
});

caseTest('integrate.edge.held-turn', 'a held turn stays near the map', () => {
  let farthest = 0;

  for (const speed of [13, 26]) {
    for (const turn of [1, -1]) {
      for (let heading = 0; heading < 8; heading += 1) {
        const plane = planeAt(0, 30, 0, { yaw: (heading * Math.PI) / 4 });

        for (let step = 0; step < 300 * 60; step += 1) {
          const ctl = control(step < 600 ? 0 : turn, 0, speed);

          stepPlane(plane, ctl, FREE, STATIONS, FLAT, STEP_60);
          farthest = Math.max(farthest, edgeRadius(plane));
        }
      }
    }
  }

  expect(farthest).toBe(98.85528946366448);
  expect(farthest).toBeLessThanOrEqual(110);
});

caseTest('integrate.reset.invalid', 'an invalid state resets to the Home orbit', () => {
  const broken = planeAt(Number.NaN, 30, 0);

  expect(stepPlane(broken, control(0, 0, 13), FREE, STATIONS, FLAT, STEP_60)).toBe('reset');
  expect(broken.pos).toEqual(HOME_ORBIT);
  expect(broken).toMatchObject({ yaw: -2.356194490192345, pitch: 0, roll: 0, turn: 0 });

  const fine = planeAt(0, 30, 0);

  expect(stepPlane(fine, control(Number.NaN, 0, 13), FREE, STATIONS, FLAT, STEP_60)).toBe('reset');

  expect(fine.pos).toEqual(HOME_ORBIT);
  expect(stepPlane(planeAt(0, 30, 0), control(0, 0, 13), FREE, STATIONS, FLAT, STEP_60)).toBe('ok');
});

caseTest('integrate.dt.guard', 'dt is clamped and sanitised', () => {
  const long = planeAt(0, 30, 0, { yaw: 0.4 });
  const capped = planeAt(0, 30, 0, { yaw: 0.4 });

  stepPlane(long, control(0.5, 0.2, 26), FREE, STATIONS, FLAT, 1);
  stepPlane(capped, control(0.5, 0.2, 26), FREE, STATIONS, FLAT, 0.05);

  expect(long).toEqual(capped);

  for (const dt of [Number.NaN, -1]) {
    const plane = planeAt(0, 30, 0, { yaw: 0.4 });

    stepPlane(plane, control(0.5, 0.2, 26), FREE, STATIONS, FLAT, dt);
    expect(plane).toEqual(planeAt(0, 30, 0, { yaw: 0.4 }));
  }
});

caseTest('integrate.docked.ignores-control', 'docked flight ignores input', () => {
  const dock = { x: 12.346153846153847, y: 44, z: -52.73076923076923 };
  const mode: FlightMode = { kind: 'docked', station: 3, dock };
  const steered = planeAt(13.5, 25, -55.5, { yaw: 2 });
  const idle = planeAt(13.5, 25, -55.5, { yaw: 2 });

  for (let step = 0; step < 120; step += 1) {
    stepPlane(steered, control(1, 1, 26), mode, STATIONS, CLIFF, STEP_60);
    stepPlane(idle, control(0, 0, 0), mode, STATIONS, CLIFF, STEP_60);
  }

  expect(steered).toEqual(idle);
});

caseTest('integrate.docked.hover', 'docking stops the plane facing the beacon', () => {
  const dock = { x: 12.346153846153847, y: 44, z: -52.73076923076923 };
  const mode: FlightMode = { kind: 'docked', station: 3, dock };
  const plane = planeAt(13.5, 25, -55.5, { yaw: 2 });
  const beacon = stationAt(3);

  for (let step = 0; step < 60; step += 1) {
    stepPlane(plane, control(0, 0, 13), mode, STATIONS, CLIFF, STEP_60);
  }

  expect(plane.pos).toEqual({
    x: 12.660613607346937,
    y: 38.82189593235377,
    z: -53.485472657632656,
  });

  expect(plane).toMatchObject({
    yaw: -0.12944070001895677,
    roll: 0.12056807052291649,
    speed: 3.5429133094421563,
  });

  for (let step = 0; step < 540; step += 1) {
    stepPlane(plane, control(0, 0, 13), mode, STATIONS, CLIFF, STEP_60);
  }

  expect(plane.speed).toBe(0.000029384282290752912);

  const face = Math.atan2(beacon.x - plane.pos.x, beacon.z - plane.pos.z);

  expect(Math.abs(plane.yaw - face)).toBeLessThan(1e-8);
});
