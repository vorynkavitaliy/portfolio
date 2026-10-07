import type { BootState, WorldView } from '@/core/world/world.types';

export type LoopGateInput = Readonly<{
  view: WorldView;
  bootStatus: BootState['status'];
  hidden: boolean;
  contextLost: boolean;
}>;

export const shouldRun = (input: LoopGateInput): boolean => {
  return (
    input.view === 'world' && input.bootStatus === 'running' && !input.hidden && !input.contextLost
  );
};
