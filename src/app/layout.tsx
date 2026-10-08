import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { SITE_COPY } from '@/content/site.content';
import { getSiteUrl } from '@/core/config/site-url';
import { archivo, pixelifySans } from '@/core/fonts/fonts';
import { PALETTE_TOKENS } from '@/core/styles/palette.tokens';

import '@/core/styles/globals.css';

const SITE_URL: URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: SITE_COPY.title,
  keywords: [...SITE_COPY.keywords],
  description: SITE_COPY.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    url: '/',
    title: SITE_COPY.ogTitle,
    description: SITE_COPY.description,
    siteName: SITE_COPY.siteName,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_COPY.ogTitle,
    description: SITE_COPY.description,
  },
};

export const viewport: Viewport = {
  themeColor: PALETTE_TOKENS.ink,
  colorScheme: 'dark',
  viewportFit: 'cover',
};

const profileJsonLd: string = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  url: SITE_URL.href,
  inLanguage: 'en',
  mainEntity: {
    '@type': 'Person',
    name: SITE_COPY.person.name,
    jobTitle: SITE_COPY.person.jobTitle,
    description: SITE_COPY.description,
    url: SITE_URL.href,
    image: new URL('/opengraph-image', SITE_URL).href,
    sameAs: SITE_COPY.person.sameAs,
    knowsAbout: SITE_COPY.person.knowsAbout,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_COPY.person.address.locality,
      addressCountry: SITE_COPY.person.address.country,
    },
  },
}).replace(/</g, '\\u003c');

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${pixelifySans.variable} ${archivo.variable}`}>
      <body>
        {children}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: profileJsonLd }} />
      </body>
    </html>
  );
}
