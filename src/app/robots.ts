import type { MetadataRoute } from 'next';

import { buildRobots } from '@/core/config/indexing';
import { getSiteUrl } from '@/core/config/site-url';

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getSiteUrl());
}
