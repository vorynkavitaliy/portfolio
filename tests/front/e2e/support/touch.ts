import type { Locator } from '@playwright/test';

export type TouchPoint = Readonly<{ x: number; y: number }>;

const dispatchTouch = async (
  target: Locator,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  point: TouchPoint,
): Promise<void> => {
  await target.evaluate(
    (element: Element, args: { type: string; x: number; y: number }) => {
      element.dispatchEvent(
        new PointerEvent(args.type, {
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          clientX: args.x,
          clientY: args.y,
          button: 0,
          buttons: args.type === 'pointerup' ? 0 : 1,
          bubbles: true,
          cancelable: true,
        }),
      );
    },
    { type, x: point.x, y: point.y },
  );
};

export const touchPress = async (target: Locator, at: TouchPoint): Promise<void> => {
  await dispatchTouch(target, 'pointerdown', at);
};

export const touchMove = async (target: Locator, to: TouchPoint): Promise<void> => {
  await dispatchTouch(target, 'pointermove', to);
};

export const touchRelease = async (target: Locator, at: TouchPoint): Promise<void> => {
  await dispatchTouch(target, 'pointerup', at);
};

export const touchDrag = async (
  target: Locator,
  from: TouchPoint,
  to: TouchPoint,
): Promise<void> => {
  await touchPress(target, from);
  await touchMove(target, to);
};
