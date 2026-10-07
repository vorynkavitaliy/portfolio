'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { useWorld } from '@/core/world/use-world';
import { prefersReducedMotion } from '@/motion/reduced-motion';
import { FLASH_BY_KIND } from '@/sections/world/hud/hud.constants';

import type { WorldSnapshot } from '@/core/world/world.types';

export const Flash = (): ReactNode => {
  const flash: WorldSnapshot['flash'] = useWorld((state) => {
    return state.flash;
  });

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element: HTMLDivElement | null = ref.current;

    if (flash === null || element === null || prefersReducedMotion()) {
      return;
    }

    const { strength, durationMs } = FLASH_BY_KIND[flash.kind];

    element.style.transition = 'none';
    element.style.opacity = String(strength);

    const frame: number = requestAnimationFrame(() => {
      element.style.transition = `opacity ${durationMs}ms ease-out`;
      element.style.opacity = '0';
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [flash]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-flash=""
      className="pointer-events-none fixed inset-0 z-30 bg-flash opacity-0"
    />
  );
};
