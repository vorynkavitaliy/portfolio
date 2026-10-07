import { gsap } from '@/motion/gsap.client';
import { MAGNET_MOTION } from '@/motion/motion.tokens';
import { FINE_POINTER_QUERY, matchesMedia, prefersReducedMotion } from '@/motion/reduced-motion';

export type MagnetRect = Readonly<{ left: number; top: number; width: number; height: number }>;

export type MagnetOffset = Readonly<{ x: number; y: number }>;

export const magnetOffset = (rect: MagnetRect, clientX: number, clientY: number): MagnetOffset => {
  return {
    x: (clientX - rect.left - rect.width / 2) * MAGNET_MOTION.factorX,
    y: (clientY - rect.top - rect.height / 2) * MAGNET_MOTION.factorY,
  };
};

export const magnetEnabled = (): boolean => {
  return !prefersReducedMotion() && matchesMedia(FINE_POINTER_QUERY);
};

const detached = (): void => {
  return undefined;
};

export const attachMagnet = (element: HTMLElement): (() => void) => {
  if (!magnetEnabled()) {
    return detached;
  }

  const tweenVars = { duration: MAGNET_MOTION.duration, ease: MAGNET_MOTION.ease };
  const xTo = gsap.quickTo(element, 'x', tweenVars);
  const yTo = gsap.quickTo(element, 'y', tweenVars);

  const follow = (event: PointerEvent): void => {
    const offset: MagnetOffset = magnetOffset(
      element.getBoundingClientRect(),
      event.clientX,
      event.clientY,
    );

    xTo(offset.x);
    yTo(offset.y);
  };

  const release = (): void => {
    xTo(0);
    yTo(0);
  };

  element.addEventListener('pointermove', follow);
  element.addEventListener('pointerleave', release);

  return () => {
    element.removeEventListener('pointermove', follow);
    element.removeEventListener('pointerleave', release);
    gsap.killTweensOf(element, 'x,y');
    gsap.set(element, { clearProps: 'x,y' });
  };
};
