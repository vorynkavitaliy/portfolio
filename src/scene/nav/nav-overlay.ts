import { fillTemplate } from '@/core/text/fill-template';
import { LABEL_LIFT, edgePlacement, isOnScreen, labelVisible } from '@/scene/nav/nav-math';

import type { StationId } from '@/core/world/stations';
import type { EdgePlacement } from '@/scene/nav/nav-math';
import type { PerspectiveCamera } from 'three';
import type { Vec3 } from '@/scene/flight/flight.types';

const EDGE_GLYPH = '▲';
const ANGLE_PRECISION = 1000;

export type NavFrame = Readonly<{
  camera: PerspectiveCamera;
  plane: Vec3;
  stations: readonly Vec3[];
  targetIndex: number;
  width: number;
  height: number;
}>;

export type NavOverlayOptions = Readonly<{
  root: HTMLElement;
  stationIds: readonly StationId[];
  labels: readonly string[];
  template: string;
}>;

export type NavOverlay = Readonly<{
  update: (frame: NavFrame) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}>;

type LabelSlot = {
  element: HTMLElement;
  visible: boolean;
  target: boolean;
  distance: number;
  x: number;
  y: number;
};

const createLabelSlot = (id: StationId): LabelSlot => {
  const element = document.createElement('div');

  element.dataset['navLabel'] = id;
  element.dataset['visible'] = 'false';

  return {
    element,
    visible: false,
    target: false,
    distance: Number.NaN,
    x: Number.NaN,
    y: Number.NaN,
  };
};

export const createNavOverlay = (options: NavOverlayOptions): NavOverlay => {
  const { root, stationIds, labels, template } = options;

  const slots: LabelSlot[] = stationIds.map((id) => {
    return createLabelSlot(id);
  });

  const texts: string[] = stationIds.map(() => {
    return '';
  });

  const edge = document.createElement('div');
  const arrow = document.createElement('i');
  const name = document.createElement('span');
  const placement: EdgePlacement = { x: 0, y: 0, angle: 0 };
  let edgeShown = false;
  let edgeText = '';
  let edgeX = Number.NaN;
  let edgeY = Number.NaN;
  let edgeAngle = Number.NaN;

  edge.dataset['navEdge'] = '';
  edge.hidden = true;
  arrow.className = 'nav-edge-arrow';
  arrow.textContent = EDGE_GLYPH;
  name.className = 'nav-edge-name';
  edge.append(arrow, name);

  for (const slot of slots) {
    root.append(slot.element);
  }

  root.append(edge);

  const textFor = (index: number, distance: number): string => {
    const slot = slots[index];

    if (slot === undefined) {
      return '';
    }

    if (slot.distance !== distance) {
      slot.distance = distance;
      texts[index] = fillTemplate(template, { name: labels[index] ?? '', distance });
    }

    return texts[index] ?? '';
  };

  const setEdgeHidden = (hidden: boolean): void => {
    if (edgeShown === !hidden) {
      return;
    }

    edgeShown = !hidden;
    edge.hidden = hidden;
  };

  const placeEdge = (camX: number, camY: number, frame: NavFrame, text: string): void => {
    const spot = edgePlacement(camX, camY, frame.width, frame.height, placement);
    const x = Math.round(spot.x);
    const y = Math.round(spot.y);
    const angle = Math.round(spot.angle * ANGLE_PRECISION) / ANGLE_PRECISION;

    if (x !== edgeX || y !== edgeY) {
      edgeX = x;
      edgeY = y;
      edge.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }

    if (angle !== edgeAngle) {
      edgeAngle = angle;
      arrow.style.transform = `rotate(${angle}rad)`;
    }

    if (text !== edgeText) {
      edgeText = text;
      name.textContent = text;
    }

    setEdgeHidden(false);
  };

  const updateSlot = (index: number, frame: NavFrame, slot: LabelSlot): boolean => {
    const station = frame.stations[index];

    if (station === undefined) {
      return false;
    }

    const view = frame.camera.matrixWorldInverse.elements;
    const projection = frame.camera.projectionMatrix.elements;
    const y = station.y + LABEL_LIFT;

    const viewX =
      (view[0] ?? 0) * station.x +
      (view[4] ?? 0) * y +
      (view[8] ?? 0) * station.z +
      (view[12] ?? 0);

    const viewY =
      (view[1] ?? 0) * station.x +
      (view[5] ?? 0) * y +
      (view[9] ?? 0) * station.z +
      (view[13] ?? 0);

    const viewZ =
      (view[2] ?? 0) * station.x +
      (view[6] ?? 0) * y +
      (view[10] ?? 0) * station.z +
      (view[14] ?? 0);

    const isTarget = index === frame.targetIndex;
    const dx = station.x - frame.plane.x;
    const dy = station.y - frame.plane.y;
    const dz = station.z - frame.plane.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    let ndcX = 0;
    let ndcY = 0;

    if (viewZ < 0) {
      const clipW =
        (projection[3] ?? 0) * viewX +
        (projection[7] ?? 0) * viewY +
        (projection[11] ?? 0) * viewZ +
        (projection[15] ?? 1);

      const clipX =
        (projection[0] ?? 0) * viewX +
        (projection[4] ?? 0) * viewY +
        (projection[8] ?? 0) * viewZ +
        (projection[12] ?? 0);

      const clipY =
        (projection[1] ?? 0) * viewX +
        (projection[5] ?? 0) * viewY +
        (projection[9] ?? 0) * viewZ +
        (projection[13] ?? 0);

      ndcX = clipX / clipW;
      ndcY = clipY / clipW;
    }

    const visible = labelVisible(viewZ, ndcX, ndcY, distance, isTarget);

    if (visible) {
      const rounded = Math.round(distance);
      const x = Math.round((ndcX * 0.5 + 0.5) * frame.width);
      const top = Math.round((-ndcY * 0.5 + 0.5) * frame.height);
      const text = textFor(index, rounded);

      if (slot.element.textContent !== text) {
        slot.element.textContent = text;
      }

      if (x !== slot.x || top !== slot.y) {
        slot.x = x;
        slot.y = top;
        slot.element.style.transform = `translate(${x}px, ${top}px) translate(-50%, -100%)`;
      }
    }

    if (visible !== slot.visible) {
      slot.visible = visible;
      slot.element.dataset['visible'] = visible ? 'true' : 'false';
    }

    if (isTarget !== slot.target) {
      slot.target = isTarget;
      slot.element.toggleAttribute('data-target', isTarget);
    }

    if (isTarget && !isOnScreen(viewZ, ndcX, ndcY)) {
      placeEdge(viewX, viewY, frame, textFor(index, Math.round(distance)));

      return true;
    }

    return false;
  };

  return {
    update: (frame) => {
      let edgeOn = false;

      for (let index = 0; index < slots.length; index += 1) {
        const slot = slots[index];

        if (slot !== undefined && updateSlot(index, frame, slot)) {
          edgeOn = true;
        }
      }

      if (!edgeOn) {
        setEdgeHidden(true);
      }
    },
    setVisible: (visible) => {
      root.style.opacity = visible ? '1' : '0';
    },
    dispose: () => {
      for (const slot of slots) {
        slot.element.remove();
      }

      edge.remove();
    },
  };
};
