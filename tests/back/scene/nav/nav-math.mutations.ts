import type { NavMathCaseId } from '@tests/back/scene/nav/nav-math.cases';

export type NavMathMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly NavMathCaseId[];
}>;

const NAV = 'src/scene/nav/nav-math.ts';

export const NAV_MATH_MUTATIONS: readonly NavMathMutation[] = [
  {
    id: 'target.autopilot-ignored',
    file: NAV,
    find: "  if (mode.kind === 'autopilot') {\n    return mode.target;\n  }",
    replace: '',
    caseIds: ['nav.target.autopilot'],
  },
  {
    id: 'target.visited-ignored',
    file: NAV,
    find: 'if (station === undefined || (visited & (1 << index)) !== 0) {',
    replace: 'if (station === undefined) {',
    caseIds: ['nav.target.nearest-unvisited', 'nav.target.none'],
  },
  {
    id: 'target.tie-last',
    file: NAV,
    find: 'if (distance < bestDistance) {',
    replace: 'if (distance <= bestDistance) {',
    caseIds: ['nav.target.tie'],
  },
  {
    id: 'label.front-inclusive',
    file: NAV,
    find: 'viewZ < FRONT_Z',
    replace: 'viewZ <= FRONT_Z',
    caseIds: ['nav.label.front'],
  },
  {
    id: 'label.ndc-x',
    file: NAV,
    find: 'NDC_X = 0.94',
    replace: 'NDC_X = 0.95',
    caseIds: ['nav.label.screen-bounds'],
  },
  {
    id: 'label.ndc-y',
    file: NAV,
    find: 'NDC_Y = 0.92',
    replace: 'NDC_Y = 0.94',
    caseIds: ['nav.label.screen-bounds'],
  },
  {
    id: 'label.y-sign',
    file: NAV,
    find: 'Math.abs(ndcY) < NDC_Y',
    replace: 'ndcY < NDC_Y',
    caseIds: ['nav.label.screen-bounds'],
  },
  {
    id: 'label.range',
    file: NAV,
    find: 'LABEL_RANGE = 160',
    replace: 'LABEL_RANGE = 161',
    caseIds: ['nav.label.range'],
  },
  {
    id: 'label.target-unlimited-ignored',
    file: NAV,
    find: '(distance < LABEL_RANGE || isTarget)',
    replace: 'distance < LABEL_RANGE',
    caseIds: ['nav.label.range'],
  },
  {
    id: 'label.target-always',
    file: NAV,
    find: 'return isOnScreen(viewZ, ndcX, ndcY) && (distance < LABEL_RANGE || isTarget);',
    replace: 'return isTarget || (isOnScreen(viewZ, ndcX, ndcY) && distance < LABEL_RANGE);',
    caseIds: ['nav.label.target-behind'],
  },
  {
    id: 'label.lift',
    file: NAV,
    find: 'LABEL_LIFT = 12',
    replace: 'LABEL_LIFT = 10',
    caseIds: ['nav.label.lift'],
  },
  {
    id: 'edge.pad',
    file: NAV,
    find: 'EDGE_PAD = { x: 80, y: 56 }',
    replace: 'EDGE_PAD = { x: 80, y: 60 }',
    caseIds: ['nav.edge.diagonal', 'nav.edge.narrow', 'nav.edge.no-allocation'],
  },
  {
    id: 'edge.pad-x',
    file: NAV,
    find: 'EDGE_PAD = { x: 80, y: 56 }',
    replace: 'EDGE_PAD = { x: 70, y: 56 }',
    caseIds: ['nav.edge.zero', 'nav.edge.non-finite'],
  },
  {
    id: 'edge.angle',
    file: NAV,
    find: 'out.angle = Math.atan2(ex, -ey);',
    replace: 'out.angle = Math.atan2(ex, ey);',
    caseIds: ['nav.edge.diagonal', 'nav.edge.narrow'],
  },
  {
    id: 'edge.y-flip-dropped',
    file: NAV,
    find: 'let ey = -camY;',
    replace: 'let ey = camY;',
    caseIds: ['nav.edge.diagonal', 'nav.edge.narrow'],
  },
  {
    id: 'edge.nan-guard',
    file: NAV,
    find: 'if (length >= EDGE_MIN_LENGTH) {',
    replace: 'if (!(length < EDGE_MIN_LENGTH)) {',
    caseIds: ['nav.edge.non-finite'],
  },
  {
    id: 'edge.out-ignored',
    file: NAV,
    find: '  return out;\n};',
    replace: '  return { ...out };\n};',
    caseIds: ['nav.edge.no-allocation'],
  },
];
