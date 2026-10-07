import { test } from 'vitest';

import type { StationFrameCaseId } from '@tests/front/ui/sections/station-frame/station-frame.cases';

export const caseTest = (
  id: StationFrameCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
