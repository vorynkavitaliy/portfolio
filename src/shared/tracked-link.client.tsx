'use client';

import type { ReactNode } from 'react';

import { track, type AnalyticsEvent } from '@/core/analytics/analytics';

type TrackedLinkProps = Readonly<{
  href: string;
  event: AnalyticsEvent;
  external?: boolean;
  className?: string;
  children: ReactNode;
}>;

export const TrackedLink = ({ href, event, external, className, children }: TrackedLinkProps) => {
  return (
    <a
      href={href}
      className={className}
      target={external === true ? '_blank' : undefined}
      rel={external === true ? 'noopener' : undefined}
      onClick={() => {
        track(event);
      }}
    >
      {children}
    </a>
  );
};
