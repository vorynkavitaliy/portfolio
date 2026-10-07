import { gsap } from '@/motion/gsap.client';
import { TITLE_CARD_MOTION } from '@/motion/motion.tokens';
import { prefersReducedMotion } from '@/motion/reduced-motion';
import { splitTitle } from '@/motion/split-title';
import { addStep, onSettled } from '@/motion/timeline-steps';

import type { MotionStep } from '@/motion/timeline-steps';

export type TitleCardElements = Readonly<{
  card: HTMLElement;
  tag: HTMLElement;
  title: HTMLElement;
  line: HTMLElement;
}>;

export type TitleCardTarget = 'card' | 'tag' | 'titleChars' | 'line';

export const TITLE_CARD_STEPS = [
  { kind: 'set', target: 'card', to: { opacity: 1 }, position: 0 },
  {
    kind: 'fromTo',
    target: 'line',
    from: { scaleX: 0 },
    to: { scaleX: 1 },
    tween: TITLE_CARD_MOTION.lineIn,
  },
  {
    kind: 'fromTo',
    target: 'tag',
    from: { y: 20, opacity: 0 },
    to: { y: 0, opacity: 1 },
    tween: TITLE_CARD_MOTION.kickerIn,
  },
  {
    kind: 'fromTo',
    target: 'titleChars',
    from: { yPercent: 120, skewX: -18 },
    to: { yPercent: 0, skewX: 0 },
    tween: TITLE_CARD_MOTION.charsIn,
  },
  {
    kind: 'to',
    target: 'titleChars',
    to: { yPercent: -120 },
    tween: TITLE_CARD_MOTION.charsOut,
  },
  {
    kind: 'to',
    target: 'line',
    to: { scaleX: 0, transformOrigin: 'left' },
    tween: TITLE_CARD_MOTION.lineOut,
  },
  { kind: 'to', target: 'tag', to: { opacity: 0 }, tween: TITLE_CARD_MOTION.kickerOut },
] as const satisfies readonly MotionStep<TitleCardTarget>[];

const CARD_STYLE_PROPS = 'opacity,transform,transformOrigin';

const running = new WeakMap<Element, gsap.core.Timeline>();

export const playTitleCard = (elements: TitleCardElements): gsap.core.Timeline => {
  const { card, tag, title, line } = elements;

  running.get(card)?.revert();

  const timeline: gsap.core.Timeline = gsap.timeline();

  if (prefersReducedMotion()) {
    return timeline;
  }

  const split = splitTitle(title);

  const targets: Readonly<Record<TitleCardTarget, readonly Element[]>> = {
    card: [card],
    tag: [tag],
    titleChars: split.chars,
    line: [line],
  };

  card.hidden = false;

  for (const step of TITLE_CARD_STEPS) {
    addStep(timeline, targets[step.target], step);
  }

  running.set(card, timeline);

  onSettled(timeline, () => {
    card.hidden = true;
    split.revert();
    gsap.set([card, tag, line], { clearProps: CARD_STYLE_PROPS });

    if (running.get(card) === timeline) {
      running.delete(card);
    }
  });

  return timeline;
};
