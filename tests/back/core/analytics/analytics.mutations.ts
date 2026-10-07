import type { AnalyticsCaseId } from '@tests/back/core/analytics/analytics.cases';

export type AnalyticsMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly AnalyticsCaseId[];
}>;

const FILE = 'src/core/analytics/analytics.ts';

export const ANALYTICS_MUTATIONS: readonly AnalyticsMutation[] = [
  {
    id: 'event-name.changed',
    file: FILE,
    find: "'portfolio:analytics'",
    replace: "'portfolio:analytic'",
    caseIds: ['analytics.event-name', 'analytics.once-per-call'],
  },
  {
    id: 'track.dispatches-twice',
    file: FILE,
    find: '  window.dispatchEvent(new CustomEvent<AnalyticsEvent>(ANALYTICS_EVENT, { detail: event }));',
    replace:
      '  window.dispatchEvent(new CustomEvent<AnalyticsEvent>(ANALYTICS_EVENT, { detail: event }));\n  window.dispatchEvent(new CustomEvent<AnalyticsEvent>(ANALYTICS_EVENT, { detail: event }));',
    caseIds: ['analytics.once-per-call', 'analytics.calls-independent'],
  },
  {
    id: 'track.detail-dropped',
    file: FILE,
    find: '{ detail: event }',
    replace: '{ detail: undefined }',
    caseIds: ['analytics.detail', 'analytics.fr-053', 'analytics.fr-054.station'],
  },
  {
    id: 'track.detail-name-only',
    file: FILE,
    find: '{ detail: event }',
    replace: '{ detail: { name: event.name } }',
    caseIds: ['analytics.fr-054.station', 'analytics.fr-054.text-version'],
  },
  {
    id: 'track.detail-extra-field',
    file: FILE,
    find: '{ detail: event }',
    replace: '{ detail: { ...event, at: 1 } }',
    caseIds: ['analytics.fr-053', 'analytics.fr-054.take-off'],
  },
  {
    id: 'track.no-dispatch',
    file: FILE,
    find: '  window.dispatchEvent(',
    replace: '  void (',
    caseIds: ['analytics.once-per-call', 'analytics.calls-independent'],
  },
];
