export type TrackedLinkCaseSource = 'spec' | 'mdn-docs' | 'owner-2026-10-07';

export type TrackedLinkCase = Readonly<{
  id: string;
  source: TrackedLinkCaseSource;
  reference: string;
  expected: string;
}>;

export const TRACKED_LINK_CASES = [
  {
    id: 'tracked-link.renders',
    source: 'spec',
    reference: 'FR-053 (links are plain anchors)',
    expected: 'a link with its text, href and class; no target, rel or download by default',
  },
  {
    id: 'tracked-link.click-once',
    source: 'spec',
    reference: 'SC-019 (each analytics event fires once per action)',
    expected:
      'one click dispatches exactly one portfolio:analytics event whose detail is the given event',
  },
  {
    id: 'tracked-link.no-click-no-event',
    source: 'spec',
    reference: 'SC-019',
    expected: 'rendering and focusing the link dispatch nothing',
  },
  {
    id: 'tracked-link.two-clicks',
    source: 'spec',
    reference: 'SC-019 (once per action)',
    expected: 'two clicks dispatch two events',
  },
  {
    id: 'tracked-link.cv',
    source: 'spec',
    reference: 'FR-053 (CV download)',
    expected:
      'with download and event cv_download the anchor has a download attribute and the click reports cv_download',
  },
  {
    id: 'tracked-link.linkedin',
    source: 'spec',
    reference: 'FR-053 (LinkedIn click)',
    expected: 'the click reports linkedin_click',
  },
  {
    id: 'tracked-link.email',
    source: 'spec',
    reference: 'FR-053 (email click)',
    expected: 'a mailto link click reports its event once',
  },
  {
    id: 'tracked-link.external',
    source: 'mdn-docs',
    reference: 'MDN rel=noopener: links opened in a new tab must not expose window.opener',
    expected: 'external gives target "_blank" and rel "noopener"',
  },
  {
    id: 'tracked-link.internal',
    source: 'mdn-docs',
    reference: 'MDN anchor target and rel',
    expected: 'without external the anchor has neither target nor rel',
  },
] as const satisfies readonly TrackedLinkCase[];

export type TrackedLinkCaseId = (typeof TRACKED_LINK_CASES)[number]['id'];
