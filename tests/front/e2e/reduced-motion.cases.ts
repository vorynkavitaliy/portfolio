export type CaseSource = 'spec' | 'wcag' | 'playwright-docs' | 'owner-2026-10-07';

export type CaseEntry = Readonly<{
  id: string;
  source: CaseSource;
  reference: string;
  expected: string;
}>;

export const REDUCED_MOTION_CASES = [
  {
    id: 'motion.reduced.docked-fast',
    source: 'spec',
    reference: 'plan S25; FR-039; SC-010',
    expected: 'after Take off with reduced motion the world is docked at Home within 500 ms',
  },
  {
    id: 'motion.reduced.panel-instant',
    source: 'spec',
    reference: 'plan S25; FR-039; rules/motion.md',
    expected:
      'the docked station panel is visible at once with transition-duration 0s and the nav layer fades in without a transition',
  },
  {
    id: 'motion.reduced.panel-still',
    source: 'spec',
    reference: 'plan S25; FR-039',
    expected: 'the docked panel transform and opacity are equal in two samples 120 ms apart',
  },
  {
    id: 'motion.reduced.no-title-card',
    source: 'spec',
    reference: 'plan S25; FR-039',
    expected: 'the title card stays hidden after docking',
  },
  {
    id: 'motion.reduced.no-flash',
    source: 'spec',
    reference: 'plan S25; FR-039',
    expected: 'after Take off the flash has opacity 0 and no inline transition',
  },
  {
    id: 'motion.reduced.no-magnet',
    source: 'spec',
    reference: 'plan S25; FR-039; rules/motion.md',
    expected: 'hovering a magnetic control applies no transform',
  },
  {
    id: 'motion.reduced.still-flies',
    source: 'spec',
    reference: 'plan S25; FR-039',
    expected: 'holding D after Take off still moves a navigation label horizontally',
  },
] as const satisfies readonly CaseEntry[];
