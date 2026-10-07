import { setMenu } from '@/core/world/world-actions';
import { worldStore } from '@/core/world/world-store';

import type { StationId } from '@/core/world/stations';

export const closeMenu = (): void => {
  worldStore.update((state) => {
    return setMenu(state, 'none');
  });
};

export const autopilotTo = (station: StationId): void => {
  worldStore.dispatch({ type: 'autopilot', station });
};

export const autopilotAndClose = (station: StationId): void => {
  autopilotTo(station);
  closeMenu();
};
