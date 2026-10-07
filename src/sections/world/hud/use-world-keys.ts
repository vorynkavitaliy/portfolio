import { useEffect } from 'react';

import { worldStore } from '@/core/world/world-store';
import { closeMenu } from '@/sections/world/hud/hud-actions';

const EDITABLE_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

const isEditable = (target: EventTarget | null): boolean => {
  return (
    target instanceof HTMLElement && (target.isContentEditable || EDITABLE_TAGS.has(target.tagName))
  );
};

const handleKey = (event: KeyboardEvent): void => {
  const state = worldStore.getSnapshot();

  if (state.view !== 'world' || state.boot.status !== 'running') {
    return;
  }

  const docked: boolean = state.flight.mode === 'docked';

  if (event.code === 'Space') {
    if (!docked || isEditable(event.target) || event.target instanceof HTMLButtonElement) {
      return;
    }

    event.preventDefault();
    worldStore.dispatch({ type: 'take-off' });

    return;
  }

  if (event.key !== 'Escape') {
    return;
  }

  if (state.menu !== 'none') {
    closeMenu();

    return;
  }

  if (docked) {
    worldStore.dispatch({ type: 'take-off' });
  }
};

export const useWorldKeys = (): void => {
  useEffect(() => {
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, []);
};
