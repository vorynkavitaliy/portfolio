export type AnalyticsCaseSource = 'spec' | 'mdn-docs';

export type AnalyticsCase = Readonly<{
  id: string;
  source: AnalyticsCaseSource;
  reference: string;
  expected: string;
}>;

const FR_053 = 'FR-053 (CV download, contact send, LinkedIn and email clicks)';

const FR_054 = 'FR-054 (Take off, station docked with its id, text version opened)';

export const ANALYTICS_CASES = [
  {
    id: 'analytics.event-name',
    source: 'spec',
    reference:
      'SC-019 seam: the provider listens for the CustomEvent «portfolio:analytics» (decision D-14)',
    expected: 'ANALYTICS_EVENT equals the string portfolio:analytics',
  },
  {
    id: 'analytics.once-per-call',
    source: 'spec',
    reference: 'SC-019 (each analytics event fires once per action)',
    expected: 'one track call dispatches exactly one event on window, of type portfolio:analytics',
  },
  {
    id: 'analytics.detail',
    source: 'mdn-docs',
    reference: 'MDN CustomEvent.detail carries the payload passed to the constructor',
    expected: 'the event detail is the tracked event, name and fields unchanged',
  },
  {
    id: 'analytics.fr-053',
    source: 'spec',
    reference: FR_053,
    expected:
      'cv_download, contact_sent, linkedin_click and email_copy each arrive with exactly that name and no other field',
  },
  {
    id: 'analytics.fr-054.station',
    source: 'spec',
    reference: FR_054,
    expected: 'station_docked arrives with name and station id only',
  },
  {
    id: 'analytics.fr-054.take-off',
    source: 'spec',
    reference: FR_054,
    expected: 'take_off arrives with the name only',
  },
  {
    id: 'analytics.fr-054.text-version',
    source: 'spec',
    reference: FR_054,
    expected: 'text_version_opened arrives with name and source only',
  },
  {
    id: 'analytics.calls-independent',
    source: 'spec',
    reference: 'SC-019',
    expected: 'three track calls dispatch three events in call order',
  },
] as const satisfies readonly AnalyticsCase[];

export type AnalyticsCaseId = (typeof ANALYTICS_CASES)[number]['id'];
