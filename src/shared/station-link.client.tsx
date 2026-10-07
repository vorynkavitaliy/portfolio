'use client';

import type { MouseEvent, ReactNode } from 'react';

import type { StationId } from '@/core/world/stations';
import { useWorld } from '@/core/world/use-world';
import { worldStore } from '@/core/world/world-store';

type StationLinkProps = Readonly<{
  station: StationId;
  className?: string;
  children: ReactNode;
  magnet?: boolean;
}>;

export const StationLink = ({ station, className, children, magnet }: StationLinkProps) => {
  const flying: boolean = useWorld((state) => {
    return state.view === 'world' && state.boot.status === 'running';
  });

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    if (!flying) {
      return;
    }

    event.preventDefault();
    worldStore.dispatch({ type: 'autopilot', station });
  };

  return (
    <a
      href={`#${station}`}
      className={className}
      data-magnet={magnet === true ? '' : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};
