export type ActorsCaseSource =
  | 'prototype'
  | 'spec'
  | 'scene-rule'
  | 'motion-tokens'
  | 'owner-2026-10-07'
  | 'three-docs'
  | 'wcag';

export type ActorsCase = Readonly<{
  id: string;
  source: ActorsCaseSource;
  reference: string;
  expected: string;
}>;

const LETTERS = 'prototype :1126–1136 (placeLetters), :1512–1515 (intro, bob), :1524 (billboard)';
const BEAMS = 'prototype :1538–1544 (per-beam intensity), :1058–1060 (beam shader)';
const RING = 'prototype :1545–1550 (ring), :1062; motion-tokens ring 1.3 s';
const BURST = 'prototype :1551 (burst), :1064–1081; motion-tokens burst 1.4 s';
const PLANE = 'prototype :1138–1164 (model), :1526–1528 (pose), :1529–1530 (prop, strobe)';
const MAST = 'prototype :1531 (mast blink 1.2 Hz), :1166–1168';
const LINK = 'prototype :1391–1426 (link beam and 5 packets)';
const AI = 'prototype :1169–1176 (nodes, line), :1557–1566 (packets)';

const REDUCED =
  'plan §1 reduced motion: no letter assembly, shake, burst, flash; decorative time frozen';

const WCAG =
  'WCAG 2.3.3 Animation from Interactions; owner rule FR-039 spirit, orchestrator 2026-10-07';

const BUDGET = 'plan S18 (plane parts merged by material, at most 4 draw calls)';

const BLOOM =
  'plan D-2 and S18 review focus (no bloom composer on narrow; render targets disposed)';

const DISPOSE = 'scene-3d.md §4 (dispose every geometry, material, texture, render target)';

export const ACTORS_CASES = [
  {
    id: 'actors.letters.ease',
    source: 'prototype',
    reference: LETTERS,
    expected:
      'progress is easeOut(clamp01((k − delay) / 0.45)): 0 at the delay, 0.875 at +0.225, 1 at +0.45 and after',
  },
  {
    id: 'actors.letters.matrix',
    source: 'prototype',
    reference: LETTERS,
    expected:
      'scale 0.72·(0.4 + 0.6·t), position lerp start→target; k 0 = start at 0.288, k 2 = target at 0.72',
  },
  {
    id: 'actors.letters.intro-k',
    source: 'prototype',
    reference: `${LETTERS}; ${REDUCED}`,
    expected: 'k = progress·1.6 while the intro runs; 2 when done or under reduced motion',
  },
  {
    id: 'actors.letters.bob',
    source: 'prototype',
    reference: LETTERS,
    expected: 'y = base + sin(time·0.8)·0.25; exactly base under reduced motion',
  },
  {
    id: 'actors.letters.billboard',
    source: 'prototype',
    reference: LETTERS,
    expected: 'yaw = atan2(camera.x − group.x, camera.z − group.z)',
  },
  {
    id: 'actors.letters.module',
    source: 'prototype',
    reference: `${LETTERS}; ${REDUCED}`,
    expected:
      'group at Home top + 17; intro start scatters the cells, intro done and reduced motion place the targets',
  },
  {
    id: 'actors.beam.active',
    source: 'prototype',
    reference: BEAMS,
    expected: 'docked station 0.6, autopilot target 0.3, others 0; docked wins',
  },
  {
    id: 'actors.beam.intensity',
    source: 'prototype',
    reference: BEAMS,
    expected: 'core = 0.55 + active + boost; halo = 0.16 + 0.3·active + 0.4·boost',
  },
  {
    id: 'actors.beam.module',
    source: 'prototype',
    reference: BEAMS,
    expected:
      'per-instance intensity attributes carry the formula for docked, target and boosted beams',
  },
  {
    id: 'actors.ring.pose',
    source: 'prototype',
    reference: RING,
    expected:
      'scale 0.5 + easeOut(t)·scale, opacity (1 − t)·0.9; hidden from t = 1 and under reduced motion',
  },
  {
    id: 'actors.burst.visible',
    source: 'prototype',
    reference: BURST,
    expected: 'drawn while t < 1; hidden at 1 and under reduced motion',
  },
  {
    id: 'actors.effects.module',
    source: 'prototype',
    reference: `${RING}; ${BURST}; ${REDUCED}`,
    expected: 'ring and burst follow EffectsState; hidden under reduced motion',
  },
  {
    id: 'actors.plane.pose',
    source: 'prototype',
    reference: PLANE,
    expected: 'position = plane.pos, Euler (−pitch, yaw, roll) in order YXZ',
  },
  {
    id: 'actors.plane.prop',
    source: 'prototype',
    reference: PLANE,
    expected: 'prop turns dt·(30 + 2·speed) rad; static under reduced motion',
  },
  {
    id: 'actors.plane.strobe',
    source: 'prototype',
    reference: PLANE,
    expected: 'lit while time mod 1.4 < 0.1; always lit under reduced motion',
  },
  {
    id: 'actors.plane.module',
    source: 'prototype',
    reference: `${PLANE}; ${REDUCED}`,
    expected: 'the module applies pose, prop spin and strobe; reduced motion freezes the prop',
  },
  {
    id: 'actors.mast.blink',
    source: 'prototype',
    reference: MAST,
    expected: 'visible while floor(time·1.2) is even',
  },
  {
    id: 'actors.mast.reduced',
    source: 'wcag',
    reference: WCAG,
    expected: 'the mast light is steady under reduced motion',
  },
  {
    id: 'actors.link.segment',
    source: 'prototype',
    reference: LINK,
    expected:
      'midpoint, unit direction and length from the plane to the station top + 3; none below 0.05',
  },
  {
    id: 'actors.link.packets',
    source: 'prototype',
    reference: LINK,
    expected:
      'u = (time·0.8 + i/5) mod 1; scale 0.18 + 0.32·sin(π·u); pulse 0.7 + 0.25·sin(5·time)',
  },
  {
    id: 'actors.link.module',
    source: 'prototype',
    reference: LINK,
    expected: 'visible only while docked; the line spans plane to station beacon',
  },
  {
    id: 'actors.ai.packets',
    source: 'prototype',
    reference: AI,
    expected: 'packet i runs segment i mod 3 at u = (time·0.55 + i/6) mod 1',
  },
  {
    id: 'actors.ai.packets-reduced',
    source: 'wcag',
    reference: WCAG,
    expected: 'the packets hold their start phase under reduced motion',
  },
  {
    id: 'actors.geometry.boxes',
    source: 'prototype',
    reference: PLANE,
    expected: 'merged boxes: 24 vertices and 36 indices each, outward winding, requested extents',
  },
  {
    id: 'actors.budget.plane',
    source: 'scene-rule',
    reference: BUDGET,
    expected: 'the plane is four meshes sharing two materials',
  },
  {
    id: 'actors.bloom.profile',
    source: 'scene-rule',
    reference: BLOOM,
    expected: 'narrow offers no bloom; desktop offers a factory',
  },
  {
    id: 'actors.bloom.lifecycle',
    source: 'scene-rule',
    reference: BLOOM,
    expected: 'the pass renders the scene and camera it is given and disposes its targets',
  },
  {
    id: 'actors.dispose',
    source: 'scene-rule',
    reference: DISPOSE,
    expected: 'every geometry and material of every module is disposed',
  },
] as const satisfies readonly ActorsCase[];

export type ActorsCaseId = (typeof ACTORS_CASES)[number]['id'];
