import type { MetadataRoute } from 'next';

import { SITE_COPY } from '@/content/site.content';
import { PALETTE_TOKENS } from '@/core/styles/palette.tokens';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_COPY.siteName,
    short_name: SITE_COPY.siteName,
    start_url: '/',
    display: 'standalone',
    theme_color: PALETTE_TOKENS.ink,
    background_color: PALETTE_TOKENS.ink,
    icons: [
      { src: '/icon1/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon1/512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
