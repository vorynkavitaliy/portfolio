import { expect, test } from 'vitest';

import { gsap } from '@/motion/gsap.client';
import { PANEL_MOTION } from '@/motion/motion.tokens';
import { addNumberRolls } from '@/motion/number-roll';

import type { TextHolder } from '@/motion/number-roll';

const MID_ROLL = 1;

test('motion.roll.replay: a roll started over a half-rolled holder still ends on the real value', () => {
  const holder: TextHolder = { textContent: '7+' };

  const first: gsap.core.Timeline = gsap.timeline({ paused: true });

  addNumberRolls(first, [holder], PANEL_MOTION.numberRoll);
  first.time(MID_ROLL);
  first.kill();

  expect(holder.textContent).not.toBe('7+');

  const second: gsap.core.Timeline = gsap.timeline({ paused: true });
  const restore = addNumberRolls(second, [holder], PANEL_MOTION.numberRoll);

  second.progress(1);
  restore();

  expect(holder.textContent).toBe('7+');
});

test('motion.roll.revert-after-restore: reverting the timeline after the restore keeps the real value', () => {
  const holder: TextHolder = { textContent: '7+' };
  const timeline: gsap.core.Timeline = gsap.timeline({ paused: true });
  const restore = addNumberRolls(timeline, [holder], PANEL_MOTION.numberRoll);

  timeline.time(MID_ROLL);
  restore();
  timeline.revert();

  expect(holder.textContent).toBe('7+');
});

test('motion.roll.context-revert: a gsap context revert mid-roll leaves the real value', () => {
  const holder: TextHolder = { textContent: '20+' };
  const timelines: gsap.core.Timeline[] = [];

  const context = gsap.context(() => {
    const timeline: gsap.core.Timeline = gsap.timeline({ paused: true });
    const restore = addNumberRolls(timeline, [holder], PANEL_MOTION.numberRoll);

    timelines.push(timeline);

    gsap.context(() => {
      return restore;
    });
  });

  for (const timeline of timelines) {
    timeline.time(MID_ROLL);
  }

  expect(holder.textContent).not.toBe('20+');

  context.revert();

  expect(holder.textContent).toBe('20+');
});
