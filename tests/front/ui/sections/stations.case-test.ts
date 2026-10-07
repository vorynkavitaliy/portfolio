import { test } from 'vitest';

import type { StationsCaseId } from '@tests/front/ui/sections/stations.cases';

export const caseTest = (
  id: StationsCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
