import { test } from 'vitest';

import type { BootCaseId } from '@tests/back/sections/world/boot.cases';

export const caseTest = (
  id: BootCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
