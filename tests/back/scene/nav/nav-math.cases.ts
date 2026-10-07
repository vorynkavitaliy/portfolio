export type NavMathCaseSource = 'prototype' | 'spec' | 'scene-rule';

export type NavMathCase = Readonly<{
  id: string;
  source: NavMathCaseSource;
  reference: string;
  expected: string;
}>;

const TARGET =
  'spec FR-030 (autopilot destination, else nearest station not yet docked); prototype :1437–1446';

const LABEL =
  'spec FR-029 (on screen and within 160 blocks; the target always); prototype :1453–1463';

const EDGE =
  'spec FR-030 (edge arrow toward an off-screen target); prototype :1472–1481, evaluated';

export const NAV_MATH_CASES = [
  {
    id: 'nav.target.autopilot',
    source: 'spec',
    reference: TARGET,
    expected: 'on autopilot to 3 the target is 3, even when 3 is visited',
  },
  {
    id: 'nav.target.nearest-unvisited',
    source: 'spec',
    reference: `${TARGET}; fixture stations, plane at the origin`,
    expected: 'nothing visited → 7; 7 visited → 4; free and docked modes agree',
  },
  {
    id: 'nav.target.tie',
    source: 'prototype',
    reference: `${TARGET} (strict <, first index wins); plane at (−43.5, 24.5) between stations 0 and 1`,
    expected: 'the target is 0',
  },
  {
    id: 'nav.target.none',
    source: 'prototype',
    reference: `${TARGET} (best stays −1)`,
    expected: 'with all nine visited the target is −1',
  },
  {
    id: 'nav.label.front',
    source: 'prototype',
    reference: `${LABEL} (front = view z < −0.5)`,
    expected: 'view z −0.5 hides the label; −0.51 shows it',
  },
  {
    id: 'nav.label.screen-bounds',
    source: 'prototype',
    reference: `${LABEL} (|x| < 0.94, |y| < 0.92)`,
    expected: 'ndc x ±0.94 or y ±0.92 hides it; 0.939 and 0.919 show it',
  },
  {
    id: 'nav.label.range',
    source: 'spec',
    reference: LABEL,
    expected: 'distance 160 hides a normal label, 159.9 shows it; the target shows at 500',
  },
  {
    id: 'nav.label.target-behind',
    source: 'prototype',
    reference: `${LABEL} (only labels in front are on)`,
    expected: 'the target behind the camera (view z 1) is hidden',
  },
  {
    id: 'nav.label.lift',
    source: 'prototype',
    reference: 'prototype :1453 (label anchor = beacon top + 12)',
    expected: 'LABEL_LIFT is 12',
  },
  {
    id: 'nav.edge.diagonal',
    source: 'prototype',
    reference: `${EDGE}: cam (3, 4) on 1440×900`,
    expected: 'x 1015.5, y 56, angle 0.6435011087932843',
  },
  {
    id: 'nav.edge.narrow',
    source: 'prototype',
    reference: `${EDGE}: cam (−0.2, −5) on 390×844`,
    expected: 'x 180.35999999999999, y 788, angle −3.1016139664665032',
  },
  {
    id: 'nav.edge.zero',
    source: 'prototype',
    reference: `${EDGE} (:1476 length < 1e-4 → (1, 0)): cam (0, 0) on 1440×900`,
    expected: 'x 1360, y 450, angle π/2',
  },
  {
    id: 'nav.edge.non-finite',
    source: 'prototype',
    reference: `${EDGE} (:1476 fallback direction), applied to a NaN camera position`,
    expected: 'cam (NaN, NaN) on 1440×900 gives the fallback x 1360, y 450, angle π/2',
  },
  {
    id: 'nav.edge.no-allocation',
    source: 'scene-rule',
    reference: 'rules/scene-3d.md §4 (nothing allocates per frame)',
    expected: 'with an out object passed, edgePlacement returns that same object',
  },
] as const satisfies readonly NavMathCase[];

export type NavMathCaseId = (typeof NAV_MATH_CASES)[number]['id'];
