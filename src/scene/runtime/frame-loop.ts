export type FrameLoopOptions = Readonly<{
  request: (callback: (now: number) => void) => number;
  cancel: (handle: number) => void;
  onStart: () => void;
  tick: (now: number) => void;
}>;

export type FrameLoop = Readonly<{
  setRunning: (run: boolean) => void;
  stop: () => void;
}>;

export const createFrameLoop = (options: FrameLoopOptions): FrameLoop => {
  const { request, cancel, onStart, tick } = options;
  let looping = false;
  let pending: number | null = null;

  const frame = (now: number): void => {
    pending = null;
    tick(now);

    if (looping && pending === null) {
      pending = request(frame);
    }
  };

  const stop = (): void => {
    looping = false;

    if (pending !== null) {
      cancel(pending);
      pending = null;
    }
  };

  const setRunning = (run: boolean): void => {
    if (!run) {
      stop();

      return;
    }

    if (looping) {
      return;
    }

    looping = true;
    onStart();
    pending = request(frame);
  };

  return { setRunning, stop };
};
