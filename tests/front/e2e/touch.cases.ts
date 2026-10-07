export type CaseSource = 'spec' | 'wcag' | 'playwright-docs' | 'owner-2026-10-07';

export type CaseEntry = Readonly<{
  id: string;
  source: CaseSource;
  reference: string;
  expected: string;
}>;

export const TOUCH_CASES = [
  {
    id: 'touch.stick.ring',
    source: 'spec',
    reference: 'plan S25; FR-011',
    expected: 'the stick ring appears on press and hides on release',
  },
  {
    id: 'touch.stick.turns',
    source: 'spec',
    reference: 'plan S25; FR-011',
    expected: 'dragging the stick sideways moves a navigation label horizontally',
  },
  {
    id: 'touch.boost.visible',
    source: 'spec',
    reference: 'plan S25; FR-012',
    expected: 'the Boost button is displayed while flying on a coarse pointer',
  },
  {
    id: 'touch.boost.speed',
    source: 'spec',
    reference: 'plan S25; FR-012',
    expected: 'with Boost held the target distance shrinks at least 1.5 times faster per second',
  },
  {
    id: 'touch.hint.flying',
    source: 'spec',
    reference: 'plan S25; FR-041',
    expected: 'the flying hint reads the touch copy',
  },
  {
    id: 'touch.hint.docked',
    source: 'spec',
    reference: 'plan S25; FR-041',
    expected: 'the docked hint reads the touch copy',
  },
  {
    id: 'touch.takeoff.target',
    source: 'wcag',
    reference: 'WCAG 2.5.8 target size; plan S25',
    expected: 'the panel Take off button is at least 44 by 44 CSS pixels and leaves the station',
  },
] as const satisfies readonly CaseEntry[];
