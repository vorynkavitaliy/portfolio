'use client';

import { useRef, useState, type ReactNode } from 'react';

import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { fillTemplate } from '@/core/text/fill-template';
import { useWorld } from '@/core/world/use-world';
import { useGSAP } from '@/motion/gsap.client';
import { playTitleCard } from '@/motion/title-card';

import type { StationId } from '@/core/world/stations';

export const TitleCard = (): ReactNode => {
  const docked: StationId | null = useWorld((state) => {
    return state.flight.mode === 'docked' ? state.flight.station : null;
  });

  const [shown, setShown] = useState<StationId>('home-base');

  const cardRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  if (docked !== null && docked !== shown) {
    setShown(docked);
  }

  useGSAP(
    () => {
      const card = cardRef.current;
      const tag = tagRef.current;
      const title = titleRef.current;
      const line = lineRef.current;

      if (docked === null || card === null || tag === null || title === null || line === null) {
        return;
      }

      playTitleCard({ card, tag, title, line });
    },
    { dependencies: [docked], revertOnUpdate: true },
  );

  return (
    <div
      ref={cardRef}
      hidden
      aria-hidden="true"
      data-title-card=""
      className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center gap-3 px-6 text-center opacity-0"
    >
      <p ref={tagRef} className="m-0 font-pixel text-[1rem] text-signal">
        {fillTemplate(WORLD_COPY.titleCard, { tag: STATIONS_COPY[shown].tag })}
      </p>

      <span ref={lineRef} className="block h-0.5 w-40 origin-left bg-signal" />

      <p
        key={shown}
        ref={titleRef}
        className="m-0 overflow-hidden font-pixel text-5xl text-white [text-shadow:0_3px_0_var(--color-shadow)] wide:text-7xl"
      >
        {STATIONS_COPY[shown].label}
      </p>
    </div>
  );
};
