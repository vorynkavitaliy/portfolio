'use client';

import { useEffect, useRef, useState } from 'react';

import { track } from '@/core/analytics/analytics';

export const COPIED_RESET_MS = 1600;

type CopyEmailProps = Readonly<{
  email: string;
  copy: Readonly<{ idle: string; done: string }>;
}>;

export const CopyEmail = ({ email, copy }: CopyEmailProps) => {
  const [copied, setCopied] = useState<boolean>(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const markCopied = (): void => {
    setCopied(true);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, COPIED_RESET_MS);
  };

  const selectText = (): void => {
    const node: HTMLSpanElement | null = textRef.current;
    const selection: Selection | null = window.getSelection();

    if (node === null || selection === null) {
      return;
    }

    const range: Range = document.createRange();

    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleClick = (): void => {
    track({ name: 'email_copy' });

    try {
      window.navigator.clipboard.writeText(email).then(markCopied, selectText);
    } catch {
      selectText();
    }
  };

  return (
    <>
      <span ref={textRef} data-email-text="">
        {email}
      </span>

      <button type="button" className="copy" data-copy-email="" onClick={handleClick}>
        {copied ? copy.done : copy.idle}
      </button>

      <span className="sr-only" role="status" aria-live="polite" data-copy-live="">
        {copied ? copy.done : ''}
      </span>
    </>
  );
};
