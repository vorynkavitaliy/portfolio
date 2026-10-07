import { test } from 'vitest';

import type { ActorsCaseId } from '@tests/back/scene/visuals/actors.cases';

export const caseTest = (id: ActorsCaseId, description: string, run: () => void): void => {
  test(`${id}: ${description}`, run);
};
