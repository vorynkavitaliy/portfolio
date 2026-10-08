import type { MetadataRoute } from 'next';

export const PRODUCTION_HOSTNAME = 'vorynka.dev';

export const NOINDEX_ROBOTS_VALUE = 'noindex, nofollow';

export const isIndexable = (site: URL): boolean => {
  return site.hostname === PRODUCTION_HOSTNAME;
};

export const buildRobots = (site: URL): MetadataRoute.Robots => {
  if (!isIndexable(site)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', site).href,
  };
};

export const buildSitemap = (site: URL, lastModified: Date): MetadataRoute.Sitemap => {
  return [{ url: new URL('/', site).href, lastModified }];
};
