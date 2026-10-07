export type MotionEase =
  | 'power1.out'
  | 'power3.in'
  | 'power3.out'
  | 'power4.in'
  | 'expo.out'
  | 'back.out(1.8)'
  | 'back.out(2.6)';

export type MotionTween = Readonly<{
  duration: number;
  ease: MotionEase;
  stagger: number;
  position: number;
}>;

export const PANEL_MOTION = {
  wipeIn: { duration: 0.28, ease: 'power4.in', stagger: 0, position: 0 },
  wipeOut: { duration: 0.45, ease: 'expo.out', stagger: 0, position: 0.28 },
  tag: { duration: 0.4, ease: 'expo.out', stagger: 0, position: 0.3 },
  titleChars: { duration: 0.7, ease: 'expo.out', stagger: 0.018, position: 0.32 },
  lede: { duration: 0.5, ease: 'power3.out', stagger: 0.08, position: 0.5 },
  items: { duration: 0.45, ease: 'power3.out', stagger: 0.05, position: 0.6 },
  stats: { duration: 0.5, ease: 'back.out(1.8)', stagger: 0.07, position: 0.62 },
  chips: { duration: 0.35, ease: 'back.out(2.6)', stagger: 0.022, position: 0.75 },
  result: { duration: 0.6, ease: 'expo.out', stagger: 0, position: 0.85 },
  numberRoll: { duration: 0.9, ease: 'power3.out', stagger: 0.08, position: 0.7 },
} as const satisfies Readonly<Record<string, MotionTween>>;

export const TITLE_CARD_MOTION = {
  lineIn: { duration: 0.5, ease: 'expo.out', stagger: 0, position: 0 },
  kickerIn: { duration: 0.4, ease: 'expo.out', stagger: 0, position: 0.08 },
  charsIn: { duration: 0.65, ease: 'expo.out', stagger: 0.025, position: 0.1 },
  charsOut: { duration: 0.45, ease: 'power3.in', stagger: 0.015, position: 1.35 },
  lineOut: { duration: 0.4, ease: 'power3.in', stagger: 0, position: 1.4 },
  kickerOut: { duration: 0.3, ease: 'power1.out', stagger: 0, position: 1.4 },
} as const satisfies Readonly<Record<string, MotionTween>>;

export const MAGNET_MOTION = {
  duration: 0.4,
  ease: 'power3.out',
  factorX: 0.3,
  factorY: 0.4,
} as const satisfies Readonly<{
  duration: number;
  ease: MotionEase;
  factorX: number;
  factorY: number;
}>;

export const SCENE_TIMING = {
  introMs: 3200,
  autoDockMs: 2600,
  ringSeconds: 1.3,
  burstSeconds: 1.4,
  flashTakeOff: { opacity: 0.6, ms: 900 },
  flashSend: { opacity: 0.5, ms: 700 },
} as const;

export const CSS_TRANSITION_MS = {
  base: 140,
  panelOpacity: 320,
  panelTransformOut: 420,
  panelTransformIn: 520,
  loader: 700,
  hint: 400,
  navLayer: 500,
} as const;
