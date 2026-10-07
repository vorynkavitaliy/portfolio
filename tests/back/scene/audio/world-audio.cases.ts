export type WorldAudioCaseSource = 'prototype' | 'spec';

export type WorldAudioCase = Readonly<{
  id: string;
  source: WorldAudioCaseSource;
  reference: string;
  expected: string;
}>;

const SOUND_SPEC = 'spec FR-037 / SC-013 and plan D-15 (sound only after a gesture, off = silent)';
const PROTO_AUDIO = 'prototype docs/prototype/index.html :658–724 (audio graph, chime, blip)';
const PROTO_FRAME = 'prototype docs/prototype/index.html :1571–1575 (per-frame wind and engine)';

export const WORLD_AUDIO_CASES = [
  {
    id: 'audio.lazy.no-context-before-enable',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'creating the audio and calling update, chime and blip builds no context',
  },
  {
    id: 'audio.enable.one-context-resumed',
    source: 'spec',
    reference: SOUND_SPEC,
    expected:
      'enabling returns true, calls the factory once, resumes the context, master target 0.9 with 0.2 constant',
  },
  {
    id: 'audio.enable.repeat-reuses-context',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'disable then enable again keeps one factory call and one set of nodes',
  },
  {
    id: 'audio.disable.suspends-and-mutes',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'disabling returns false, master target 0 and the context is suspended',
  },
  {
    id: 'audio.disable.before-enable-noop',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'disabling before any enable returns false and creates nothing',
  },
  {
    id: 'audio.factory.null-returns-false',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'a factory returning null makes setEnabled(true) return false and later calls safe',
  },
  {
    id: 'audio.factory.throw-returns-false',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'a factory that throws makes setEnabled(true) return false',
  },
  {
    id: 'audio.graph.build-failure-closes-context',
    source: 'spec',
    reference: SOUND_SPEC,
    expected:
      'when the graph cannot be built the context is closed once, setEnabled returns false, a code-only error is logged and the factory is never called again',
  },
  {
    id: 'audio.graph.pad-voices',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected:
      'four pad oscillators 55 / 82.41 / 164.81 / 246.94 Hz started, plus an LFO at 0.06 Hz',
  },
  {
    id: 'audio.graph.wind-and-engine',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected:
      'a looping noise source, a sawtooth engine at 70 Hz, both started and routed to the master gain',
  },
  {
    id: 'audio.update.formulas',
    source: 'prototype',
    reference: PROTO_FRAME,
    expected:
      'speed 13 sets wind 0.006 + 0.5 * 0.14 (constant 0.15) and engine 70 + 32.5 (constant 0.1)',
  },
  {
    id: 'audio.update.wind-clamped',
    source: 'prototype',
    reference: PROTO_FRAME,
    expected: 'speed 52 clamps the wind gain to 0.146 and speed -5 to 0.006',
  },
  {
    id: 'audio.update.off-noop',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'update writes nothing while sound is off',
  },
  {
    id: 'audio.chime.off-noop',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'chime creates no node while sound is off, also after a disable',
  },
  {
    id: 'audio.chime.two-voices',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected:
      'chime 0 with delay 0.5 starts triangle 523.25 Hz at now+0.5 and sine 659.25 Hz 0.09 s later, each stopped 1.5 s after its start',
  },
  {
    id: 'audio.chime.wraps-notes',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected: 'chime 8 uses 1567.98 Hz and 587.33 * 2 (index 10 wraps to note 1, doubled)',
  },
  {
    id: 'audio.chime.envelope',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected: 'gain 0 at start, linear to 0.12 at +0.02, exponential to 0.0001 at +1.4',
  },
  {
    id: 'audio.blip.off-noop',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'blip creates no node while sound is off',
  },
  {
    id: 'audio.blip.up',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected:
      'link blip: square 880 Hz now, square 1318.51 Hz at +0.09, no pitch slide, each stopped 0.25 s after start',
  },
  {
    id: 'audio.blip.down',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected:
      'unlink blip: square 660 Hz now and 330 Hz at +0.1, each sliding to 0.6 of itself within 0.2 s',
  },
  {
    id: 'audio.blip.envelope',
    source: 'prototype',
    reference: PROTO_AUDIO,
    expected: 'gain 0 at start, linear to 0.05 at +0.01, exponential to 0.0001 at +0.22',
  },
  {
    id: 'audio.nodes.released-on-end',
    source: 'spec',
    reference: SOUND_SPEC,
    expected: 'when a chime or blip oscillator ends, it and its gain are disconnected',
  },
  {
    id: 'audio.dispose.stops-and-closes',
    source: 'spec',
    reference: SOUND_SPEC,
    expected:
      'dispose stops every persistent source, closes the context once, and later setEnabled returns false',
  },
] as const satisfies readonly WorldAudioCase[];

export type WorldAudioCaseId = (typeof WORLD_AUDIO_CASES)[number]['id'];
