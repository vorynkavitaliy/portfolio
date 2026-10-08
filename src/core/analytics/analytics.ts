import type { StationId } from '@/core/world/stations';

export const ANALYTICS_EVENT = 'portfolio:analytics';

export type TextVersionSource = 'toggle' | 'loader' | 'deep-link' | 'fallback' | 'low-end';

export type AnalyticsEvent =
  | { name: 'contact_sent' }
  | { name: 'linkedin_click' }
  | { name: 'email_copy' }
  | { name: 'take_off' }
  | { name: 'station_docked'; station: StationId }
  | { name: 'text_version_opened'; source: TextVersionSource };

export const track = (event: AnalyticsEvent): void => {
  window.dispatchEvent(new CustomEvent<AnalyticsEvent>(ANALYTICS_EVENT, { detail: event }));
};
