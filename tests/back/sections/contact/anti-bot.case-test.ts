import { test } from 'vitest';

import type { AntiBotCaseId } from '@tests/back/sections/contact/anti-bot.cases';

export const caseTest = (
  id: AntiBotCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
