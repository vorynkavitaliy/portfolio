import { test } from 'vitest';

import type { MotionCaseId } from '@tests/back/motion/motion.cases';

export const caseTest = (
  id: MotionCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
