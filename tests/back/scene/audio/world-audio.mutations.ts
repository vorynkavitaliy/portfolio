import type { WorldAudioCaseId } from '@tests/back/scene/audio/world-audio.cases';

export type WorldAudioMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly WorldAudioCaseId[];
}>;

const CONSTANTS = 'src/scene/audio/audio.constants.ts';
const AUDIO = 'src/scene/audio/world-audio.ts';

export const WORLD_AUDIO_MUTATIONS: readonly WorldAudioMutation[] = [
  {
    id: 'master.on-gain',
    file: CONSTANTS,
    find: 'MASTER_ON_GAIN = 0.9',
    replace: 'MASTER_ON_GAIN = 0.5',
    caseIds: ['audio.enable.one-context-resumed'],
  },
  {
    id: 'enable.resume-dropped',
    file: AUDIO,
    find: '      void active.ctx.resume();',
    replace: '',
    caseIds: ['audio.enable.one-context-resumed'],
  },
  {
    id: 'disable.suspend-dropped',
    file: AUDIO,
    find: '      void active.ctx.suspend();',
    replace: '',
    caseIds: ['audio.disable.suspends-and-mutes'],
  },
  {
    id: 'graph.rebuilt-every-enable',
    file: AUDIO,
    find: '    if (graph !== null) {\n      return graph;\n    }',
    replace: '',
    caseIds: ['audio.enable.repeat-reuses-context'],
  },
  {
    id: 'factory.throw-uncaught',
    file: AUDIO,
    find: '    } catch {\n      return null;\n    }',
    replace: '    } finally {\n    }',
    caseIds: ['audio.factory.throw-returns-false'],
  },
  {
    id: 'factory.null-ignored',
    file: AUDIO,
    find: '    if (ctx === null) {\n      failed = true;\n\n      return null;\n    }\n\n',
    replace: '',
    caseIds: ['audio.factory.null-returns-false'],
  },
  {
    id: 'graph.failure-not-remembered',
    file: AUDIO,
    find: '      failed = true;\n      void ctx.close();',
    replace: '      void ctx.close();',
    caseIds: ['audio.graph.build-failure-closes-context'],
  },
  {
    id: 'graph.failure-context-leaked',
    file: AUDIO,
    find: '      void ctx.close();\n      console.error',
    replace: '      console.error',
    caseIds: ['audio.graph.build-failure-closes-context'],
  },
  {
    id: 'graph.failure-unlogged',
    file: AUDIO,
    find: "      console.error('world-audio:graph-failed');\n",
    replace: '',
    caseIds: ['audio.graph.build-failure-closes-context'],
  },
  {
    id: 'enable.always-on',
    file: AUDIO,
    find: 'on = next && active !== null;',
    replace: 'on = next || active !== null;',
    caseIds: ['audio.disable.suspends-and-mutes'],
  },
  {
    id: 'update.off-gate-dropped',
    file: AUDIO,
    find: '    if (!on || graph === null) {\n      return;\n    }\n\n    const at',
    replace: '    if (graph === null) {\n      return;\n    }\n\n    const at',
    caseIds: ['audio.update.off-noop'],
  },
  {
    id: 'wind.base',
    file: CONSTANTS,
    find: 'WIND_GAIN_BASE = 0.006',
    replace: 'WIND_GAIN_BASE = 0.01',
    caseIds: ['audio.update.formulas', 'audio.update.wind-clamped'],
  },
  {
    id: 'wind.clamp-dropped',
    file: AUDIO,
    find: 'return Math.min(1, Math.max(0, value));',
    replace: 'return value;',
    caseIds: ['audio.update.wind-clamped'],
  },
  {
    id: 'engine.slope',
    file: CONSTANTS,
    find: 'ENGINE_HZ_PER_SPEED = 2.5',
    replace: 'ENGINE_HZ_PER_SPEED = 2',
    caseIds: ['audio.update.formulas'],
  },
  {
    id: 'chime.off-gate-dropped',
    file: AUDIO,
    find: '  const chime = (index: number, delay: number): void => {\n    if (!on || graph === null) {',
    replace: '  const chime = (index: number, delay: number): void => {\n    if (graph === null) {',
    caseIds: ['audio.chime.off-noop'],
  },
  {
    id: 'chime.delay-ignored',
    file: AUDIO,
    find: 'active.ctx.currentTime + delay',
    replace: 'active.ctx.currentTime',
    caseIds: ['audio.chime.two-voices'],
  },
  {
    id: 'chime.stagger',
    file: CONSTANTS,
    find: 'CHIME_STAGGER = 0.09',
    replace: 'CHIME_STAGGER = 0.2',
    caseIds: ['audio.chime.two-voices'],
  },
  {
    id: 'chime.octave-dropped',
    file: AUDIO,
    find: '(secondIndex >= count ? 2 : 1)',
    replace: '1',
    caseIds: ['audio.chime.wraps-notes'],
  },
  {
    id: 'chime.peak',
    file: CONSTANTS,
    find: 'CHIME_PEAK = 0.12',
    replace: 'CHIME_PEAK = 0.3',
    caseIds: ['audio.chime.envelope'],
  },
  {
    id: 'blip.off-gate-dropped',
    file: AUDIO,
    find: '  const blip = (up: boolean): void => {\n    if (!on || graph === null) {',
    replace: '  const blip = (up: boolean): void => {\n    if (graph === null) {',
    caseIds: ['audio.blip.off-noop'],
  },
  {
    id: 'blip.up-notes-swapped',
    file: AUDIO,
    find: 'up ? BLIP_UP_NOTES : BLIP_DOWN_NOTES',
    replace: 'up ? BLIP_DOWN_NOTES : BLIP_UP_NOTES',
    caseIds: ['audio.blip.up', 'audio.blip.down'],
  },
  {
    id: 'blip.slide-always',
    file: AUDIO,
    find: '        if (!up) {',
    replace: '        if (true) {',
    caseIds: ['audio.blip.up'],
  },
  {
    id: 'blip.peak',
    file: CONSTANTS,
    find: 'BLIP_PEAK = 0.05',
    replace: 'BLIP_PEAK = 0.2',
    caseIds: ['audio.blip.envelope'],
  },
  {
    id: 'voice.release-dropped',
    file: AUDIO,
    find: '    oscillator.disconnect();\n    gain.disconnect();',
    replace: '',
    caseIds: ['audio.nodes.released-on-end'],
  },
  {
    id: 'voice.stop-dropped',
    file: AUDIO,
    find: '  oscillator.stop(stop);',
    replace: '',
    caseIds: ['audio.chime.two-voices', 'audio.blip.up'],
  },
  {
    id: 'dispose.close-dropped',
    file: AUDIO,
    find: '    void graph.ctx.close();',
    replace: '',
    caseIds: ['audio.dispose.stops-and-closes'],
  },
  {
    id: 'dispose.stop-dropped',
    file: AUDIO,
    find: '      source.stop();',
    replace: '',
    caseIds: ['audio.dispose.stops-and-closes'],
  },
  {
    id: 'pad.voice-frequency',
    file: CONSTANTS,
    find: 'frequency: 82.41',
    replace: 'frequency: 82',
    caseIds: ['audio.graph.pad-voices'],
  },
  {
    id: 'wind.loop-dropped',
    file: AUDIO,
    find: 'noiseSource.loop = true;',
    replace: '',
    caseIds: ['audio.graph.wind-and-engine'],
  },
];

export const EQUIVALENT_WORLD_AUDIO_MUTATIONS = [] as const;
