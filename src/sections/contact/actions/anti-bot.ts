import 'server-only';

import type { RawContactForm } from '@/sections/contact/contact.schema';

export const MIN_FILL_MS = 3000;

export const isBotSubmission = (raw: RawContactForm, now: number): boolean => {
  if (raw.website.trim() !== '') {
    return true;
  }

  const startedAt: string = raw.startedAt.trim();

  if (startedAt === '') {
    return false;
  }

  const started: number = Number(startedAt);

  return Number.isFinite(started) && now - started < MIN_FILL_MS;
};
