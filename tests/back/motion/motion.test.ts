import { afterEach, expect, vi } from 'vitest';

import { caseTest } from '@tests/back/motion/motion.case-test';
import { gsap } from '@/motion/gsap.client';
import { magnetEnabled, magnetOffset } from '@/motion/magnet';
import {
  CSS_TRANSITION_MS,
  MAGNET_MOTION,
  PANEL_MOTION,
  SCENE_TIMING,
  TITLE_CARD_MOTION,
} from '@/motion/motion.tokens';
import { addNumberRolls, formatRoll, parseRollTarget } from '@/motion/number-roll';
import { PANEL_ENTRANCE_STEPS, PANEL_MOTION_SELECTORS } from '@/motion/panel-entrance';
import { MOTION_ALLOWED_QUERY, prefersReducedMotion } from '@/motion/reduced-motion';
import { onSettled } from '@/motion/timeline-steps';
import { TITLE_CARD_STEPS } from '@/motion/title-card';

import type { TextHolder } from '@/motion/number-roll';
import type { MotionStep } from '@/motion/timeline-steps';

type Tween = Readonly<{ duration: number; ease: string; stagger: number; position: number }>;

type MediaState = Readonly<{ motion: 'reduce' | 'no-preference'; pointer: 'fine' | 'coarse' }>;

afterEach(() => {
  vi.unstubAllGlobals();
});

const stubMedia = (state: MediaState): void => {
  const features: Readonly<Record<string, boolean>> = {
    '(prefers-reduced-motion: no-preference)': state.motion === 'no-preference',
    '(prefers-reduced-motion: reduce)': state.motion === 'reduce',
    '(pointer: fine)': state.pointer === 'fine',
    '(pointer: coarse)': state.pointer === 'coarse',
  };

  vi.stubGlobal('window', {
    matchMedia: (query: string): Readonly<{ matches: boolean }> => {
      const matches: boolean | undefined = features[query];

      if (matches === undefined) {
        throw new Error(`unexpected media query ${query}`);
      }

      return { matches };
    },
  });
};

const stepAt = <Target extends string>(
  steps: readonly MotionStep<Target>[],
  index: number,
): MotionStep<Target> => {
  const step: MotionStep<Target> | undefined = steps[index];

  if (step === undefined) {
    throw new Error(`no step at ${index}`);
  }

  return step;
};

const tweenAt = <Target extends string>(
  steps: readonly MotionStep<Target>[],
  index: number,
): Tween => {
  const step: MotionStep<Target> = stepAt(steps, index);

  if (step.kind === 'set') {
    throw new Error(`step ${index} is a set`);
  }

  return step.tween;
};

const expectPanelStep = (key: keyof typeof PANEL_MOTION, index: number, expected: Tween): void => {
  expect(PANEL_MOTION[key]).toEqual(expected);
  expect(tweenAt(PANEL_ENTRANCE_STEPS, index)).toEqual(expected);
};

const expectTitleCardStep = (
  key: keyof typeof TITLE_CARD_MOTION,
  index: number,
  expected: Tween,
): void => {
  expect(TITLE_CARD_MOTION[key]).toEqual(expected);
  expect(tweenAt(TITLE_CARD_STEPS, index)).toEqual(expected);
};

const rollTimeline = (
  holders: readonly TextHolder[],
): Readonly<{ timeline: gsap.core.Timeline; settle: () => void }> => {
  const timeline: gsap.core.Timeline = gsap.timeline({ paused: true });
  const settle = addNumberRolls(timeline, holders, PANEL_MOTION.numberRoll);

  onSettled(timeline, settle);

  return { timeline, settle };
};

const MID_ROLL = 1;

caseTest('motion.panel.wipe-in', 'wipe in token and step', () => {
  expectPanelStep('wipeIn', 0, { duration: 0.28, ease: 'power4.in', stagger: 0, position: 0 });
});

caseTest('motion.panel.wipe-out', 'wipe out token, origin set and step', () => {
  expect(stepAt(PANEL_ENTRANCE_STEPS, 1)).toEqual({
    kind: 'set',
    target: 'wipe',
    to: { transformOrigin: 'right' },
    position: 0.28,
  });

  expectPanelStep('wipeOut', 2, { duration: 0.45, ease: 'expo.out', stagger: 0, position: 0.28 });
});

caseTest('motion.panel.tag', 'tag token and step', () => {
  expectPanelStep('tag', 3, { duration: 0.4, ease: 'expo.out', stagger: 0, position: 0.3 });
});

caseTest('motion.panel.title-chars', 'title chars token and step', () => {
  expectPanelStep('titleChars', 4, {
    duration: 0.7,
    ease: 'expo.out',
    stagger: 0.018,
    position: 0.32,
  });
});

caseTest('motion.panel.lede', 'lede token and step', () => {
  expectPanelStep('lede', 5, { duration: 0.5, ease: 'power3.out', stagger: 0.08, position: 0.5 });
});

caseTest('motion.panel.items', 'items token and step', () => {
  expectPanelStep('items', 6, {
    duration: 0.45,
    ease: 'power3.out',
    stagger: 0.05,
    position: 0.6,
  });
});

caseTest('motion.panel.stats', 'stats token and step', () => {
  expectPanelStep('stats', 7, {
    duration: 0.5,
    ease: 'back.out(1.8)',
    stagger: 0.07,
    position: 0.62,
  });
});

caseTest('motion.panel.chips', 'chips token and step', () => {
  expectPanelStep('chips', 8, {
    duration: 0.35,
    ease: 'back.out(2.6)',
    stagger: 0.022,
    position: 0.75,
  });
});

caseTest('motion.panel.result', 'result token and step', () => {
  expectPanelStep('result', 9, { duration: 0.6, ease: 'expo.out', stagger: 0, position: 0.85 });
});

caseTest('motion.panel.number-roll', 'number roll token and tween placement', () => {
  expect(PANEL_MOTION.numberRoll).toEqual({
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.08,
    position: 0.7,
  });

  const { timeline } = rollTimeline([
    { textContent: '8+' },
    { textContent: '12' },
    { textContent: '40%' },
  ]);

  const tweens = timeline.getChildren(false, true, false);

  expect(tweens).toHaveLength(3);

  [0.7, 0.78, 0.86].forEach((start, index) => {
    const tween = tweens[index];

    expect(tween?.startTime()).toBeCloseTo(start, 10);
    expect(tween?.duration()).toBe(0.9);
    expect(tween?.vars.ease).toBe('power3.out');
  });
});

caseTest('motion.panel.from-states', 'steps in prototype order with prototype states', () => {
  const states = PANEL_ENTRANCE_STEPS.map((step) => {
    switch (step.kind) {
      case 'from':
        return { kind: step.kind, target: step.target, from: step.from };
      case 'to':
        return { kind: step.kind, target: step.target, to: step.to };
      case 'fromTo':
        return { kind: step.kind, target: step.target, from: step.from, to: step.to };
      case 'set':
        return { kind: step.kind, target: step.target, to: step.to };
    }
  });

  expect(states).toEqual([
    {
      kind: 'fromTo',
      target: 'wipe',
      from: { scaleX: 0, transformOrigin: 'left' },
      to: { scaleX: 1 },
    },
    { kind: 'set', target: 'wipe', to: { transformOrigin: 'right' } },
    { kind: 'to', target: 'wipe', to: { scaleX: 0 } },
    { kind: 'from', target: 'tag', from: { x: -24, opacity: 0 } },
    { kind: 'from', target: 'titleChars', from: { yPercent: 115, rotate: 8 } },
    { kind: 'from', target: 'lede', from: { y: 14, opacity: 0 } },
    { kind: 'from', target: 'item', from: { x: -18, opacity: 0 } },
    { kind: 'from', target: 'stat', from: { y: 18, opacity: 0 } },
    { kind: 'from', target: 'chip', from: { scale: 0.4, opacity: 0 } },
    { kind: 'from', target: 'result', from: { scaleX: 0, transformOrigin: 'left' } },
  ]);
});

caseTest('motion.panel.selectors', 'data-motion contract names', () => {
  expect(PANEL_MOTION_SELECTORS).toEqual({
    wipe: '[data-motion="wipe"]',
    tag: '[data-motion="tag"]',
    title: '[data-motion="title"]',
    lede: '[data-motion="lede"]',
    item: '[data-motion="item"]',
    stat: '[data-motion="stat"]',
    statValue: '[data-motion="stat-value"]',
    chip: '[data-motion="chip"]',
    result: '[data-motion="result"]',
  });
});

caseTest('motion.panel.transform-opacity-only', 'no layout property is animated', () => {
  const allowed: readonly string[] = [
    'x',
    'y',
    'xPercent',
    'yPercent',
    'scale',
    'scaleX',
    'scaleY',
    'rotate',
    'skewX',
    'skewY',
    'transformOrigin',
    'opacity',
  ];

  const steps: readonly MotionStep<string>[] = [...PANEL_ENTRANCE_STEPS, ...TITLE_CARD_STEPS];

  const animated: readonly string[] = steps.flatMap((step) => {
    const from: readonly string[] =
      step.kind === 'from' || step.kind === 'fromTo' ? Object.keys(step.from) : [];

    const to: readonly string[] = step.kind === 'from' ? [] : Object.keys(step.to);

    return [...from, ...to];
  });

  expect(
    animated.filter((name) => {
      return !allowed.includes(name);
    }),
  ).toEqual([]);
});

caseTest('motion.title-card.card-shown', 'card set to opacity 1 at 0', () => {
  expect(stepAt(TITLE_CARD_STEPS, 0)).toEqual({
    kind: 'set',
    target: 'card',
    to: { opacity: 1 },
    position: 0,
  });
});

caseTest('motion.title-card.line-in', 'line grows in', () => {
  expect(stepAt(TITLE_CARD_STEPS, 1)).toMatchObject({
    kind: 'fromTo',
    target: 'line',
    from: { scaleX: 0 },
    to: { scaleX: 1 },
  });

  expectTitleCardStep('lineIn', 1, { duration: 0.5, ease: 'expo.out', stagger: 0, position: 0 });
});

caseTest('motion.title-card.kicker-in', 'kicker rises in', () => {
  expect(stepAt(TITLE_CARD_STEPS, 2)).toMatchObject({
    kind: 'fromTo',
    target: 'tag',
    from: { y: 20, opacity: 0 },
    to: { y: 0, opacity: 1 },
  });

  expectTitleCardStep('kickerIn', 2, {
    duration: 0.4,
    ease: 'expo.out',
    stagger: 0,
    position: 0.08,
  });
});

caseTest('motion.title-card.chars-in', 'chars rise in', () => {
  expect(stepAt(TITLE_CARD_STEPS, 3)).toMatchObject({
    kind: 'fromTo',
    target: 'titleChars',
    from: { yPercent: 120, skewX: -18 },
    to: { yPercent: 0, skewX: 0 },
  });

  expectTitleCardStep('charsIn', 3, {
    duration: 0.65,
    ease: 'expo.out',
    stagger: 0.025,
    position: 0.1,
  });
});

caseTest('motion.title-card.chars-out', 'chars leave upwards', () => {
  expect(stepAt(TITLE_CARD_STEPS, 4)).toMatchObject({
    kind: 'to',
    target: 'titleChars',
    to: { yPercent: -120 },
  });

  expectTitleCardStep('charsOut', 4, {
    duration: 0.45,
    ease: 'power3.in',
    stagger: 0.015,
    position: 1.35,
  });
});

caseTest('motion.title-card.line-out', 'line shrinks from the left', () => {
  expect(stepAt(TITLE_CARD_STEPS, 5)).toMatchObject({
    kind: 'to',
    target: 'line',
    to: { scaleX: 0, transformOrigin: 'left' },
  });

  expectTitleCardStep('lineOut', 5, {
    duration: 0.4,
    ease: 'power3.in',
    stagger: 0,
    position: 1.4,
  });
});

caseTest('motion.title-card.kicker-out', 'kicker fades with the GSAP default ease', () => {
  expect(stepAt(TITLE_CARD_STEPS, 6)).toMatchObject({
    kind: 'to',
    target: 'tag',
    to: { opacity: 0 },
  });

  expect(TITLE_CARD_STEPS).toHaveLength(7);

  expectTitleCardStep('kickerOut', 6, {
    duration: 0.3,
    ease: 'power1.out',
    stagger: 0,
    position: 1.4,
  });
});

caseTest('motion.magnet.tokens', 'magnet duration, ease and factors', () => {
  expect(MAGNET_MOTION).toEqual({ duration: 0.4, ease: 'power3.out', factorX: 0.3, factorY: 0.4 });
});

caseTest('motion.magnet.offset', 'offset is distance from the centre times the factor', () => {
  const offset = magnetOffset({ left: 100, top: 50, width: 80, height: 40 }, 150, 60);

  expect(offset.x).toBeCloseTo(3, 10);
  expect(offset.y).toBeCloseTo(-4, 10);
});

caseTest('motion.magnet.enabled', 'fine pointer and motion allowed', () => {
  stubMedia({ motion: 'no-preference', pointer: 'fine' });

  expect(magnetEnabled()).toBe(true);
});

caseTest('motion.magnet.disabled.reduced', 'reduced motion turns the magnet off', () => {
  stubMedia({ motion: 'reduce', pointer: 'fine' });

  expect(prefersReducedMotion()).toBe(true);
  expect(magnetEnabled()).toBe(false);
});

caseTest('motion.magnet.disabled.coarse', 'coarse pointer turns the magnet off', () => {
  stubMedia({ motion: 'no-preference', pointer: 'coarse' });

  expect(prefersReducedMotion()).toBe(false);
  expect(magnetEnabled()).toBe(false);
});

caseTest('motion.scene.intro', 'intro duration', () => {
  expect(SCENE_TIMING.introMs).toBe(3200);
});

caseTest('motion.scene.auto-dock', 'auto-dock delay', () => {
  expect(SCENE_TIMING.autoDockMs).toBe(2600);
});

caseTest('motion.scene.ring', 'shock ring duration', () => {
  expect(SCENE_TIMING.ringSeconds).toBe(1.3);
});

caseTest('motion.scene.burst', 'particle burst duration', () => {
  expect(SCENE_TIMING.burstSeconds).toBe(1.4);
});

caseTest('motion.scene.flash-take-off', 'take-off flash strength and fade', () => {
  expect(SCENE_TIMING.flashTakeOff).toEqual({ opacity: 0.6, ms: 900 });
});

caseTest('motion.scene.flash-send', 'send flash strength and fade', () => {
  expect(SCENE_TIMING.flashSend).toEqual({ opacity: 0.5, ms: 700 });
});

caseTest('motion.css.transitions', 'CSS transition durations', () => {
  expect(CSS_TRANSITION_MS).toEqual({
    base: 140,
    panelOpacity: 320,
    panelTransformOut: 420,
    panelTransformIn: 520,
    loader: 700,
    hint: 400,
    navLayer: 500,
  });
});

caseTest('motion.reduced.query', 'motion-allowed media query', () => {
  expect(MOTION_ALLOWED_QUERY).toBe('(prefers-reduced-motion: no-preference)');
});

caseTest('motion.reduced.reduce', 'reduce means reduced motion', () => {
  stubMedia({ motion: 'reduce', pointer: 'coarse' });

  expect(prefersReducedMotion()).toBe(true);
});

caseTest('motion.reduced.no-preference', 'no-preference allows motion', () => {
  stubMedia({ motion: 'no-preference', pointer: 'coarse' });

  expect(prefersReducedMotion()).toBe(false);
});

caseTest('motion.reduced.no-window', 'server render counts as reduced motion', () => {
  expect(typeof window).toBe('undefined');
  expect(prefersReducedMotion()).toBe(true);
  expect(magnetEnabled()).toBe(false);
});

caseTest('motion.roll.parse.suffix', 'number with a suffix', () => {
  expect(parseRollTarget('8+')).toEqual({ prefix: '', value: 8, suffix: '+' });
});

caseTest('motion.roll.parse.prefix-suffix', 'number with a prefix and a suffix', () => {
  expect(parseRollTarget('~40% faster')).toEqual({ prefix: '~', value: 40, suffix: '% faster' });
});

caseTest('motion.roll.parse.no-digits', 'text without digits', () => {
  expect(parseRollTarget('Remote')).toBeNull();
});

caseTest('motion.roll.format', 'rounds the rolled value', () => {
  expect(formatRoll({ prefix: '~', value: 40, suffix: '%' }, 34.6)).toBe('~35%');
});

caseTest('motion.roll.mid-value', 'half way through power3.out', () => {
  const holder: TextHolder = { textContent: '80%' };
  const { timeline } = rollTimeline([holder]);

  timeline.time(0.7 + 0.45);

  expect(holder.textContent).toBe('75%');
});

caseTest('motion.roll.skip-non-numeric', 'text without digits is left alone', () => {
  const holder: TextHolder = { textContent: 'Remote' };
  const { timeline } = rollTimeline([holder]);

  expect(timeline.getChildren()).toHaveLength(0);

  timeline.progress(1);

  expect(holder.textContent).toBe('Remote');
});

caseTest('motion.roll.restore.complete', 'original text after completion', () => {
  const holder: TextHolder = { textContent: '007 days' };
  const { timeline } = rollTimeline([holder]);

  timeline.time(MID_ROLL);

  expect(holder.textContent).not.toBe('007 days');

  timeline.progress(1);

  expect(holder.textContent).toBe('007 days');
});

caseTest('motion.roll.restore.revert', 'original text after revert', () => {
  const holder: TextHolder = { textContent: '8+' };
  const { timeline } = rollTimeline([holder]);

  timeline.time(MID_ROLL);

  expect(holder.textContent).not.toBe('8+');

  timeline.revert();

  expect(holder.textContent).toBe('8+');
});

caseTest('motion.roll.restore.kill', 'original text after kill', () => {
  const holder: TextHolder = { textContent: '12 yrs' };
  const { timeline } = rollTimeline([holder]);

  timeline.time(MID_ROLL);

  expect(holder.textContent).not.toBe('12 yrs');

  timeline.kill();

  expect(holder.textContent).toBe('12 yrs');
});

caseTest('motion.roll.restore.context', 'original text after context revert', () => {
  const holder: TextHolder = { textContent: '40%' };

  const context = gsap.context(() => {
    const { timeline } = rollTimeline([holder]);

    timeline.time(MID_ROLL);
  });

  expect(holder.textContent).not.toBe('40%');

  context.revert();

  expect(holder.textContent).toBe('40%');
});

caseTest('motion.roll.settle-once', 'cleanup runs once', () => {
  const timeline: gsap.core.Timeline = gsap.timeline({ paused: true });
  const settle = vi.fn();

  timeline.to({ value: 0 }, { value: 1, duration: 1 });
  onSettled(timeline, settle);
  timeline.progress(1);
  timeline.revert();

  expect(settle).toHaveBeenCalledTimes(1);
});
