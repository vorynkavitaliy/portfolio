import type { WorldFailReason } from '@/core/world/world.types';

export class WorldStartError extends Error {
  readonly reason: WorldFailReason;

  constructor(reason: WorldFailReason) {
    super(`world-start:${reason}`);
    this.name = 'WorldStartError';
    this.reason = reason;
  }
}

export const failReasonOf = (error: unknown): WorldFailReason => {
  return error instanceof WorldStartError ? error.reason : 'renderer-failed';
};
