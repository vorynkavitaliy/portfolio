import {
  BLIP_ATTACK,
  BLIP_DECAY,
  BLIP_DOWN_NOTES,
  BLIP_DOWN_SLIDE_SECONDS,
  BLIP_DOWN_SLIDE_TO,
  BLIP_PEAK,
  BLIP_STOP_AFTER,
  BLIP_UP_NOTES,
  CHIME_ATTACK,
  CHIME_DECAY,
  CHIME_NOTES,
  CHIME_PEAK,
  CHIME_SECOND_VOICE_OFFSET,
  CHIME_STAGGER,
  CHIME_STOP_AFTER,
  ENGINE_BASE_HZ,
  ENGINE_GAIN,
  ENGINE_HZ_PER_SPEED,
  ENGINE_LOWPASS_HZ,
  ENGINE_RESPONSE,
  ENGINE_START_HZ,
  MASTER_OFF_GAIN,
  MASTER_ON_GAIN,
  MASTER_RESPONSE,
  PAD_GAIN,
  PAD_LFO_DEPTH,
  PAD_LFO_HZ,
  PAD_LOWPASS_HZ,
  PAD_VOICES,
  SILENCE,
  WIND_BANDPASS_HZ,
  WIND_BANDPASS_Q,
  WIND_GAIN_BASE,
  WIND_GAIN_RANGE,
  WIND_NOISE_SECONDS,
  WIND_RESPONSE,
  WIND_SPEED_FULL,
  WIND_START_GAIN,
  type BlipNote,
} from '@/scene/audio/audio.constants';

export type AudioFactory = () => AudioContext | null;

export type WorldAudio = Readonly<{
  setEnabled: (on: boolean) => boolean;
  update: (speed: number) => void;
  chime: (index: number, delay: number) => void;
  blip: (up: boolean) => void;
  dispose: () => void;
}>;

type Graph = Readonly<{
  ctx: AudioContext;
  master: GainNode;
  windGain: GainNode;
  engine: OscillatorNode;
  sources: readonly AudioScheduledSourceNode[];
}>;

const clamp01 = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};

const buildGraph = (ctx: AudioContext): Graph => {
  const sources: AudioScheduledSourceNode[] = [];

  const master = ctx.createGain();
  master.gain.value = MASTER_OFF_GAIN;
  master.connect(ctx.destination);

  const pad = ctx.createGain();
  pad.gain.value = PAD_GAIN;
  const padLowpass = ctx.createBiquadFilter();
  padLowpass.type = 'lowpass';
  padLowpass.frequency.value = PAD_LOWPASS_HZ;
  pad.connect(padLowpass);
  padLowpass.connect(master);

  for (const voice of PAD_VOICES) {
    const oscillator = ctx.createOscillator();
    oscillator.type = voice.type;
    oscillator.frequency.value = voice.frequency;
    oscillator.detune.value = voice.detune;
    const level = ctx.createGain();
    level.gain.value = voice.level;
    oscillator.connect(level);
    level.connect(pad);
    oscillator.start();
    sources.push(oscillator);
  }

  const lfo = ctx.createOscillator();
  lfo.frequency.value = PAD_LFO_HZ;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = PAD_LFO_DEPTH;
  lfo.connect(lfoDepth);
  lfoDepth.connect(padLowpass.frequency);
  lfo.start();
  sources.push(lfo);

  const noise = ctx.createBuffer(
    1,
    Math.floor(ctx.sampleRate * WIND_NOISE_SECONDS),
    ctx.sampleRate,
  );

  const samples = noise.getChannelData(0);

  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noise;
  noiseSource.loop = true;
  const windBandpass = ctx.createBiquadFilter();
  windBandpass.type = 'bandpass';
  windBandpass.frequency.value = WIND_BANDPASS_HZ;
  windBandpass.Q.value = WIND_BANDPASS_Q;
  const windGain = ctx.createGain();
  windGain.gain.value = WIND_START_GAIN;
  noiseSource.connect(windBandpass);
  windBandpass.connect(windGain);
  windGain.connect(master);
  noiseSource.start();
  sources.push(noiseSource);

  const engine = ctx.createOscillator();
  engine.type = 'sawtooth';
  engine.frequency.value = ENGINE_START_HZ;
  const engineLowpass = ctx.createBiquadFilter();
  engineLowpass.type = 'lowpass';
  engineLowpass.frequency.value = ENGINE_LOWPASS_HZ;
  const engineGain = ctx.createGain();
  engineGain.gain.value = ENGINE_GAIN;
  engine.connect(engineLowpass);
  engineLowpass.connect(engineGain);
  engineGain.connect(master);
  engine.start();
  sources.push(engine);

  return { ctx, master, windGain, engine, sources };
};

const playVoice = (
  graph: Graph,
  type: OscillatorType,
  start: number,
  stop: number,
  shape: (oscillator: OscillatorNode, gain: GainNode) => void,
): void => {
  const oscillator = graph.ctx.createOscillator();
  oscillator.type = type;
  const gain = graph.ctx.createGain();
  shape(oscillator, gain);
  oscillator.connect(gain);
  gain.connect(graph.master);

  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };

  oscillator.start(start);
  oscillator.stop(stop);
};

export const createWorldAudio = (factory: AudioFactory): WorldAudio => {
  let graph: Graph | null = null;
  let on = false;
  let disposed = false;
  let failed = false;

  const openContext = (): AudioContext | null => {
    try {
      return factory();
    } catch {
      return null;
    }
  };

  const ensureGraph = (): Graph | null => {
    if (graph !== null) {
      return graph;
    }

    if (failed) {
      return null;
    }

    const ctx = openContext();

    if (ctx === null) {
      failed = true;

      return null;
    }

    try {
      graph = buildGraph(ctx);
    } catch {
      failed = true;
      void ctx.close();
      console.error('world-audio:graph-failed');
    }

    return graph;
  };

  const setEnabled = (next: boolean): boolean => {
    if (disposed) {
      return false;
    }

    const active = next ? ensureGraph() : graph;
    on = next && active !== null;

    if (active === null) {
      return false;
    }

    if (on) {
      void active.ctx.resume();
    }

    active.master.gain.setTargetAtTime(
      on ? MASTER_ON_GAIN : MASTER_OFF_GAIN,
      active.ctx.currentTime,
      MASTER_RESPONSE,
    );

    if (!on) {
      void active.ctx.suspend();
    }

    return on;
  };

  const update = (speed: number): void => {
    if (!on || graph === null) {
      return;
    }

    const at = graph.ctx.currentTime;

    graph.windGain.gain.setTargetAtTime(
      WIND_GAIN_BASE + clamp01(speed / WIND_SPEED_FULL) * WIND_GAIN_RANGE,
      at,
      WIND_RESPONSE,
    );

    graph.engine.frequency.setTargetAtTime(
      ENGINE_BASE_HZ + speed * ENGINE_HZ_PER_SPEED,
      at,
      ENGINE_RESPONSE,
    );
  };

  const chime = (index: number, delay: number): void => {
    if (!on || graph === null) {
      return;
    }

    const active = graph;
    const base = active.ctx.currentTime + delay;
    const count = CHIME_NOTES.length;
    const secondIndex = index + CHIME_SECOND_VOICE_OFFSET;

    const frequencies = [
      CHIME_NOTES[index % count] ?? 0,
      (CHIME_NOTES[secondIndex % count] ?? 0) * (secondIndex >= count ? 2 : 1),
    ];

    frequencies.forEach((frequency, voice) => {
      const start = base + voice * CHIME_STAGGER;

      playVoice(
        active,
        voice === 0 ? 'triangle' : 'sine',
        start,
        start + CHIME_STOP_AFTER,
        (oscillator, gain) => {
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(CHIME_PEAK, start + CHIME_ATTACK);
          gain.gain.exponentialRampToValueAtTime(SILENCE, start + CHIME_DECAY);
        },
      );
    });
  };

  const blip = (up: boolean): void => {
    if (!on || graph === null) {
      return;
    }

    const active = graph;
    const now = active.ctx.currentTime;
    const notes: readonly BlipNote[] = up ? BLIP_UP_NOTES : BLIP_DOWN_NOTES;

    for (const note of notes) {
      const start = now + note.offset;

      playVoice(active, 'square', start, start + BLIP_STOP_AFTER, (oscillator, gain) => {
        oscillator.frequency.setValueAtTime(note.frequency, start);

        if (!up) {
          oscillator.frequency.exponentialRampToValueAtTime(
            note.frequency * BLIP_DOWN_SLIDE_TO,
            start + BLIP_DOWN_SLIDE_SECONDS,
          );
        }

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(BLIP_PEAK, start + BLIP_ATTACK);
        gain.gain.exponentialRampToValueAtTime(SILENCE, start + BLIP_DECAY);
      });
    }
  };

  const dispose = (): void => {
    disposed = true;
    on = false;

    if (graph === null) {
      return;
    }

    for (const source of graph.sources) {
      source.stop();
      source.disconnect();
    }

    graph.master.disconnect();
    void graph.ctx.close();
    graph = null;
  };

  return { setEnabled, update, chime, blip, dispose };
};
