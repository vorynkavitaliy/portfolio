import type { NextConfig } from 'next';

import { NOINDEX_ROBOTS_VALUE, isIndexable } from '@/core/config/indexing';
import { resolveSiteUrl } from '@/core/config/site-url';

const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

const INDEXING_HEADERS = isIndexable(resolveSiteUrl(process.env))
  ? []
  : [{ key: 'X-Robots-Tag', value: NOINDEX_ROBOTS_VALUE }];

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_WORLD_DEBUG: process.env.NEXT_PUBLIC_WORLD_DEBUG ?? '0' },
  experimental: {
    serverActions: { bodySizeLimit: '16kb' },
  },
  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: [...SECURITY_HEADERS, ...INDEXING_HEADERS],
      },
    ]);
  },
};

export default nextConfig;
