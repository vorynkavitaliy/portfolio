import type { gsap } from '@/motion/gsap.client';
import type { MotionTween } from '@/motion/motion.tokens';

export type TextHolder = { textContent: string | null };

export type RollTarget = Readonly<{ prefix: string; value: number; suffix: string }>;

const finalTexts = new WeakMap<TextHolder, string>();

const ROLL_PATTERN = /^(\D*)(\d+)(.*)$/;

export const parseRollTarget = (text: string): RollTarget | null => {
  const match: RegExpMatchArray | null = ROLL_PATTERN.exec(text);

  if (match === null) {
    return null;
  }

  const [, prefix = '', digits = '', suffix = ''] = match;

  return { prefix, value: Number(digits), suffix };
};

export const formatRoll = (target: RollTarget, value: number): string => {
  return `${target.prefix}${Math.round(value)}${target.suffix}`;
};

export const addNumberRolls = (
  timeline: gsap.core.Timeline,
  holders: readonly TextHolder[],
  tween: MotionTween,
): (() => void) => {
  const restores: readonly (() => void)[] = holders.flatMap((holder, index) => {
    const original: string = finalTexts.get(holder) ?? holder.textContent ?? '';

    finalTexts.set(holder, original);
    const target: RollTarget | null = parseRollTarget(original);

    if (target === null) {
      return [];
    }

    const counter = { value: 0 };

    timeline.to(
      counter,
      {
        value: target.value,
        duration: tween.duration,
        ease: tween.ease,
        onUpdate: () => {
          holder.textContent = formatRoll(target, counter.value);
        },
      },
      tween.position + tween.stagger * index,
    );

    return [
      () => {
        holder.textContent = original;
      },
    ];
  });

  return () => {
    for (const restore of restores) {
      restore();
    }
  };
};
