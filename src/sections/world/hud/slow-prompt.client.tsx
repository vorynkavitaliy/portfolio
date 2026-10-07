'use client';

import { useState, type ReactNode } from 'react';

import { WORLD_COPY } from '@/content/world.content';
import { track } from '@/core/analytics/analytics';
import { useWorld } from '@/core/world/use-world';
import { openText } from '@/core/world/world-actions';
import { worldStore } from '@/core/world/world-store';

const BUTTON_CLASS =
  'pixel-edge cursor-pointer border-0 bg-surface px-3 py-1.5 font-pixel text-[0.9rem] text-text shadow-[inset_0_0_0_2px_var(--color-edge-dim)] hover:text-white coarse:py-3';

const openTextVersion = (): void => {
  worldStore.update((state) => {
    return openText(state, 'visitor');
  });

  track({ name: 'text_version_opened', source: 'toggle' });
};

export const SlowPrompt = (): ReactNode => {
  const slow: boolean = useWorld((state) => {
    return state.slow;
  });

  const [dismissed, setDismissed] = useState<boolean>(false);

  if (!slow || dismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={WORLD_COPY.slowPrompt.text}
      data-slow-prompt=""
      className="fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-30 mx-auto flex max-w-md flex-col gap-3 bg-panel p-3 shadow-[inset_0_0_0_2px_var(--color-signal)] pixel-edge"
    >
      <p className="m-0 font-pixel text-[0.95rem] text-text">{WORLD_COPY.slowPrompt.text}</p>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={BUTTON_CLASS} onClick={openTextVersion}>
          {WORLD_COPY.slowPrompt.action}
        </button>

        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => {
            setDismissed(true);
          }}
        >
          {WORLD_COPY.slowPrompt.dismiss}
        </button>
      </div>
    </div>
  );
};
