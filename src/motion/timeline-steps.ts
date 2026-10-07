import { gsap } from '@/motion/gsap.client';

import type { MotionTween } from '@/motion/motion.tokens';

export type TweenProps = Readonly<Record<string, number | string>>;

export type MotionStep<Target extends string> =
  | Readonly<{ kind: 'from'; target: Target; from: TweenProps; tween: MotionTween }>
  | Readonly<{ kind: 'to'; target: Target; to: TweenProps; tween: MotionTween }>
  | Readonly<{
      kind: 'fromTo';
      target: Target;
      from: TweenProps;
      to: TweenProps;
      tween: MotionTween;
    }>
  | Readonly<{ kind: 'set'; target: Target; to: TweenProps; position: number }>;

const timingOf = (tween: MotionTween): gsap.TweenVars => {
  return { duration: tween.duration, ease: tween.ease, stagger: tween.stagger };
};

export const addStep = <Target extends string>(
  timeline: gsap.core.Timeline,
  targets: readonly Element[],
  step: MotionStep<Target>,
): void => {
  if (targets.length === 0) {
    return;
  }

  const list: Element[] = [...targets];

  switch (step.kind) {
    case 'from':
      timeline.from(list, { ...step.from, ...timingOf(step.tween) }, step.tween.position);

      return;
    case 'to':
      timeline.to(list, { ...step.to, ...timingOf(step.tween) }, step.tween.position);

      return;
    case 'fromTo':
      timeline.fromTo(
        list,
        { ...step.from },
        { ...step.to, ...timingOf(step.tween) },
        step.tween.position,
      );

      return;
    case 'set':
      timeline.set(list, { ...step.to }, step.position);
  }
};

export const onSettled = (timeline: gsap.core.Timeline, settle: () => void): (() => void) => {
  let settled = false;

  const once = (): void => {
    if (settled) {
      return;
    }

    settled = true;
    settle();
  };

  timeline.eventCallback('onComplete', once);
  timeline.eventCallback('onInterrupt', once);

  gsap.context(() => {
    return once;
  });

  return once;
};
