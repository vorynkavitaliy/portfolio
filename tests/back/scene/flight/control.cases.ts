export type ControlCaseSource = 'prototype' | 'spec' | 'scene-rule';

export type ControlCase = Readonly<{
  id: string;
  source: ControlCaseSource;
  reference: string;
  expected: string;
}>;

const PROTO_CONTROL = 'prototype docs/prototype/index.html :1266–1294 (steerFor)';
const ORBIT = `${PROTO_CONTROL} :1268–1279, evaluated on the fixture stations (top y 11)`;
const AUTO = `${PROTO_CONTROL} :1281–1291, evaluated on the fixture terrains`;

export const CONTROL_CASES = [
  {
    id: 'control.free.cruise',
    source: 'spec',
    reference: 'spec FR-013 (13 blocks/s); prototype :1267, :1293',
    expected: 'free mode passes turn 0.4 and climb −0.7 through with speed 13',
  },
  {
    id: 'control.free.boost',
    source: 'spec',
    reference: 'spec FR-010 (double the cruise speed); prototype :1267',
    expected: 'free mode with boost asks for speed 26',
  },
  {
    id: 'control.orbit.side-plus',
    source: 'prototype',
    reference: `${ORBIT}: placeOnOrbit(2, 1.0), x + 1, y + 2, yaw + 0.1, sgn +1`,
    expected: 'turn 0.32054114983164217, climb −1/3, speed 3.9, whatever the steer',
  },
  {
    id: 'control.orbit.side-minus',
    source: 'prototype',
    reference: `${ORBIT}: same pose, sgn −1`,
    expected: 'turn 1, climb −1/3, speed 3.9',
  },
  {
    id: 'control.orbit.centre-guard',
    source: 'prototype',
    reference: `${ORBIT} :1271 (r < 0.01 → rx 0.01): plane over station 0 at y 30, yaw 2`,
    expected: 'turn 0.6139816339744828, climb −1, speed 3.9',
  },
  {
    id: 'control.intro.orbits-home',
    source: 'prototype',
    reference: `${ORBIT}; intro runs as orbit around station 0 (:1233, :1594–1605)`,
    expected: 'intro mode gives the same control as the centre-guard case around station 0',
  },
  {
    id: 'control.autopilot.clearance',
    source: 'spec',
    reference: `spec FR-032 (safe altitude over terrain); ${AUTO}: cliff, target 5, plane (−20, 45, 6.5), yaw π/2`,
    expected: 'turn 0, climb 0.5 (toward cliff 40 + 9), speed 13',
  },
  {
    id: 'control.autopilot.heading',
    source: 'prototype',
    reference: `${AUTO}: cliff, target 5, plane (−20, 45, 6.5), yaw 1.2`,
    expected: 'turn 0.8157519189487726, climb 0.5, speed 13',
  },
  {
    id: 'control.autopilot.near-slows',
    source: 'spec',
    reference: `spec FR-032 (slows near the target); ${AUTO}: flat, target 5, plane (20, 30, 0), yaw π/2`,
    expected: 'turn −0.52917534548099, climb −1, speed 8',
  },
  {
    id: 'control.autopilot.boost',
    source: 'spec',
    reference: `spec FR-032 (boost works on autopilot); ${AUTO}`,
    expected: 'the near case with boost asks for speed 26',
  },
  {
    id: 'control.autopilot.arrived',
    source: 'prototype',
    reference: `${AUTO} :1288 (dist < 0.5 → turn 0): plane (46.7, 21, 6.5)`,
    expected: 'turn 0, climb 0, speed 8',
  },
] as const satisfies readonly ControlCase[];

export type ControlCaseId = (typeof CONTROL_CASES)[number]['id'];
