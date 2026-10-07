import { afterEach, beforeEach, expect, vi } from 'vitest';

import { caseTest } from '@tests/front/ui/scene/flight-input.case-test';
import { watchTransforms } from '@tests/front/ui/scene/style-spy';
import { createFlightInput } from '@/scene/input/flight-input';

import type { FlightInput } from '@/scene/input/flight-input';

let canvas: HTMLCanvasElement;
let stickRoot: HTMLElement;
let knob: HTMLElement;
let panel: HTMLElement;
let field: HTMLInputElement;
let onFirstInput: ReturnType<typeof vi.fn<() => void>>;
let input: FlightInput;

const press = (code: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
  const event = new KeyboardEvent('keydown', {
    code,
    bubbles: true,
    cancelable: true,
    ...init,
  });

  target.dispatchEvent(event);

  return event;
};

const lift = (code: string): void => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
};

const pointer = (
  type: string,
  init: PointerEventInit,
  target: EventTarget = canvas,
): PointerEvent => {
  const event = new PointerEvent(type, {
    pointerId: 7,
    pointerType: 'touch',
    button: 0,
    bubbles: true,
    cancelable: true,
    ...init,
  });

  target.dispatchEvent(event);

  return event;
};

beforeEach(() => {
  canvas = document.createElement('canvas');
  stickRoot = document.createElement('div');
  stickRoot.hidden = true;
  knob = document.createElement('div');
  stickRoot.append(knob);
  panel = document.createElement('section');
  panel.dataset['station'] = 'systems';
  field = document.createElement('input');
  panel.append(field);
  document.body.append(canvas, stickRoot, panel);
  onFirstInput = vi.fn<() => void>();
  input = createFlightInput({ canvas, stick: { root: stickRoot, knob }, onFirstInput });
  input.setEnabled(true);
});

afterEach(() => {
  input.dispose();
  canvas.remove();
  stickRoot.remove();
  panel.remove();
});

caseTest('input.key.steer', 'WASD, arrows and Shift', () => {
  press('KeyW');
  expect(input.read()).toMatchObject({ turn: 0, climb: 1, boost: false });
  press('KeyS');
  press('KeyW');
  lift('KeyW');
  expect(input.read().climb).toBe(-1);
  lift('KeyS');
  press('ArrowUp');
  expect(input.read().climb).toBe(1);
  lift('ArrowUp');
  press('KeyA');
  expect(input.read().turn).toBe(1);
  lift('KeyA');
  press('ArrowRight');
  expect(input.read().turn).toBe(-1);
  lift('ArrowRight');
  press('KeyD');
  expect(input.read().turn).toBe(-1);
  lift('KeyD');
  press('ArrowLeft');
  expect(input.read().turn).toBe(1);
  press('ShiftLeft');
  expect(input.read().boost).toBe(true);
  lift('ShiftLeft');
  press('ShiftRight');
  expect(input.read().boost).toBe(true);
  lift('ShiftRight');
  lift('ArrowLeft');
  expect(input.read()).toMatchObject({ turn: 0, climb: 0, boost: false });
});

caseTest('input.key.prevent', 'page keys prevented, panel keys not', () => {
  expect(press('KeyW').defaultPrevented).toBe(true);
  expect(press('ArrowDown').defaultPrevented).toBe(true);
  expect(press('KeyA', {}, panel).defaultPrevented).toBe(false);
  expect(press('ShiftLeft').defaultPrevented).toBe(false);
  expect(press('KeyQ').defaultPrevented).toBe(false);

  const menu = document.createElement('div');

  menu.setAttribute('role', 'menu');
  document.body.append(menu);
  expect(press('KeyD', {}, menu).defaultPrevented).toBe(false);
  menu.remove();
});

caseTest('input.key.editable', 'typing in fields is not flight', () => {
  const area = document.createElement('textarea');
  const select = document.createElement('select');
  const editable = document.createElement('div');

  editable.contentEditable = 'true';
  panel.append(area, select, editable);

  for (const target of [field, area, select, editable]) {
    expect(press('KeyW', {}, target).defaultPrevented).toBe(false);
  }

  expect(input.read()).toMatchObject({ turn: 0, climb: 0, boost: false });
  expect(onFirstInput).not.toHaveBeenCalled();
});

caseTest('input.key.modifiers', 'Ctrl, Meta and Alt are ignored', () => {
  for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
    expect(press('KeyW', init).defaultPrevented).toBe(false);
    expect(press('ShiftLeft', init).defaultPrevented).toBe(false);
  }

  expect(input.read()).toMatchObject({ climb: 0, boost: false });
  expect(onFirstInput).not.toHaveBeenCalled();
});

caseTest('input.key.enabled', 'disabled input ignores and releases', () => {
  press('KeyW');
  press('ShiftLeft');
  input.setBoostHeld(true);
  pointer('pointerdown', { clientX: 100, clientY: 100 });
  input.setEnabled(false);
  expect(input.read()).toMatchObject({ turn: 0, climb: 0, boost: false });
  expect(stickRoot.hidden).toBe(true);
  expect(press('KeyW').defaultPrevented).toBe(false);
  pointer('pointerup', { clientX: 100, clientY: 100 });
  pointer('pointerdown', { pointerId: 8, clientX: 100, clientY: 100 });
  expect(stickRoot.hidden).toBe(true);
  expect(input.read().climb).toBe(0);
  input.setEnabled(true);
  expect(input.read().climb).toBe(0);
  press('KeyW');
  expect(input.read().climb).toBe(1);
});

caseTest('input.key.blur', 'blur releases keys and boost', () => {
  press('KeyW');
  press('ShiftLeft');
  input.setBoostHeld(true);
  window.dispatchEvent(new Event('blur'));
  expect(input.read()).toMatchObject({ turn: 0, climb: 0, boost: false });
});

caseTest('input.boost', 'the Boost button state', () => {
  expect(input.read().boost).toBe(false);
  input.setBoostHeld(true);
  expect(input.read().boost).toBe(true);
  input.setBoostHeld(false);
  expect(input.read().boost).toBe(false);
});

caseTest('input.first', 'first input fires once', () => {
  press('ShiftLeft');
  press('KeyQ');
  press('KeyW', { ctrlKey: true });
  expect(onFirstInput).not.toHaveBeenCalled();
  press('KeyW');
  expect(onFirstInput).toHaveBeenCalledTimes(1);
  press('KeyA');
  pointer('pointerdown', { clientX: 10, clientY: 10 });
  expect(onFirstInput).toHaveBeenCalledTimes(1);
});

caseTest('input.first-stick', 'a stick press is a first input too', () => {
  pointer('pointerdown', { pointerType: 'mouse', button: 2, clientX: 10, clientY: 10 });
  expect(onFirstInput).not.toHaveBeenCalled();
  pointer('pointerdown', { clientX: 10, clientY: 10 });
  expect(onFirstInput).toHaveBeenCalledTimes(1);
  pointer('pointerup', { clientX: 10, clientY: 10 });
  pointer('pointerdown', { clientX: 20, clientY: 20 });
  expect(onFirstInput).toHaveBeenCalledTimes(1);
});

caseTest('input.mouse-hover', 'hovering does not steer', () => {
  pointer('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 900, clientY: 40 });
  pointer('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 700 });
  expect(input.read()).toMatchObject({ turn: 0, climb: 0 });
  expect(onFirstInput).not.toHaveBeenCalled();
  expect(stickRoot.hidden).toBe(true);
});

caseTest('stick.press', 'the stick appears at the press point', () => {
  pointer('pointerdown', { clientX: 300, clientY: 200 });
  expect(stickRoot.hidden).toBe(false);
  expect(stickRoot.style.transform).toBe('translate(244px, 144px)');
  expect(knob.style.transform).toBe('translate(0px, 0px)');
  expect(input.read()).toMatchObject({ turn: 0, climb: 0 });
});

caseTest('stick.clamp', 'the knob stops at the ring', () => {
  pointer('pointerdown', { clientX: 300, clientY: 200 });
  pointer('pointermove', { clientX: 900, clientY: 200 });
  expect(knob.style.transform).toBe('translate(56px, 0px)');
  expect(input.read()).toMatchObject({ turn: -1, climb: 0 });
  pointer('pointermove', { clientX: 300, clientY: -500 });
  expect(knob.style.transform).toBe('translate(0px, -56px)');
  expect(input.read().climb).toBe(1);
  pointer('pointermove', { clientX: 350, clientY: 250 });

  const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(knob.style.transform);

  expect(Math.hypot(Number(match?.[1]), Number(match?.[2]))).toBeCloseTo(56, 3);
});

caseTest('stick.release', 'releasing hides the stick', () => {
  pointer('pointerdown', { clientX: 300, clientY: 200 });
  pointer('pointermove', { clientX: 900, clientY: 200 });
  pointer('pointerup', { clientX: 900, clientY: 200 });
  expect(stickRoot.hidden).toBe(true);
  expect(input.read()).toMatchObject({ turn: 0, climb: 0 });
  pointer('pointerdown', { clientX: 300, clientY: 200 });
  pointer('pointermove', { clientX: 300, clientY: 0 });
  pointer('pointercancel', { clientX: 300, clientY: 0 });
  expect(stickRoot.hidden).toBe(true);
  expect(input.read().climb).toBe(0);
});

caseTest('stick.buttons', 'only the primary button, one pointer', () => {
  pointer('pointerdown', { pointerType: 'mouse', button: 2, clientX: 50, clientY: 50 });
  expect(stickRoot.hidden).toBe(true);
  pointer('pointerdown', { pointerType: 'mouse', button: 1, clientX: 50, clientY: 50 });
  expect(stickRoot.hidden).toBe(true);
  pointer('pointerdown', { pointerType: 'mouse', button: 0, clientX: 50, clientY: 50 });
  expect(stickRoot.hidden).toBe(false);
  pointer('pointerup', { pointerType: 'mouse', clientX: 50, clientY: 50 });
  pointer('pointerdown', { pointerId: 7, clientX: 300, clientY: 200 });
  pointer('pointerdown', { pointerId: 9, clientX: 10, clientY: 10 });
  expect(stickRoot.style.transform).toBe('translate(244px, 144px)');
  pointer('pointermove', { pointerId: 9, clientX: 900, clientY: 200 });
  expect(input.read().turn).toBe(0);
  pointer('pointerup', { pointerId: 9, clientX: 10, clientY: 10 });
  expect(stickRoot.hidden).toBe(false);
});

caseTest('stick.capture-fallback', 'the drag works without pointer capture', () => {
  const refuse = vi.spyOn(canvas, 'setPointerCapture').mockImplementation(() => {
    throw new DOMException('refused', 'NotFoundError');
  });

  pointer('pointerdown', { clientX: 300, clientY: 200 });
  expect(refuse).toHaveBeenCalledTimes(1);
  expect(stickRoot.hidden).toBe(false);
  pointer('pointermove', { clientX: 900, clientY: 200 }, document.body);
  expect(input.read().turn).toBe(-1);
  pointer('pointerup', { clientX: 900, clientY: 200 }, document.body);
  expect(stickRoot.hidden).toBe(true);
  expect(input.read().turn).toBe(0);
});

caseTest('stick.no-redundant-writes', 'an unchanged knob is not rewritten', () => {
  pointer('pointerdown', { clientX: 300, clientY: 200 });
  pointer('pointermove', { clientX: 900, clientY: 200 });

  const watch = watchTransforms([knob]);

  const writes = (): number => {
    return watch.writes();
  };

  pointer('pointermove', { clientX: 1200, clientY: 200 });
  pointer('pointermove', { clientX: 900, clientY: 200 });
  expect(writes()).toBe(0);
  pointer('pointermove', { clientX: 900, clientY: 230 });
  expect(writes()).toBe(1);
  watch.restore();
});

caseTest('input.dispose', 'listeners are removed', () => {
  const added = vi.spyOn(window, 'addEventListener');
  const removed = vi.spyOn(window, 'removeEventListener');
  const canvasAdded = vi.spyOn(canvas, 'addEventListener');
  const canvasRemoved = vi.spyOn(canvas, 'removeEventListener');
  const second = createFlightInput({ canvas, stick: { root: stickRoot, knob }, onFirstInput });

  second.dispose();

  const pairs = (
    adds: readonly (readonly unknown[])[],
    removes: readonly (readonly unknown[])[],
  ): void => {
    expect(adds.length).toBeGreaterThan(0);

    for (const [type, listener] of adds) {
      expect(
        removes.some(([t, l]) => {
          return t === type && l === listener;
        }),
      ).toBe(true);
    }
  };

  pairs(added.mock.calls, removed.mock.calls);
  pairs(canvasAdded.mock.calls, canvasRemoved.mock.calls);
  input.setEnabled(true);
  input.dispose();
  expect(press('KeyW').defaultPrevented).toBe(false);
  pointer('pointerdown', { clientX: 10, clientY: 10 });
  expect(stickRoot.hidden).toBe(true);
  expect(input.read().climb).toBe(0);
  expect(onFirstInput).not.toHaveBeenCalled();
});
