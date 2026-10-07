import { test } from 'vitest';

import type { ContentFactsCaseId } from '@tests/back/content/content.facts.cases';

export const caseTest = (
  id: ContentFactsCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
