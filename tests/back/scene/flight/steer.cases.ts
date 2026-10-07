export type SteerCaseSource = 'prototype' | 'spec' | 'scene-rule';

export type SteerCase = Readonly<{
  id: string;
  source: SteerCaseSource;
  reference: string;
  expected: string;
}>;

const PROTO_STEER = 'prototype docs/prototype/index.html :395–408 (dead, readSteer, FLIGHT_KEYS)';
const SPEC_KEYS = 'spec FR-009 (W/↑ climb, S/↓ descend, A/← left, D/→ right)';

export const STEER_CASES = [
  {
    id: 'steer.keys.climb',
    source: 'spec',
    reference: SPEC_KEYS,
    expected: 'KeyW or ArrowUp gives climb 1, KeyS or ArrowDown gives climb −1, turn 0',
  },
  {
    id: 'steer.keys.turn',
    source: 'spec',
    reference: SPEC_KEYS,
    expected: 'KeyA or ArrowLeft gives turn 1, KeyD or ArrowRight gives turn −1, climb 0',
  },
  {
    id: 'steer.keys.opposite-cancel',
    source: 'prototype',
    reference: `${PROTO_STEER} :400–401`,
    expected: 'W with S and A with D give 0 on both axes',
  },
  {
    id: 'steer.keys.flight-codes',
    source: 'prototype',
    reference: `${PROTO_STEER} :408`,
    expected:
      'FLIGHT_KEY_CODES is exactly KeyW KeyA KeyS KeyD ArrowUp ArrowDown ArrowLeft ArrowRight',
  },
  {
    id: 'steer.stick.dead-zone',
    source: 'prototype',
    reference: `${PROTO_STEER} :395 dead zone 0.12; spec FR-011 (with a dead zone)`,
    expected: 'a deflection of 0.11·R on either axis gives 0',
  },
  {
    id: 'steer.stick.half',
    source: 'prototype',
    reference: `${PROTO_STEER} :395, :399 (t = −dead(x/R)); evaluated −0.4318181818181818`,
    expected: 'dx = 0.5·R gives turn −(0.5−0.12)/0.88; dy = 0.5·R gives climb −(0.5−0.12)/0.88',
  },
  {
    id: 'steer.stick.saturates',
    source: 'prototype',
    reference: `${PROTO_STEER} :395 (min 1)`,
    expected: 'dx = −1.5·R gives turn 1 and dy = −1.5·R gives climb 1',
  },
  {
    id: 'steer.stick.inactive',
    source: 'prototype',
    reference: `${PROTO_STEER} :399 (joystick only while pressed)`,
    expected: 'an inactive stick with a deflection gives 0 on both axes',
  },
  {
    id: 'steer.keys.override-stick-per-axis',
    source: 'spec',
    reference: 'spec FR-011 (keyboard overrides the stick on the axes it uses); prototype :402–403',
    expected: 'stick at (0.5·R, 0.5·R) with KeyW keeps the stick turn and sets climb 1',
  },
  {
    id: 'steer.boost.shift',
    source: 'spec',
    reference: 'spec FR-010 (Shift, either side); prototype :406',
    expected: 'ShiftLeft or ShiftRight sets boost; no Shift and no touch boost leaves it false',
  },
  {
    id: 'steer.boost.touch',
    source: 'spec',
    reference: 'spec FR-012 (boost while the touch Boost is held); prototype :406',
    expected: 'boostHeld true sets boost with no keys pressed',
  },
  {
    id: 'steer.magnitude',
    source: 'prototype',
    reference: `${PROTO_STEER} :405 (mag = hypot(t, c))`,
    expected: 'W with A gives magnitude √2; stick (0.5·R, 0) gives magnitude (0.5−0.12)/0.88',
  },
  {
    id: 'steer.non-finite',
    source: 'prototype',
    reference: `${PROTO_STEER} :404 (non-finite axes become 0)`,
    expected: 'a NaN stick deflection gives turn 0, climb 0, magnitude 0',
  },
  {
    id: 'steer.no-allocation',
    source: 'scene-rule',
    reference: 'rules/scene-3d.md §4 (nothing allocates per frame)',
    expected: 'with an out object passed, steerFrom returns that same object',
  },
] as const satisfies readonly SteerCase[];

export type SteerCaseId = (typeof STEER_CASES)[number]['id'];
