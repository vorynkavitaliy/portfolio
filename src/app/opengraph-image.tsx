import { ImageResponse } from 'next/og';
import type { CSSProperties } from 'react';

import { SITE_COPY } from '@/content/site.content';
import { STATIONS_COPY } from '@/content/stations.content';
import { PALETTE_TOKENS } from '@/core/styles/palette.tokens';

export const alt: string = SITE_COPY.ogAlt;

export const size = { width: 1200, height: 630 };

export const contentType = 'image/png';

const INK = PALETTE_TOKENS.ink;
const TEXT = PALETTE_TOKENS.text;
const MUTED = PALETTE_TOKENS.muted;
const SIGNAL = PALETTE_TOKENS.signal;

const ROOT_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '0 96px',
  background: INK,
  color: TEXT,
};

const NAME_STYLE: CSSProperties = { fontSize: 96, fontWeight: 700, lineHeight: 1.05 };

const RULE_STYLE: CSSProperties = { width: 240, height: 12, background: SIGNAL, margin: '36px 0' };

const ROLE_STYLE: CSSProperties = { fontSize: 44, color: MUTED };

export default function OpengraphImage() {
  return new ImageResponse(
    <div style={ROOT_STYLE}>
      <div style={NAME_STYLE}>{SITE_COPY.person.name}</div>

      <div style={RULE_STYLE} />

      <div style={ROLE_STYLE}>{STATIONS_COPY['home-base'].role}</div>
    </div>,
    { ...size },
  );
}
