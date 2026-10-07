import type { FirstScreenCase } from '@tests/front/e2e/first-screen.cases';

export const CASES = [
  {
    id: 'spec.analytics.text-version-sources',
    source: 'spec',
    reference: 'portfolio-spec FR-054, SC-019',
    expected:
      'text_version_opened fires once with source deep-link, low-end and loader for its trigger',
  },
  {
    id: 'spec.analytics.fallback-source',
    source: 'spec',
    reference: 'portfolio-spec FR-054, SC-019',
    expected: 'without WebGL2 text_version_opened fires once with source fallback',
  },
  {
    id: 'spec.analytics.link-copy-send',
    source: 'spec',
    reference: 'portfolio-spec FR-053, SC-019',
    expected: 'linkedin_click, email_copy and contact_sent each fire once per action',
  },
  {
    id: 'spec.analytics.world-funnel',
    source: 'spec',
    reference: 'portfolio-spec FR-054, SC-019',
    expected: 'take_off, station_docked home-base and text_version_opened toggle fire once each',
  },
  {
    id: 'spec.analytics.no-third-party-load',
    source: 'spec',
    reference: 'portfolio-spec SC-020',
    expected: 'loading / makes no request to a foreign origin',
  },
  {
    id: 'spec.analytics.no-third-party-world',
    source: 'spec',
    reference: 'portfolio-spec SC-020',
    expected: 'booting and taking off makes no request to a foreign origin',
  },
] as const satisfies readonly FirstScreenCase[];

export type AnalyticsCaseId = (typeof CASES)[number]['id'];
