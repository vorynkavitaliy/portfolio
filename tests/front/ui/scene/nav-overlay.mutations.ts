import type { NavOverlayCaseId } from '@tests/front/ui/scene/nav-overlay.cases';

export type NavOverlayMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly NavOverlayCaseId[];
}>;

const OVERLAY = 'src/scene/nav/nav-overlay.ts';

export const NAV_OVERLAY_MUTATIONS: readonly NavOverlayMutation[] = [
  {
    id: 'dom.label-id',
    file: OVERLAY,
    find: "element.dataset['navLabel'] = id;",
    replace: "element.dataset['navLabel'] = '';",
    caseIds: ['nav.dom'],
  },
  {
    id: 'dom.initial-visible',
    file: OVERLAY,
    find: "  element.dataset['visible'] = 'false';\n",
    replace: '',
    caseIds: ['nav.dom'],
  },
  {
    id: 'dom.edge-shown',
    file: OVERLAY,
    find: '  edge.hidden = true;\n',
    replace: '',
    caseIds: ['nav.dom'],
  },
  {
    id: 'dom.arrow-class',
    file: OVERLAY,
    find: "arrow.className = 'nav-edge-arrow';",
    replace: '',
    caseIds: ['nav.dom'],
  },
  {
    id: 'dom.name-class',
    file: OVERLAY,
    find: "name.className = 'nav-edge-name';",
    replace: '',
    caseIds: ['nav.dom'],
  },
  {
    id: 'text.lift',
    file: OVERLAY,
    find: 'const y = station.y + LABEL_LIFT;',
    replace: 'const y = station.y;',
    caseIds: ['nav.text', 'nav.projection'],
  },
  {
    id: 'text.distance-y',
    file: OVERLAY,
    find: 'const dy = station.y - frame.plane.y;',
    replace: 'const dy = 0;',
    caseIds: ['nav.text'],
  },
  {
    id: 'text.rounding',
    file: OVERLAY,
    find: 'const rounded = Math.round(distance);',
    replace: 'const rounded = Math.ceil(distance);',
    caseIds: ['nav.text'],
  },
  {
    id: 'text.x-offset',
    file: OVERLAY,
    find: '(ndcX * 0.5 + 0.5) * frame.width',
    replace: 'ndcX * 0.5 * frame.width',
    caseIds: ['nav.text', 'nav.projection'],
  },
  {
    id: 'text.y-flip',
    file: OVERLAY,
    find: '(-ndcY * 0.5 + 0.5)',
    replace: '(ndcY * 0.5 + 0.5)',
    caseIds: ['nav.projection'],
  },
  {
    id: 'visible.always',
    file: OVERLAY,
    find: 'const visible = labelVisible(viewZ, ndcX, ndcY, distance, isTarget);',
    replace: 'const visible = true;',
    caseIds: ['nav.visible'],
  },
  {
    id: 'visible.no-projection',
    file: OVERLAY,
    find: 'if (viewZ < 0) {',
    replace: 'if (viewZ < -1e9) {',
    caseIds: ['nav.visible', 'nav.projection', 'nav.edge'],
  },
  {
    id: 'visible.distance-dropped',
    file: OVERLAY,
    find: 'const dz = station.z - frame.plane.z;',
    replace: 'const dz = 0;',
    caseIds: ['nav.visible'],
  },
  {
    id: 'target.never-set',
    file: OVERLAY,
    find: "      slot.element.toggleAttribute('data-target', isTarget);\n",
    replace: '',
    caseIds: ['nav.target'],
  },
  {
    id: 'target.cache-stuck',
    file: OVERLAY,
    find: 'if (isTarget !== slot.target) {',
    replace: 'if (false) {',
    caseIds: ['nav.target'],
  },
  {
    id: 'edge.non-target',
    file: OVERLAY,
    find: 'if (isTarget && !isOnScreen(viewZ, ndcX, ndcY)) {',
    replace: 'if (!isOnScreen(viewZ, ndcX, ndcY)) {',
    caseIds: ['nav.edge'],
  },
  {
    id: 'edge.stays',
    file: OVERLAY,
    find: '      if (!edgeOn) {\n        setEdgeHidden(true);\n      }\n',
    replace: '',
    caseIds: ['nav.edge'],
  },
  {
    id: 'edge.name-dropped',
    file: OVERLAY,
    find: '      name.textContent = text;\n',
    replace: '',
    caseIds: ['nav.edge'],
  },
  {
    id: 'edge.position-swapped',
    file: OVERLAY,
    find: 'translate(${x}px, ${y}px) translate(-50%, -50%)',
    replace: 'translate(${y}px, ${x}px) translate(-50%, -50%)',
    caseIds: ['nav.edge', 'nav.edge-angle'],
  },
  {
    id: 'edge.angle-dropped',
    file: OVERLAY,
    find: 'rotate(${angle}rad)',
    replace: 'rotate(0rad)',
    caseIds: ['nav.edge-angle'],
  },
  {
    id: 'edge.angle-precision',
    file: OVERLAY,
    find: 'const ANGLE_PRECISION = 1000;',
    replace: 'const ANGLE_PRECISION = 100;',
    caseIds: ['nav.edge-angle'],
  },
  {
    id: 'edge.view-swapped',
    file: OVERLAY,
    find: 'placeEdge(viewX, viewY, frame,',
    replace: 'placeEdge(viewY, viewX, frame,',
    caseIds: ['nav.edge', 'nav.edge-angle'],
  },
  {
    id: 'writes.text',
    file: OVERLAY,
    find: 'if (slot.text !== text) {',
    replace: 'if (true) {',
    caseIds: ['nav.no-redundant-writes'],
  },
  {
    id: 'writes.position',
    file: OVERLAY,
    find: 'if (x !== slot.x || top !== slot.y) {',
    replace: 'if (true) {',
    caseIds: ['nav.no-redundant-writes'],
  },
  {
    id: 'writes.visible',
    file: OVERLAY,
    find: 'if (visible !== slot.visible) {',
    replace: 'if (true) {',
    caseIds: ['nav.no-redundant-writes'],
  },
  {
    id: 'writes.edge-position',
    file: OVERLAY,
    find: 'if (x !== edgeX || y !== edgeY) {',
    replace: 'if (true) {',
    caseIds: ['nav.no-redundant-writes'],
  },
  {
    id: 'writes.edge-hidden',
    file: OVERLAY,
    find: 'if (edgeShown === !hidden) {',
    replace: 'if (false) {',
    caseIds: ['nav.no-redundant-writes'],
  },
  {
    id: 'layer.inverted',
    file: OVERLAY,
    find: "root.dataset['on'] = visible ? 'true' : 'false';",
    replace: "root.dataset['on'] = visible ? 'false' : 'true';",
    caseIds: ['nav.set-visible'],
  },
  {
    id: 'dispose.labels',
    file: OVERLAY,
    find: '      slot.element.remove();\n',
    replace: '',
    caseIds: ['nav.dispose'],
  },
  {
    id: 'dispose.edge',
    file: OVERLAY,
    find: '      edge.remove();\n',
    replace: '',
    caseIds: ['nav.dispose'],
  },
];
