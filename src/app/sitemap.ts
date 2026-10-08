import type { MetadataRoute } from 'next';

import { buildSitemap } from '@/core/config/indexing';
import { getSiteUrl } from '@/core/config/site-url';

const BUILT_AT: Date = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(getSiteUrl(), BUILT_AT);
}
