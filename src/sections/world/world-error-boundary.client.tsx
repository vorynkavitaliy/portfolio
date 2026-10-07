'use client';

import { Component, type ReactNode } from 'react';

import { failWorld } from '@/core/world/world-actions';
import { worldStore } from '@/core/world/world-store';

import type { WorldFailReason } from '@/core/world/world.types';

type WorldErrorBoundaryProps = Readonly<{
  reason: WorldFailReason;
  children: ReactNode;
}>;

type WorldErrorBoundaryState = Readonly<{ failed: boolean }>;

export class WorldErrorBoundary extends Component<
  WorldErrorBoundaryProps,
  WorldErrorBoundaryState
> {
  override state: WorldErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): WorldErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(): void {
    const reason: WorldFailReason = this.props.reason;

    worldStore.update((state) => {
      return failWorld(state, reason);
    });
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
