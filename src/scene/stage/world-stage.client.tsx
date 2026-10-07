'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { failWorld } from '@/core/world/world-actions';
import { worldStore } from '@/core/world/world-store';
import { startWorld, type WorldRuntime } from '@/scene/runtime/world-runtime';
import { failReasonOf } from '@/scene/runtime/world-start-error';

import type { WorldFailReason } from '@/core/world/world.types';
import type { WorldStageProps } from '@/scene/scene-loader.client';

const fail = (reason: WorldFailReason): void => {
  worldStore.update((state) => {
    return failWorld(state, reason);
  });
};

const createCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');

  canvas.setAttribute('aria-hidden', 'true');

  return canvas;
};

export const WorldStage = ({ generation, labels, navTemplate }: WorldStageProps): ReactNode => {
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef(labels);
  const templateRef = useRef(navTemplate);

  useEffect(() => {
    labelsRef.current = labels;
    templateRef.current = navTemplate;
  }, [labels, navTemplate]);

  useEffect(() => {
    const stage = stageRef.current;
    const overlay = overlayRef.current;
    const root = stickRef.current;
    const knob = knobRef.current;
    let cancelled = false;
    let runtime: WorldRuntime | null = null;

    if (stage === null || overlay === null || root === null || knob === null) {
      return;
    }

    const canvas = createCanvas();

    stage.prepend(canvas);

    const launch = async (): Promise<void> => {
      const data = await generation.catch(() => {
        return null;
      });

      if (cancelled) {
        return;
      }

      if (data === null) {
        fail('worker-failed');

        return;
      }

      try {
        const started = await startWorld({
          canvas,
          overlay,
          stick: { root, knob },
          data,
          labels: labelsRef.current,
          navTemplate: templateRef.current,
          store: worldStore,
        });

        if (cancelled) {
          started.dispose();

          return;
        }

        runtime = started;
      } catch (error) {
        if (!cancelled) {
          fail(failReasonOf(error));
        }
      }
    };

    void launch();

    return () => {
      cancelled = true;
      runtime?.dispose();
      runtime = null;
      canvas.remove();
    };
  }, [generation]);

  return (
    <div ref={stageRef} className="world-stage" aria-hidden="true">
      <div ref={overlayRef} className="nav-layer" />

      <div ref={stickRef} data-stick="" hidden>
        <div className="stick-ring pixel-edge" />

        <div ref={knobRef} className="stick-knob pixel-edge" />
      </div>
    </div>
  );
};
