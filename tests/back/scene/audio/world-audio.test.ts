import { expect, vi } from 'vitest';

import {
  asAudioContext,
  FakeAudioContext,
  type FakeNode,
} from '@tests/back/scene/audio/fake-audio-context';
import { caseTest } from '@tests/back/scene/audio/world-audio.case-test';
import { createWorldAudio, type AudioFactory } from '@/scene/audio/world-audio';

const PERSISTENT_OSCILLATORS = 6;
const NOW = 10;

type Rig = Readonly<{
  fake: FakeAudioContext;
  factory: ReturnType<typeof vi.fn<AudioFactory>>;
  audio: ReturnType<typeof createWorldAudio>;
}>;

const rig = (): Rig => {
  const fake = new FakeAudioContext();

  const factory = vi.fn<AudioFactory>(() => {
    return asAudioContext(fake);
  });

  return { fake, factory, audio: createWorldAudio(factory) };
};

const enabled = (): Rig => {
  const made = rig();
  made.audio.setEnabled(true);

  return made;
};

const master = (fake: FakeAudioContext): FakeNode => {
  const found = fake.ofKind('gain').find((node) => {
    return node.targets.includes(fake.destination);
  });

  if (found === undefined) {
    throw new Error('master gain missing');
  }

  return found;
};

const windGain = (fake: FakeAudioContext): FakeNode => {
  const found = fake.ofKind('gain').find((node) => {
    return node.gain.value === 0.01;
  });

  if (found === undefined) {
    throw new Error('wind gain missing');
  }

  return found;
};

const engine = (fake: FakeAudioContext): FakeNode => {
  const found = fake.ofKind('oscillator').find((node) => {
    return node.type === 'sawtooth';
  });

  if (found === undefined) {
    throw new Error('engine missing');
  }

  return found;
};

const voices = (fake: FakeAudioContext): readonly FakeNode[] => {
  return fake.ofKind('oscillator').slice(PERSISTENT_OSCILLATORS);
};

const voiceGain = (voice: FakeNode): FakeNode => {
  const gain = voice.targets[0];

  if (gain === undefined) {
    throw new Error('voice gain missing');
  }

  return gain;
};

const frequencyOf = (voice: FakeNode): number => {
  return voice.frequency.value || (voice.frequency.calls[0]?.args[0] ?? 0);
};

caseTest('audio.lazy.no-context-before-enable', 'nothing is built before enable', () => {
  const { fake, factory, audio } = rig();
  audio.update(20);
  audio.chime(0, 0);
  audio.blip(true);
  expect(factory).not.toHaveBeenCalled();
  expect(fake.nodes).toHaveLength(0);
});

caseTest('audio.enable.one-context-resumed', 'one context, resumed, master up', () => {
  const { fake, factory, audio } = rig();
  expect(audio.setEnabled(true)).toBe(true);
  expect(factory).toHaveBeenCalledTimes(1);
  expect(fake.resumeCalls).toBe(1);
  expect(master(fake).gain.last('setTargetAtTime')).toEqual([0.9, NOW, 0.2]);
});

caseTest('audio.enable.repeat-reuses-context', 'second enable reuses the graph', () => {
  const { fake, factory, audio } = enabled();
  const built = fake.nodes.length;
  audio.setEnabled(false);
  expect(audio.setEnabled(true)).toBe(true);
  expect(factory).toHaveBeenCalledTimes(1);
  expect(fake.nodes).toHaveLength(built);
  expect(fake.resumeCalls).toBe(2);
});

caseTest('audio.disable.suspends-and-mutes', 'disable mutes and suspends', () => {
  const { fake, audio } = enabled();
  expect(audio.setEnabled(false)).toBe(false);
  expect(master(fake).gain.last('setTargetAtTime')).toEqual([0, NOW, 0.2]);
  expect(fake.suspendCalls).toBe(1);
});

caseTest('audio.disable.before-enable-noop', 'disable before enable is inert', () => {
  const { fake, factory, audio } = rig();
  expect(audio.setEnabled(false)).toBe(false);
  expect(factory).not.toHaveBeenCalled();
  expect(fake.nodes).toHaveLength(0);
});

caseTest('audio.factory.null-returns-false', 'null factory yields false', () => {
  const audio = createWorldAudio(() => {
    return null;
  });

  expect(audio.setEnabled(true)).toBe(false);

  expect(() => {
    audio.update(10);
    audio.chime(1, 0);
    audio.blip(false);
    audio.setEnabled(false);
    audio.dispose();
  }).not.toThrow();
});

caseTest('audio.factory.throw-returns-false', 'throwing factory yields false', () => {
  const audio = createWorldAudio(() => {
    throw new Error('blocked');
  });

  expect(audio.setEnabled(true)).toBe(false);
});

caseTest(
  'audio.graph.build-failure-closes-context',
  'a failed graph build closes the context and is never retried',
  () => {
    const fake = new FakeAudioContext();

    fake.createOscillator = (): never => {
      throw new Error('no oscillator');
    };

    const factory = vi.fn<AudioFactory>(() => {
      return asAudioContext(fake);
    });

    const log = vi.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });

    const audio = createWorldAudio(factory);

    expect(audio.setEnabled(true)).toBe(false);
    expect(fake.closeCalls).toBe(1);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('world-audio:graph-failed');
    expect(audio.setEnabled(true)).toBe(false);
    expect(audio.setEnabled(true)).toBe(false);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(fake.closeCalls).toBe(1);

    audio.dispose();
    log.mockRestore();
  },
);

caseTest('audio.graph.pad-voices', 'four pad voices and an lfo', () => {
  const { fake } = enabled();
  const oscillators = fake.ofKind('oscillator');
  const pad = oscillators.slice(0, 4);

  expect(
    pad.map((node) => {
      return [node.frequency.value, node.type, node.detune.value];
    }),
  ).toEqual([
    [55, 'triangle', -6],
    [82.41, 'triangle', 5],
    [164.81, 'sine', 0],
    [246.94, 'sine', 3],
  ]);

  expect(oscillators[4]?.frequency.value).toBe(0.06);

  for (const node of oscillators) {
    expect(node.started).toHaveLength(1);
  }
});

caseTest('audio.graph.wind-and-engine', 'wind noise and engine are routed', () => {
  const { fake } = enabled();
  const source = fake.ofKind('buffer-source')[0];
  expect(source?.loop).toBe(true);
  expect(source?.started).toHaveLength(1);
  expect(engine(fake).frequency.value).toBe(70);
  expect(engine(fake).started).toHaveLength(1);
  expect(windGain(fake).targets).toContain(master(fake));

  const engineGain = fake.ofKind('gain').find((node) => {
    return node.gain.value === 0.025;
  });

  expect(engineGain?.targets).toContain(master(fake));
});

caseTest('audio.update.formulas', 'wind and engine follow speed', () => {
  const { fake, audio } = enabled();
  audio.update(13);
  const wind = windGain(fake).gain.last('setTargetAtTime');
  expect(wind?.[0]).toBeCloseTo(0.006 + 0.5 * 0.14, 10);
  expect(wind?.[1]).toBe(NOW);
  expect(wind?.[2]).toBe(0.15);
  expect(engine(fake).frequency.last('setTargetAtTime')).toEqual([102.5, NOW, 0.1]);
});

caseTest('audio.update.wind-clamped', 'wind gain is clamped', () => {
  const { fake, audio } = enabled();
  audio.update(52);
  expect(windGain(fake).gain.last('setTargetAtTime')?.[0]).toBeCloseTo(0.146, 10);
  audio.update(-5);
  expect(windGain(fake).gain.last('setTargetAtTime')?.[0]).toBeCloseTo(0.006, 10);
});

caseTest('audio.update.off-noop', 'update is silent while off', () => {
  const { fake, audio } = enabled();
  audio.setEnabled(false);
  audio.update(20);
  expect(windGain(fake).gain.calls).toHaveLength(0);
  expect(engine(fake).frequency.calls).toHaveLength(0);
});

caseTest('audio.chime.off-noop', 'chime is silent while off', () => {
  const { fake, audio } = enabled();
  audio.setEnabled(false);
  audio.chime(2, 0);
  expect(voices(fake)).toHaveLength(0);
});

caseTest('audio.chime.two-voices', 'chime plays two staggered voices', () => {
  const { fake, audio } = enabled();
  audio.chime(0, 0.5);
  const [first, second] = voices(fake);
  expect(voices(fake)).toHaveLength(2);
  expect(first?.type).toBe('triangle');
  expect(first?.frequency.value).toBe(523.25);
  expect(first?.started).toEqual([NOW + 0.5]);
  expect(first?.stopped).toEqual([NOW + 0.5 + 1.5]);
  expect(second?.type).toBe('sine');
  expect(second?.frequency.value).toBe(659.25);
  expect(second?.started[0]).toBeCloseTo(NOW + 0.5 + 0.09, 10);
  expect(second?.stopped[0]).toBeCloseTo(NOW + 0.5 + 0.09 + 1.5, 10);
});

caseTest('audio.chime.wraps-notes', 'chime index wraps and doubles', () => {
  const { fake, audio } = enabled();
  audio.chime(8, 0);
  expect(voices(fake).map(frequencyOf)).toEqual([1567.98, 587.33 * 2]);
});

caseTest('audio.chime.envelope', 'chime envelope shape', () => {
  const { fake, audio } = enabled();
  audio.chime(0, 0);
  const first = voices(fake)[0];
  const gain = first === undefined ? undefined : voiceGain(first);

  expect(gain?.gain.calls).toEqual([
    { method: 'setValueAtTime', args: [0, NOW] },
    { method: 'linearRampToValueAtTime', args: [0.12, NOW + 0.02] },
    { method: 'exponentialRampToValueAtTime', args: [0.0001, NOW + 1.4] },
  ]);
});

caseTest('audio.blip.off-noop', 'blip is silent while off', () => {
  const { fake, audio } = enabled();
  audio.setEnabled(false);
  audio.blip(true);
  audio.blip(false);
  expect(voices(fake)).toHaveLength(0);
});

caseTest('audio.blip.up', 'link blip rises', () => {
  const { fake, audio } = enabled();
  audio.blip(true);
  const [first, second] = voices(fake);
  expect(voices(fake)).toHaveLength(2);
  expect(first?.type).toBe('square');
  expect(first?.frequency.calls).toEqual([{ method: 'setValueAtTime', args: [880, NOW] }]);

  expect(second?.frequency.calls).toEqual([
    { method: 'setValueAtTime', args: [1318.51, NOW + 0.09] },
  ]);

  expect(first?.stopped).toEqual([NOW + 0.25]);
  expect(second?.stopped).toEqual([NOW + 0.09 + 0.25]);
});

caseTest('audio.blip.down', 'unlink blip slides down', () => {
  const { fake, audio } = enabled();
  audio.blip(false);
  const [first, second] = voices(fake);
  expect(voices(fake)).toHaveLength(2);

  expect(first?.frequency.calls).toEqual([
    { method: 'setValueAtTime', args: [660, NOW] },
    { method: 'exponentialRampToValueAtTime', args: [660 * 0.6, NOW + 0.2] },
  ]);

  expect(second?.frequency.calls).toEqual([
    { method: 'setValueAtTime', args: [330, NOW + 0.1] },
    { method: 'exponentialRampToValueAtTime', args: [330 * 0.6, NOW + 0.1 + 0.2] },
  ]);
});

caseTest('audio.blip.envelope', 'blip envelope shape', () => {
  const { fake, audio } = enabled();
  audio.blip(true);
  const first = voices(fake)[0];
  const gain = first === undefined ? undefined : voiceGain(first);

  expect(gain?.gain.calls).toEqual([
    { method: 'setValueAtTime', args: [0, NOW] },
    { method: 'linearRampToValueAtTime', args: [0.05, NOW + 0.01] },
    { method: 'exponentialRampToValueAtTime', args: [0.0001, NOW + 0.22] },
  ]);
});

caseTest('audio.nodes.released-on-end', 'ended voices are disconnected', () => {
  const { fake, audio } = enabled();
  audio.blip(true);
  audio.chime(1, 0);
  const all = voices(fake);
  expect(all).toHaveLength(4);

  for (const voice of all) {
    expect(voice.disconnected).toBe(false);
    voice.onended?.();
    expect(voice.disconnected).toBe(true);
    expect(voiceGain(voice).disconnected).toBe(true);
  }
});

caseTest('audio.dispose.stops-and-closes', 'dispose releases everything', () => {
  const { fake, audio } = enabled();
  audio.dispose();
  expect(fake.closeCalls).toBe(1);

  for (const node of [...fake.ofKind('oscillator'), ...fake.ofKind('buffer-source')]) {
    expect(node.stopped).toHaveLength(1);
  }

  expect(audio.setEnabled(true)).toBe(false);
  audio.dispose();
  expect(fake.closeCalls).toBe(1);
});
