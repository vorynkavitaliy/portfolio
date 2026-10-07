export type PadVoice = Readonly<{
  frequency: number;
  type: OscillatorType;
  detune: number;
  level: number;
}>;

export const MASTER_ON_GAIN = 0.9;
export const MASTER_OFF_GAIN = 0;
export const MASTER_RESPONSE = 0.2;

export const PAD_GAIN = 0.04;
export const PAD_LOWPASS_HZ = 420;
export const PAD_VOICES: readonly PadVoice[] = [
  { frequency: 55, type: 'triangle', detune: -6, level: 1 },
  { frequency: 82.41, type: 'triangle', detune: 5, level: 1 },
  { frequency: 164.81, type: 'sine', detune: 0, level: 0.35 },
  { frequency: 246.94, type: 'sine', detune: 3, level: 0.35 },
];
export const PAD_LFO_HZ = 0.06;
export const PAD_LFO_DEPTH = 180;

export const WIND_NOISE_SECONDS = 2;
export const WIND_BANDPASS_HZ = 650;
export const WIND_BANDPASS_Q = 0.7;
export const WIND_START_GAIN = 0.01;
export const WIND_GAIN_BASE = 0.006;
export const WIND_GAIN_RANGE = 0.14;
export const WIND_SPEED_FULL = 26;
export const WIND_RESPONSE = 0.15;

export const ENGINE_START_HZ = 70;
export const ENGINE_LOWPASS_HZ = 240;
export const ENGINE_GAIN = 0.025;
export const ENGINE_BASE_HZ = 70;
export const ENGINE_HZ_PER_SPEED = 2.5;
export const ENGINE_RESPONSE = 0.1;

export const CHIME_NOTES: readonly number[] = [
  523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98,
];
export const CHIME_SECOND_VOICE_OFFSET = 2;
export const CHIME_STAGGER = 0.09;
export const CHIME_PEAK = 0.12;
export const CHIME_ATTACK = 0.02;
export const CHIME_DECAY = 1.4;
export const CHIME_STOP_AFTER = 1.5;

export const SILENCE = 0.0001;

export type BlipNote = Readonly<{ frequency: number; offset: number }>;

export const BLIP_UP_NOTES: readonly BlipNote[] = [
  { frequency: 880, offset: 0 },
  { frequency: 1318.51, offset: 0.09 },
];
export const BLIP_DOWN_NOTES: readonly BlipNote[] = [
  { frequency: 660, offset: 0 },
  { frequency: 330, offset: 0.1 },
];
export const BLIP_DOWN_SLIDE_TO = 0.6;
export const BLIP_DOWN_SLIDE_SECONDS = 0.2;
export const BLIP_PEAK = 0.05;
export const BLIP_ATTACK = 0.01;
export const BLIP_DECAY = 0.22;
export const BLIP_STOP_AFTER = 0.25;
