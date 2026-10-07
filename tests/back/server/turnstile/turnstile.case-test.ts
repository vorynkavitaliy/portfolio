import { test } from 'vitest';

import type { TurnstileCaseId } from '@tests/back/server/turnstile/turnstile.cases';

export const caseTest = (
  id: TurnstileCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
