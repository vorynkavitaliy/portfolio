'use client';

import type { ReactNode } from 'react';

import { useWorld } from '@/core/world/use-world';

import type { WorldCopy } from '@/content/content.types';
import type { TextReason } from '@/core/world/world.types';

type NoticeProps = Readonly<{ copy: WorldCopy['notices'] }>;

const messageFor = (copy: WorldCopy['notices'], reason: TextReason | null): string | null => {
  if (reason === 'no-webgl2') {
    return copy.noWebgl2;
  }

  if (reason === 'failed') {
    return copy.failed;
  }

  return null;
};

export const Notice = ({ copy }: NoticeProps): ReactNode => {
  const reason: TextReason | null = useWorld((state) => {
    return state.view === 'text' ? state.textReason : null;
  });

  const message: string | null = messageFor(copy, reason);

  return (
    <div role="status" data-notice="" className="empty:sr-only">
      {message === null ? null : (
        <p className="m-0 bg-panel px-4 py-3 font-pixel text-signal shadow-[inset_0_0_0_2px_var(--color-signal)] pixel-edge">
          {message}
        </p>
      )}
    </div>
  );
};
