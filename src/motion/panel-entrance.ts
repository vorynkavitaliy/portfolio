import { gsap } from '@/motion/gsap.client';
import { PANEL_MOTION } from '@/motion/motion.tokens';
import { addNumberRolls } from '@/motion/number-roll';
import { prefersReducedMotion } from '@/motion/reduced-motion';
import { splitTitle } from '@/motion/split-title';
import { addStep, onSettled } from '@/motion/timeline-steps';

import type { SplitText } from '@/motion/gsap.client';
import type { MotionStep } from '@/motion/timeline-steps';

export type PanelTarget =
  'wipe' | 'tag' | 'titleChars' | 'lede' | 'item' | 'stat' | 'chip' | 'result';

export const PANEL_MOTION_SELECTORS = {
  wipe: '[data-motion="wipe"]',
  tag: '[data-motion="tag"]',
  title: '[data-motion="title"]',
  lede: '[data-motion="lede"]',
  item: '[data-motion="item"]',
  stat: '[data-motion="stat"]',
  statValue: '[data-motion="stat-value"]',
  chip: '[data-motion="chip"]',
  result: '[data-motion="result"]',
} as const;

export const PANEL_ENTRANCE_STEPS = [
  {
    kind: 'fromTo',
    target: 'wipe',
    from: { scaleX: 0, transformOrigin: 'left' },
    to: { scaleX: 1 },
    tween: PANEL_MOTION.wipeIn,
  },
  {
    kind: 'set',
    target: 'wipe',
    to: { transformOrigin: 'right' },
    position: PANEL_MOTION.wipeOut.position,
  },
  { kind: 'to', target: 'wipe', to: { scaleX: 0 }, tween: PANEL_MOTION.wipeOut },
  { kind: 'from', target: 'tag', from: { x: -24, opacity: 0 }, tween: PANEL_MOTION.tag },
  {
    kind: 'from',
    target: 'titleChars',
    from: { yPercent: 115, rotate: 8 },
    tween: PANEL_MOTION.titleChars,
  },
  { kind: 'from', target: 'lede', from: { y: 14, opacity: 0 }, tween: PANEL_MOTION.lede },
  { kind: 'from', target: 'item', from: { x: -18, opacity: 0 }, tween: PANEL_MOTION.items },
  { kind: 'from', target: 'stat', from: { y: 18, opacity: 0 }, tween: PANEL_MOTION.stats },
  { kind: 'from', target: 'chip', from: { scale: 0.4, opacity: 0 }, tween: PANEL_MOTION.chips },
  {
    kind: 'from',
    target: 'result',
    from: { scaleX: 0, transformOrigin: 'left' },
    tween: PANEL_MOTION.result,
  },
] as const satisfies readonly MotionStep<PanelTarget>[];

const running = new WeakMap<Element, () => void>();

const query = (root: Element, selector: string): readonly Element[] => {
  return [...root.querySelectorAll(selector)];
};

export const playPanelEntrance = (root: Element): gsap.core.Timeline => {
  running.get(root)?.();

  const timeline: gsap.core.Timeline = gsap.timeline();

  if (prefersReducedMotion()) {
    return timeline;
  }

  const title: Element | null = root.querySelector(PANEL_MOTION_SELECTORS.title);
  const split: SplitText | null = title === null ? null : splitTitle(title);

  const targetsOf = (target: PanelTarget): readonly Element[] => {
    if (target === 'titleChars') {
      return split === null ? [] : split.chars;
    }

    return query(root, PANEL_MOTION_SELECTORS[target]);
  };

  for (const step of PANEL_ENTRANCE_STEPS) {
    addStep(timeline, targetsOf(step.target), step);
  }

  const restoreNumbers = addNumberRolls(
    timeline,
    query(root, PANEL_MOTION_SELECTORS.statValue),
    PANEL_MOTION.numberRoll,
  );

  const settle: () => void = onSettled(timeline, () => {
    restoreNumbers();
    split?.revert();

    if (running.get(root) === dispose) {
      running.delete(root);
    }
  });

  const dispose = (): void => {
    timeline.revert();
    settle();
  };

  running.set(root, dispose);

  return timeline;
};
