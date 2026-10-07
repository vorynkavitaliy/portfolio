'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

import { WORLD_COPY } from '@/content/world.content';
import { useWorld } from '@/core/world/use-world';
import { worldStore } from '@/core/world/world-store';
import { ROAD_MAP_ID } from '@/sections/world/world.constants';
import { autopilotAndClose } from '@/sections/world/hud/hud-actions';
import { MAP_REFRESH_MS, MAP_SIZE } from '@/sections/world/hud/hud.constants';
import { useMenuFocus } from '@/sections/world/hud/use-menu-focus';

const MAP_CLASS =
  'pixel-edge fixed right-4 top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-30 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 bg-panel p-3 shadow-[inset_0_0_0_2px_var(--color-edge)] focus:outline-none';

const drawMap = (canvas: HTMLCanvasElement | null): void => {
  if (canvas !== null) {
    worldStore.controller()?.drawMap(canvas);
  }
};

export const RoadMap = (): ReactNode => {
  const open: boolean = useWorld((state) => {
    return state.menu === 'map';
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useMenuFocus('map', open, rootRef);

  useEffect(() => {
    if (!open) {
      return;
    }

    drawMap(canvasRef.current);

    const timer: number = window.setInterval(() => {
      drawMap(canvasRef.current);
    }, MAP_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [open]);

  const handleClick = (event: MouseEvent<HTMLCanvasElement>): void => {
    const rect: DOMRect = event.currentTarget.getBoundingClientRect();

    const station = worldStore.controller()?.stationAtMap({
      u: (event.clientX - rect.left) / rect.width,
      v: (event.clientY - rect.top) / rect.height,
    });

    if (station !== undefined && station !== null) {
      autopilotAndClose(station);
    }
  };

  return (
    <div
      ref={rootRef}
      id={ROAD_MAP_ID}
      role="dialog"
      aria-label={WORLD_COPY.menus.mapLabel}
      tabIndex={-1}
      hidden={!open}
      className={MAP_CLASS}
    >
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        aria-hidden="true"
        data-road-map-canvas=""
        onClick={handleClick}
        className="aspect-square w-full cursor-pointer bg-ink [image-rendering:pixelated]"
      />

      <p className="m-0 font-pixel text-[0.85rem] text-muted">{WORLD_COPY.menus.mapCaption}</p>
    </div>
  );
};
