import type { StickState } from '@/scene/flight/flight.types';

export type StickElements = Readonly<{ root: HTMLElement; knob: HTMLElement }>;

type MutableStick = { active: boolean; dx: number; dy: number };

export type Stick = Readonly<{
  state: StickState;
  press: (event: PointerEvent) => boolean;
  release: () => void;
  dispose: () => void;
}>;

const NO_POINTER = -1;

export const createStick = (
  canvas: HTMLCanvasElement,
  elements: StickElements,
  radius: number,
): Stick => {
  const state: MutableStick = { active: false, dx: 0, dy: 0 };
  let pointerId = NO_POINTER;
  let originX = 0;
  let originY = 0;

  const tryCapture = (id: number): boolean => {
    try {
      canvas.setPointerCapture(id);

      return true;
    } catch {
      return false;
    }
  };

  const placeKnob = (): void => {
    elements.knob.style.transform = `translate(${state.dx}px, ${state.dy}px)`;
  };

  const release = (): void => {
    if (pointerId === NO_POINTER) {
      return;
    }

    pointerId = NO_POINTER;
    state.active = false;
    state.dx = 0;
    state.dy = 0;
    elements.root.hidden = true;
  };

  const press = (event: PointerEvent): boolean => {
    if (pointerId !== NO_POINTER) {
      return false;
    }

    pointerId = event.pointerId;
    originX = event.clientX;
    originY = event.clientY;
    state.active = true;
    state.dx = 0;
    state.dy = 0;

    tryCapture(event.pointerId);

    elements.root.hidden = false;
    elements.root.style.transform = `translate(${originX - radius}px, ${originY - radius}px)`;
    placeKnob();

    return true;
  };

  const onMove = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) {
      return;
    }

    let dx = event.clientX - originX;
    let dy = event.clientY - originY;
    const length = Math.hypot(dx, dy);

    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }

    if (dx === state.dx && dy === state.dy) {
      return;
    }

    state.dx = dx;
    state.dy = dy;
    placeKnob();
  };

  const onEnd = (event: PointerEvent): void => {
    if (event.pointerId === pointerId) {
      release();
    }
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onEnd);
  window.addEventListener('pointercancel', onEnd);
  canvas.addEventListener('lostpointercapture', onEnd);

  return {
    state,
    press,
    release,
    dispose: () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      canvas.removeEventListener('lostpointercapture', onEnd);
      release();
    },
  };
};
