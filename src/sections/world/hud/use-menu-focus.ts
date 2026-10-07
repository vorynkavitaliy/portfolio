import { useEffect, useRef, type RefObject } from 'react';

import { MENU_TRIGGER_SELECTOR } from '@/sections/world/hud/hud.constants';

import type { WorldMenu } from '@/core/world/world.types';

type FocusableMenu = Exclude<WorldMenu, 'none'>;

const FOCUS_TARGET = 'button, [tabindex="-1"]';

const focusWithin = (root: HTMLElement): void => {
  const target: HTMLElement | null = root.matches('[tabindex="-1"]')
    ? root
    : root.querySelector<HTMLElement>(FOCUS_TARGET);

  target?.focus({ preventScroll: true });
};

const returnFocus = (root: HTMLElement, menu: FocusableMenu): void => {
  const active: Element | null = document.activeElement;

  if (active !== null && active !== document.body && !root.contains(active)) {
    return;
  }

  document.querySelector<HTMLElement>(MENU_TRIGGER_SELECTOR[menu])?.focus({ preventScroll: true });
};

export const useMenuFocus = (
  menu: FocusableMenu,
  open: boolean,
  rootRef: RefObject<HTMLElement | null>,
): void => {
  const wasOpen = useRef<boolean>(false);

  useEffect(() => {
    const root: HTMLElement | null = rootRef.current;
    const previouslyOpen: boolean = wasOpen.current;

    wasOpen.current = open;

    if (root === null || open === previouslyOpen) {
      return;
    }

    if (open) {
      focusWithin(root);

      return;
    }

    returnFocus(root, menu);
  }, [menu, open, rootRef]);
};
