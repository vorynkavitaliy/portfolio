import type { FirstScreenCase } from '@tests/front/e2e/first-screen.cases';

export const CASES = [
  {
    id: 'spec.text.nojs-structure',
    source: 'spec',
    reference: 'portfolio-spec FR-001, FR-002, FR-045, SC-001',
    expected:
      'without JavaScript: one h1, a heading per station in spec order, form present, no loader, no HUD controls',
  },
  {
    id: 'sec.nojs.text-visible-at-t0',
    source: 'spec',
    reference: 'portfolio-spec FR-002; plan S21 CSS fix',
    expected: 'without JavaScript #text is visible and [data-loader] is display none immediately',
  },
  {
    id: 'spec.text.deep-link-no-loader',
    source: 'spec',
    reference: 'plan S23 deep link',
    expected: 'opening /#text never makes the loader visible at any sampled frame',
  },
  {
    id: 'spec.text.focus-order',
    source: 'spec',
    reference: 'portfolio-spec FR-045',
    expected: 'brand, then the 3D world toggle, are the first two focusable elements',
  },
  {
    id: 'spec.text.brand-first-no-toggle',
    source: 'spec',
    reference: 'portfolio-spec FR-045, FR-004',
    expected: 'without WebGL2 the brand is the first focusable and no world toggle exists',
  },
  {
    id: 'spec.text.no-horizontal-scroll',
    source: 'spec',
    reference: 'portfolio-spec FR-045 (readable at 390 px)',
    expected: 'at 390 px the text version does not scroll horizontally',
  },
  {
    id: 'wcag.axe.text-version',
    source: 'wcag',
    reference: 'portfolio-spec SC-011',
    expected: 'axe reports zero violations on the text version',
  },
  {
    id: 'wcag.keyboard.text-walk',
    source: 'wcag',
    reference: 'portfolio-spec SC-011; WCAG 2.4.7 focus visible',
    expected: 'tabbing reaches the form submit and every focused element shows an outline',
  },
] as const satisfies readonly FirstScreenCase[];

export type TextVersionCaseId = (typeof CASES)[number]['id'];
