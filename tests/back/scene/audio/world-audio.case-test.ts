import { test } from 'vitest';

import type { WorldAudioCaseId } from '@tests/back/scene/audio/world-audio.cases';

export const caseTest = (
  id: WorldAudioCaseId,
  description: string,
  run: () => Promise<void> | void,
): void => {
  test(`${id}: ${description}`, run);
};
