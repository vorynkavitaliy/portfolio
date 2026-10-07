import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, expect } from 'vitest';

import { caseTest } from '@tests/front/ui/scene/nav-overlay.case-test';
import { watchTransforms } from '@tests/front/ui/scene/style-spy';
import { createNavOverlay } from '@/scene/nav/nav-overlay';

import type { NavFrame, NavOverlay } from '@/scene/nav/nav-overlay';
import type { StationId } from '@/core/world/stations';

const IDS: readonly StationId[] = ['home-base', 'llm-product', 'marketplace-chat'];
const LABELS = ['Alpha', 'Beta', 'Gamma'] as const;
const TEMPLATE = '{name} · {distance}m';
const WIDTH = 1280;
const HEIGHT = 800;
const PLANE = { x: 0, y: 30, z: 0 };

let root: HTMLElement;
let overlay: NavOverlay;
let camera: PerspectiveCamera;

const frameOf = (stations: NavFrame['stations'], targetIndex: number, plane = PLANE): NavFrame => {
  return { camera, plane, stations, targetIndex, width: WIDTH, height: HEIGHT };
};

const labelOf = (id: StationId): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-nav-label="${id}"]`);

  if (element === null) {
    throw new Error(`no label ${id}`);
  }

  return element;
};

const edgeOf = (): HTMLElement => {
  const element = root.querySelector<HTMLElement>('[data-nav-edge]');

  if (element === null) {
    throw new Error('no edge');
  }

  return element;
};

const AHEAD = { x: 0, y: 18, z: -60 };
const BEHIND = { x: 0, y: 48, z: 60 };
const RIGHT = { x: 400, y: 18, z: -60 };
const OFF_SIDE = { x: 120, y: 18, z: -60 };

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  camera = new PerspectiveCamera(52, WIDTH / HEIGHT, 0.1, 900);
  camera.position.set(0, 30, 0);
  camera.lookAt(0, 30, -100);
  camera.updateMatrixWorld(true);
  overlay = createNavOverlay({ root, stationIds: IDS, labels: LABELS, template: TEMPLATE });
});

afterEach(() => {
  overlay.dispose();
  root.remove();
});

caseTest('nav.dom', 'labels and a hidden edge', () => {
  const labels = [...root.querySelectorAll<HTMLElement>('[data-nav-label]')];

  expect(
    labels.map((label) => {
      return label.dataset['navLabel'];
    }),
  ).toEqual([...IDS]);

  expect(
    labels.every((label) => {
      return label.dataset['visible'] === 'false';
    }),
  ).toBe(true);

  expect(
    labels.some((label) => {
      return label.hasAttribute('data-target');
    }),
  ).toBe(false);

  expect(edgeOf().hidden).toBe(true);
  expect(edgeOf().querySelector('.nav-edge-arrow')).not.toBeNull();
  expect(edgeOf().querySelector('.nav-edge-name')).not.toBeNull();
});

caseTest('nav.text', 'template, distance and position', () => {
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], -1));

  const label = labelOf('home-base');

  expect(label.textContent).toBe('Alpha · 61m');
  expect(label.dataset['visible']).toBe('true');
  expect(label.style.transform).toBe('translate(640px, 400px) translate(-50%, -100%)');
});

caseTest('nav.projection', 'the label follows the lifted station top', () => {
  const side = { x: 40, y: 28, z: -100 };

  overlay.update(frameOf([AHEAD, side, RIGHT], -1));

  const ndc = new Vector3(side.x, side.y + 12, side.z).project(camera);
  const x = Math.round((ndc.x * 0.5 + 0.5) * WIDTH);
  const y = Math.round((-ndc.y * 0.5 + 0.5) * HEIGHT);

  expect(labelOf('llm-product').dataset['visible']).toBe('true');

  expect(labelOf('llm-product').style.transform).toBe(
    `translate(${x}px, ${y}px) translate(-50%, -100%)`,
  );

  expect(y).toBeLessThan(HEIGHT / 2);
  expect(x).toBeGreaterThan(WIDTH / 2);
});

caseTest('nav.visible', 'range, side and behind', () => {
  overlay.update(frameOf([AHEAD, BEHIND, OFF_SIDE], -1));
  expect(labelOf('home-base').dataset['visible']).toBe('true');
  expect(labelOf('llm-product').dataset['visible']).toBe('false');
  expect(labelOf('marketplace-chat').dataset['visible']).toBe('false');

  const far = { x: 0, y: 18, z: -170 };

  overlay.update(frameOf([far, BEHIND, RIGHT], -1));
  expect(labelOf('home-base').dataset['visible']).toBe('false');
  overlay.update(frameOf([far, BEHIND, RIGHT], 0));
  expect(labelOf('home-base').dataset['visible']).toBe('true');
  expect(labelOf('home-base').textContent).toBe('Alpha · 170m');
});

caseTest('nav.target', 'only the target is marked', () => {
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 1));
  expect(labelOf('llm-product').hasAttribute('data-target')).toBe(true);
  expect(labelOf('home-base').hasAttribute('data-target')).toBe(false);
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 0));
  expect(labelOf('llm-product').hasAttribute('data-target')).toBe(false);
  expect(labelOf('home-base').hasAttribute('data-target')).toBe(true);
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], -1));
  expect(root.querySelector('[data-target]')).toBeNull();
});

caseTest('nav.edge', 'the edge follows an off-screen target', () => {
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 1));
  expect(edgeOf().hidden).toBe(false);
  expect(edgeOf().querySelector('.nav-edge-name')?.textContent).toBe('Beta · 63m');
  expect(edgeOf().style.transform).toBe('translate(640px, 56px) translate(-50%, -50%)');
  expect(labelOf('llm-product').dataset['visible']).toBe('false');
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 0));
  expect(edgeOf().hidden).toBe(true);
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 2));
  expect(edgeOf().hidden).toBe(false);
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], -1));
  expect(edgeOf().hidden).toBe(true);
});

caseTest('nav.edge-angle', 'a right target turns the arrow', () => {
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 2));
  expect(edgeOf().style.transform).toBe('translate(1200px, 400px) translate(-50%, -50%)');

  expect(edgeOf().querySelector<HTMLElement>('.nav-edge-arrow')?.style.transform).toBe(
    'rotate(1.571rad)',
  );

  expect(edgeOf().querySelector('.nav-edge-name')?.textContent).toBe('Gamma · 405m');
});

caseTest('nav.no-redundant-writes', 'an identical frame changes nothing', () => {
  const frame = frameOf([AHEAD, BEHIND, RIGHT], 1);

  overlay.update(frame);
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 0));

  const observer = new MutationObserver(() => {
    return undefined;
  });

  const watch = watchTransforms([
    ...root.querySelectorAll<HTMLElement>('[data-nav-label], [data-nav-edge], .nav-edge-arrow'),
  ]);

  observer.observe(root, { attributes: true, childList: true, subtree: true, characterData: true });
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 0));
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 0));
  expect(observer.takeRecords()).toHaveLength(0);
  expect(watch.writes()).toBe(0);
  const wider = { ...frame, width: WIDTH + 100 };

  overlay.update(wider);
  expect(observer.takeRecords().length).toBeGreaterThan(0);
  expect(watch.writes()).toBeGreaterThan(0);
  watch.reset();
  overlay.update(wider);
  overlay.update(wider);
  expect(watch.writes()).toBe(0);
  observer.disconnect();
  watch.restore();
});

caseTest('nav.set-visible', 'the layer fades with opacity', () => {
  overlay.setVisible(true);
  expect(root.style.opacity).toBe('1');
  overlay.setVisible(false);
  expect(root.style.opacity).toBe('0');
});

caseTest('nav.dispose', 'everything is removed', () => {
  overlay.update(frameOf([AHEAD, BEHIND, RIGHT], 1));
  overlay.dispose();
  expect(root.querySelector('[data-nav-label]')).toBeNull();
  expect(root.querySelector('[data-nav-edge]')).toBeNull();
  expect(root.children).toHaveLength(0);
});
