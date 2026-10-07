import { generateWorld, worldTransferables } from '@/scene/world/generate-world';
import { worldRequestSchema } from '@/scene/world/world.schema';

import type { WorldMessage } from '@/scene/world/world.types';

const post = (message: WorldMessage, transfer: Transferable[] = []): void => {
  self.postMessage(message, { transfer });
};

self.onmessage = (event: MessageEvent<unknown>): void => {
  const request = worldRequestSchema.safeParse(event.data);

  if (!request.success) {
    post({ type: 'error' });
    self.close();

    return;
  }

  try {
    const data = generateWorld(request.data, (value) => {
      post({ type: 'progress', value });
    });

    post({ type: 'done', data }, worldTransferables(data));
  } catch {
    post({ type: 'error' });
  }

  self.close();
};
