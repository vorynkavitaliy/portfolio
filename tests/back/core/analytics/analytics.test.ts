import { afterEach, beforeEach, expect, vi } from 'vitest';

import { caseTest } from '@tests/back/core/analytics/analytics.case-test';
import { ANALYTICS_EVENT, track, type AnalyticsEvent } from '@/core/analytics/analytics';

let target: EventTarget;
let received: Event[];

beforeEach(() => {
  target = new EventTarget();
  received = [];

  target.addEventListener('portfolio:analytics', (event) => {
    received.push(event);
  });

  vi.stubGlobal('window', target);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const detailOf = (event: Event | undefined): unknown => {
  return event instanceof CustomEvent ? event.detail : undefined;
};

caseTest('analytics.event-name', 'the event type is portfolio:analytics', () => {
  expect(ANALYTICS_EVENT).toBe('portfolio:analytics');
});

caseTest('analytics.once-per-call', 'one call, one event', () => {
  track({ name: 'take_off' });

  expect(received).toHaveLength(1);
  expect(received[0]?.type).toBe('portfolio:analytics');
});

caseTest('analytics.detail', 'detail is the payload', () => {
  const event: AnalyticsEvent = { name: 'station_docked', station: 'systems' };

  track(event);

  expect(detailOf(received[0])).toEqual({ name: 'station_docked', station: 'systems' });
});

caseTest('analytics.fr-053', 'the four conversion events carry only a name', () => {
  const names = ['cv_download', 'contact_sent', 'linkedin_click', 'email_copy'] as const;

  for (const name of names) {
    track({ name });
  }

  expect(received.map(detailOf)).toEqual([
    { name: 'cv_download' },
    { name: 'contact_sent' },
    { name: 'linkedin_click' },
    { name: 'email_copy' },
  ]);
});

caseTest('analytics.fr-054.station', 'docked event names the station', () => {
  track({ name: 'station_docked', station: 'contact' });

  expect(detailOf(received[0])).toEqual({ name: 'station_docked', station: 'contact' });
});

caseTest('analytics.fr-054.take-off', 'take off carries only a name', () => {
  track({ name: 'take_off' });

  expect(detailOf(received[0])).toEqual({ name: 'take_off' });
});

caseTest('analytics.fr-054.text-version', 'text version names its source', () => {
  track({ name: 'text_version_opened', source: 'low-end' });

  expect(detailOf(received[0])).toEqual({ name: 'text_version_opened', source: 'low-end' });
});

caseTest('analytics.calls-independent', 'three calls, three ordered events', () => {
  track({ name: 'take_off' });
  track({ name: 'station_docked', station: 'home-base' });
  track({ name: 'contact_sent' });

  expect(received.map(detailOf)).toEqual([
    { name: 'take_off' },
    { name: 'station_docked', station: 'home-base' },
    { name: 'contact_sent' },
  ]);
});
