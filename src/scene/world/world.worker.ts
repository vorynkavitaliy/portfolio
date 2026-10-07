import { generateWorld, worldTransferables } from '@/scene/world/generate-world';
import { parseWorldRequest } from '@/scene/world/world.schema';

import type { WorldMessage } from '@/scene/world/world.types';

const post = (message: WorldMessage, transfer: Transferable[] = []): void => {
  self.postMessage(message, { transfer });
};

self.onmessage = (event: MessageEvent<unknown>): void => {
  const request = parseWorldRequest(event.data);

  if (request === null) {
    post({ type: 'error' });
    self.close();

    return;
  }

  try {
    const data = generateWorld(request, (value) => {
      post({ type: 'progress', value });
    });

    post({ type: 'done', data }, worldTransferables(data));
  } catch {
    post({ type: 'error' });
  }

  self.close();
};
