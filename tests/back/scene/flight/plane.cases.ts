export type PlaneCaseSource = 'prototype' | 'spec' | 'scene-rule';

export type PlaneCase = Readonly<{
  id: string;
  source: PlaneCaseSource;
  reference: string;
  expected: string;
}>;

const PROTO_PLANE = 'prototype docs/prototype/index.html :1219–1232 (plane, placeOnOrbit)';

export const PLANE_CASES = [
  {
    id: 'plane.create',
    source: 'prototype',
    reference: `${PROTO_PLANE} :1221 (speed ORBIT_R·ORBIT_W)`,
    expected: 'a new plane is at the origin, level, turn 0, speed 13·0.3 = 3.9',
  },
  {
    id: 'plane.orbit-pose',
    source: 'prototype',
    reference: `${PROTO_PLANE} :1227–1232, evaluated for top (−45.5, 11, 40.5) and θ 0.75π`,
    expected:
      'position (−36.30761184457488, 21, 31.307611844574883), yaw −2.356194490192345, pitch, roll and turn 0, speed 3.9',
  },
  {
    id: 'plane.orbit-pose.resets-attitude',
    source: 'prototype',
    reference: `${PROTO_PLANE} :1230–1231`,
    expected: 'a banked, pitched, turning, fast plane is levelled with turn 0 and speed 3.9',
  },
  {
    id: 'plane.valid',
    source: 'prototype',
    reference: 'prototype :1334 (isFinite over position, yaw, pitch, roll, speed, turn)',
    expected: 'a finite plane is valid; NaN or ±Infinity in any of the eight fields is invalid',
  },
] as const satisfies readonly PlaneCase[];

export type PlaneCaseId = (typeof PLANE_CASES)[number]['id'];
