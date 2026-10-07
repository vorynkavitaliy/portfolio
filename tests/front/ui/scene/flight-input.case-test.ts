import { test } from 'vitest';

import type { FlightInputCaseId } from '@tests/front/ui/scene/flight-input.cases';

export const caseTest = (
  id: FlightInputCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
