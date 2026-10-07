export type IntegrateCaseSource = 'prototype' | 'spec' | 'scene-rule';

export type IntegrateCase = Readonly<{
  id: string;
  source: IntegrateCaseSource;
  reference: string;
  expected: string;
}>;

const PROTO_INTEGRATE = 'prototype docs/prototype/index.html :1296–1337 (integrate)';
const FLOOR = 'spec FR-016 / SC-007 (≥ 2.5 above terrain or water in every sampled frame)';
const CEILING = 'spec FR-017 / SC-007 (never above 80; pitched down from 72)';
const EDGE = 'spec FR-018 / SC-006 (turns back beyond 18, firmer farther, never stops)';
const DOCKED = 'spec FR-022 / FR-024; prototype :1297–1309 (dock hover)';

export const INTEGRATE_CASES = [
  {
    id: 'integrate.speed.ease',
    source: 'spec',
    reference: 'spec FR-013 (speed changes ease in); prototype :1321 (rate 1.5), evaluated',
    expected:
      'from cruise with boost for 1 s at 1/60: speed 23.099307918070423 = 13 + 13·(1 − e^−1.5)',
  },
  {
    id: 'integrate.free.one-second',
    source: 'prototype',
    reference: `${PROTO_INTEGRATE}, evaluated: flat, (0, 30, 0), yaw 0.4, speed 13, control (0.5, −0.3, 26), 60 × 1/60`,
    expected:
      'pos (11.109440792093212, 28.04128789641234, 15.468232696763764), yaw 0.8654681497156984, pitch −0.13768725020641512, roll −0.33310160707736525, speed 23.099307918070423, turn 0.49663102650045726',
  },
  {
    id: 'integrate.floor.descend',
    source: 'spec',
    reference: `${FLOOR}; synthetic flat 10, ridge 40, water 2; 30 s descend + boost at 1/60 and at 0.05`,
    expected: 'after every step y ≥ max(height under the plane, sea 7) + 2.5',
  },
  {
    id: 'integrate.floor.clamp',
    source: 'prototype',
    reference: `${FLOOR}; ${PROTO_INTEGRATE} :1329–1330, evaluated: flat, y 12.5, pitch −1.5, speed 26, climb −1, dt 0.05; water, y 9.5, same dive`,
    expected: 'y is exactly 12.5 over land and exactly 9.5 (sea 7 + 2.5) over water after the step',
  },
  {
    id: 'integrate.floor.climb-assist',
    source: 'spec',
    reference: `spec FR-016 (terrain ahead makes it climb); ${PROTO_INTEGRATE} :1314–1317, evaluated: cliff at x ≥ 0, plane (−30, 25, 0) heading +x, no input`,
    expected:
      'pitch first turns positive at step 111 with x −5.733378439071125 and y 26.81208919455498, before the cliff',
  },
  {
    id: 'integrate.ceiling.climb',
    source: 'spec',
    reference: `${CEILING}; 30 s climb + boost from y 60`,
    expected: 'y never exceeds 80',
  },
  {
    id: 'integrate.ceiling.soft',
    source: 'prototype',
    reference: `${CEILING}; ${PROTO_INTEGRATE} :1318, evaluated: y 76, climb 1, dt 0.05`,
    expected: 'pitch −0.029375774353851136 and y 75.98090849273832',
  },
  {
    id: 'integrate.ceiling.clamp',
    source: 'prototype',
    reference: `${CEILING}; ${PROTO_INTEGRATE} :1331, evaluated: y 79.9, pitch 1.2, speed 26, climb 1, dt 0.05`,
    expected: 'y is exactly 80',
  },
  {
    id: 'integrate.edge.threshold',
    source: 'prototype',
    reference: `${EDGE}; ${PROTO_INTEGRATE} :1304–1308, evaluated: heading +z, dt 0.05`,
    expected: 'at x 81.5 yaw stays 0; at x 82.5 yaw becomes −0.04946974518821298',
  },
  {
    id: 'integrate.edge.firmer',
    source: 'prototype',
    reference: `${EDGE}; ${PROTO_INTEGRATE} :1307 (rate min(2.4, 0.6 + 0.08·beyond)), evaluated`,
    expected: 'at x 90 yaw −0.09443174060607051; at x 120 yaw −0.1776249626402601',
  },
  {
    id: 'integrate.edge.return',
    source: 'spec',
    reference: `${EDGE}; 8 headings × cruise and boost from (0, 30, 0), no input, 1/60; prototype worst 4.8 s`,
    expected:
      'back inside |x|,|z| ≤ 64 within 10 s of crossing 82 (worst 288 steps), speed never below 13',
  },
  {
    id: 'integrate.edge.held-turn',
    source: 'prototype',
    reference: `${EDGE}; 10 s straight then a held turn (±1) to 300 s, 8 headings × cruise and boost; prototype evaluated max 98.85528946366448`,
    expected: 'max |x|,|z| over the run is 98.85528946366448 (≤ 110)',
  },
  {
    id: 'integrate.reset.invalid',
    source: 'spec',
    reference:
      'spec FR-020; plan D-24 (Home orbit pose: radius 13, +10, θ 0.75π); prototype :1332–1336',
    expected:
      'a NaN position or a NaN control returns reset and leaves the plane on the Home orbit pose',
  },
  {
    id: 'integrate.dt.guard',
    source: 'prototype',
    reference: 'prototype :1494 (dt = min(0.05, max(0, Δ)))',
    expected: 'dt 1 gives the dt 0.05 result; dt NaN and dt −1 leave the plane unchanged',
  },
  {
    id: 'integrate.docked.ignores-control',
    source: 'spec',
    reference: DOCKED,
    expected: 'docked, control (1, 1, 26) moves the plane exactly as control (0, 0, 0)',
  },
  {
    id: 'integrate.docked.hover',
    source: 'prototype',
    reference: `${DOCKED}, evaluated: station 3, dock (12.346153846153847, 44, −52.73076923076923), start (13.5, 25, −55.5), yaw 2, speed 13`,
    expected:
      'after 1 s pos (12.660613607346937, 38.82189593235377, −53.485472657632656), yaw −0.12944070001895677, roll 0.12056807052291649, speed 3.5429133094421563; after 10 s speed 0.000029384282290752912 and yaw faces the beacon within 1e-8',
  },
] as const satisfies readonly IntegrateCase[];

export type IntegrateCaseId = (typeof INTEGRATE_CASES)[number]['id'];
