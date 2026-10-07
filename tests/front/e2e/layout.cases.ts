export type CaseSource = 'spec' | 'wcag' | 'playwright-docs' | 'owner-2026-10-07';

export type CaseEntry = Readonly<{
  id: string;
  source: CaseSource;
  reference: string;
  expected: string;
}>;

export const LAYOUT_CASES = [
  {
    id: 'layout.mobile.no-overflow',
    source: 'spec',
    reference: 'plan S25; SC-010; verification gate 6',
    expected: 'at 390 px the text view and the docked world do not scroll horizontally',
  },
  {
    id: 'layout.mobile.sheet',
    source: 'spec',
    reference: 'plan S25; SC-010',
    expected:
      'the docked bottom sheet is at most half of the viewport height and does not overlap the bottom bar',
  },
  {
    id: 'layout.mobile.boost-clear',
    source: 'spec',
    reference: 'plan S25; SC-010',
    expected: 'while flying the Boost button sits above the bottom bar without overlap',
  },
  {
    id: 'layout.header.labels-sr-only',
    source: 'spec',
    reference: 'plan S25; FR-041; styling.md',
    expected: 'header button labels are visually hidden at 860 px and visible at 861 px',
  },
  {
    id: 'layout.chunks.lazy-hud',
    source: 'spec',
    reference: 'plan S25; NFR-006; rules/performance.md',
    expected:
      'the first-load scripts contain no GSAP and no HUD code, and the HUD chunk is requested only after the world view starts',
  },
] as const satisfies readonly CaseEntry[];
