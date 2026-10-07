'use client';

import type { ReactNode } from 'react';

import { useGSAP } from '@/motion/gsap.client';
import { attachMagnet } from '@/motion/magnet';
import { MAGNET_SELECTOR } from '@/sections/world/hud/hud.constants';

export const Magnet = (): ReactNode => {
  useGSAP(() => {
    const detachers: readonly (() => void)[] = [
      ...document.querySelectorAll<HTMLElement>(MAGNET_SELECTOR),
    ].map(attachMagnet);

    return () => {
      for (const detach of detachers) {
        detach();
      }
    };
  }, []);

  return null;
};
