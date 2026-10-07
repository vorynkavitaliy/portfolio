import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { createFrameLoop } from '@/scene/runtime/frame-loop';

const setup = (tickBody: (loop: ReturnType<typeof createFrameLoop>) => void) => {
  const queue = new Map<number, (now: number) => void>();
  let nextHandle = 1;
  let starts = 0;
  let ticks = 0;
  let loopRef: ReturnType<typeof createFrameLoop> | null = null;

  const loop = createFrameLoop({
    request: (callback) => {
      const handle = nextHandle;

      nextHandle += 1;
      queue.set(handle, callback);

      return handle;
    },
    cancel: (handle) => {
      queue.delete(handle);
    },
    onStart: () => {
      starts += 1;
    },
    tick: () => {
      ticks += 1;

      if (loopRef !== null) {
        tickBody(loopRef);
      }
    },
  });

  loopRef = loop;

  const fire = (): void => {
    const [handle, callback] = [...queue.entries()][0] ?? [];

    if (handle === undefined || callback === undefined) {
      return;
    }

    queue.delete(handle);
    callback(16);
  };

  return {
    loop,
    pending: (): number => {
      return queue.size;
    },
    starts: (): number => {
      return starts;
    },
    ticks: (): number => {
      return ticks;
    },
    fire,
  };
};

caseTest('loop.single-callback', 'one pending frame after in-frame store updates', () => {
  const harness = setup((loop) => {
    loop.setRunning(true);
  });

  harness.loop.setRunning(true);
  harness.loop.setRunning(true);
  expect(harness.pending()).toBe(1);
  expect(harness.starts()).toBe(1);

  harness.fire();
  expect(harness.ticks()).toBe(1);
  expect(harness.pending()).toBe(1);
  expect(harness.starts()).toBe(1);

  harness.fire();
  harness.fire();
  expect(harness.pending()).toBe(1);
  expect(harness.starts()).toBe(1);
});

caseTest('loop.restart-in-frame', 'a stop and restart inside a frame keeps one callback', () => {
  let flip = true;

  const harness = setup((loop) => {
    if (flip) {
      flip = false;
      loop.setRunning(false);
      loop.setRunning(true);
    }
  });

  harness.loop.setRunning(true);
  harness.fire();
  expect(harness.pending()).toBe(1);
  expect(harness.starts()).toBe(2);
  harness.fire();
  expect(harness.pending()).toBe(1);
});

caseTest('loop.stops', 'a stop cancels the pending frame and a stop inside a frame ends it', () => {
  const harness = setup((loop) => {
    loop.setRunning(false);
  });

  harness.loop.setRunning(true);
  harness.loop.setRunning(false);
  expect(harness.pending()).toBe(0);

  harness.loop.setRunning(true);
  harness.fire();
  expect(harness.pending()).toBe(0);
  expect(harness.ticks()).toBe(1);

  harness.loop.setRunning(true);
  harness.loop.stop();
  expect(harness.pending()).toBe(0);
  harness.fire();
  expect(harness.ticks()).toBe(1);
});
