'use client';

import type { ReactNode } from 'react';

import { track, type AnalyticsEvent } from '@/core/analytics/analytics';

type TrackedLinkProps = Readonly<{
  href: string;
  event: AnalyticsEvent;
  download?: boolean;
  external?: boolean;
  className?: string;
  children: ReactNode;
}>;

export const TrackedLink = ({
  href,
  event,
  download,
  external,
  className,
  children,
}: TrackedLinkProps) => {
  return (
    <a
      href={href}
      className={className}
      download={download === true ? '' : undefined}
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
