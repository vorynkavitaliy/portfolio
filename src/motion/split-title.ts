import { SplitText } from '@/motion/gsap.client';

export const TITLE_SPLIT_VARS = {
  type: 'words,chars',
  mask: 'words',
  aria: 'auto',
  wordsClass: 'motion-word',
  charsClass: 'motion-char',
} as const satisfies SplitText.Vars;

export const splitTitle = (title: Element): SplitText => {
  return SplitText.create(title, { ...TITLE_SPLIT_VARS });
};
