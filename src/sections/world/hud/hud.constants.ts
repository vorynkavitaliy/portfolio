import type { FlashKind } from '@/core/world/world.types';

export const MAP_SIZE = 128;

export const MAP_REFRESH_MS = 200;

export const COARSE_POINTER_QUERY = '(pointer: coarse)';

export const MENU_TRIGGER_SELECTOR = {
  autopilot: '[aria-controls="autopilot-menu"]',
  map: '[aria-controls="road-map"]',
} as const;

export const DOCKED_PANEL_SELECTOR = '[data-station][data-docked]';

export const MAGNET_SELECTOR = '[data-magnet]';

export const FLASH_BY_KIND: Readonly<
  Record<FlashKind, Readonly<{ strength: number; durationMs: number }>>
> = {
  'take-off': { strength: 0.6, durationMs: 900 },
  send: { strength: 0.5, durationMs: 700 },
};

export const VISITED_MARK = '✓';
