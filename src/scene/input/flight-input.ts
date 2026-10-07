import { STICK_RADIUS } from '@/scene/flight/flight.constants';
import { FLIGHT_KEY_CODES, createSteer, steerFrom } from '@/scene/flight/steer';
import { createStick } from '@/scene/input/stick';

import type { Steer, SteerTarget } from '@/scene/flight/flight.types';
import type { StickElements } from '@/scene/input/stick';

const SHIFT_CODES: ReadonlySet<string> = new Set(['ShiftLeft', 'ShiftRight']);
const EDITABLE_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const SURFACE_SELECTOR = '[data-station], [role="menu"], #autopilot-menu, #road-map';

export type FlightInputOptions = Readonly<{
  canvas: HTMLCanvasElement;
  stick: StickElements;
  onFirstInput: () => void;
}>;

export type FlightInput = Readonly<{
  read: () => Steer;
  setBoostHeld: (held: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  dispose: () => void;
}>;

const isEditable = (target: EventTarget | null): boolean => {
  return (
    target instanceof HTMLElement && (target.isContentEditable || EDITABLE_TAGS.has(target.tagName))
  );
};

const insideSurface = (target: EventTarget | null): boolean => {
  return target instanceof Element && target.closest(SURFACE_SELECTOR) !== null;
};

export const createFlightInput = (options: FlightInputOptions): FlightInput => {
  const { canvas, onFirstInput } = options;
  const keys = new Set<string>();
  const out: SteerTarget = createSteer();
  const stick = createStick(canvas, options.stick, STICK_RADIUS);
  let boostHeld = false;
  let enabled = false;
  let used = false;

  const noteInput = (): void => {
    if (used) {
      return;
    }

    used = true;
    onFirstInput();
  };

  const releaseAll = (): void => {
    keys.clear();
    boostHeld = false;
    stick.release();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!enabled || isEditable(event.target) || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (SHIFT_CODES.has(event.code)) {
      keys.add(event.code);

      return;
    }

    if (!FLIGHT_KEY_CODES.has(event.code)) {
      return;
    }

    keys.add(event.code);
    noteInput();

    if (!insideSurface(event.target)) {
      event.preventDefault();
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    keys.delete(event.code);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!enabled || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    if (stick.press(event)) {
      noteInput();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', releaseAll);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    read: () => {
      return steerFrom(keys, stick.state, boostHeld, out);
    },
    setBoostHeld: (held) => {
      boostHeld = held;
    },
    setEnabled: (value) => {
      enabled = value;

      if (!value) {
        releaseAll();
      }
    },
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
      canvas.removeEventListener('pointerdown', onPointerDown);
      releaseAll();
      stick.dispose();
    },
  };
};
