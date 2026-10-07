export type ParamCall = Readonly<{ method: string; args: readonly number[] }>;

export class FakeParam {
  value = 0;
  readonly calls: ParamCall[] = [];

  setTargetAtTime(target: number, time: number, constant: number): void {
    this.calls.push({ method: 'setTargetAtTime', args: [target, time, constant] });
  }

  setValueAtTime(value: number, time: number): void {
    this.calls.push({ method: 'setValueAtTime', args: [value, time] });
  }

  linearRampToValueAtTime(value: number, time: number): void {
    this.calls.push({ method: 'linearRampToValueAtTime', args: [value, time] });
  }

  exponentialRampToValueAtTime(value: number, time: number): void {
    this.calls.push({ method: 'exponentialRampToValueAtTime', args: [value, time] });
  }

  last(method: string): readonly number[] | undefined {
    return this.calls
      .filter((call) => {
        return call.method === method;
      })
      .at(-1)?.args;
  }
}

export class FakeNode {
  readonly targets: FakeNode[] = [];
  readonly gain = new FakeParam();
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
  readonly Q = new FakeParam();
  type = '';
  loop = false;
  buffer: unknown = null;
  started: number[] = [];
  stopped: (number | undefined)[] = [];
  disconnected = false;
  onended: (() => void) | null = null;

  constructor(readonly kind: string) {}

  connect(target: FakeNode): FakeNode {
    this.targets.push(target);

    return target;
  }

  disconnect(): void {
    this.disconnected = true;
  }

  start(when = 0): void {
    this.started.push(when);
  }

  stop(when?: number): void {
    this.stopped.push(when);
  }

  getChannelData(): Float32Array {
    return new Float32Array(8);
  }
}

export class FakeAudioContext {
  readonly nodes: FakeNode[] = [];
  readonly destination = new FakeNode('destination');
  currentTime = 10;
  sampleRate = 4;
  resumeCalls = 0;
  suspendCalls = 0;
  closeCalls = 0;

  create(kind: string): FakeNode {
    const node = new FakeNode(kind);
    this.nodes.push(node);

    return node;
  }

  createGain(): FakeNode {
    return this.create('gain');
  }

  createBiquadFilter(): FakeNode {
    return this.create('biquad');
  }

  createOscillator(): FakeNode {
    return this.create('oscillator');
  }

  createBufferSource(): FakeNode {
    return this.create('buffer-source');
  }

  createBuffer(): FakeNode {
    return new FakeNode('buffer');
  }

  resume(): Promise<void> {
    this.resumeCalls += 1;

    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.suspendCalls += 1;

    return Promise.resolve();
  }

  close(): Promise<void> {
    this.closeCalls += 1;

    return Promise.resolve();
  }

  ofKind(kind: string): readonly FakeNode[] {
    return this.nodes.filter((node) => {
      return node.kind === kind;
    });
  }
}

export const asAudioContext = (fake: FakeAudioContext): AudioContext => {
  return fake as unknown as AudioContext;
};
