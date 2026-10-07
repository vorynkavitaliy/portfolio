import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/core/config/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: new URL('/', getSiteUrl()).href }];
}
