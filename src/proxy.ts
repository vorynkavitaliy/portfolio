import { NextResponse, type NextRequest, type ProxyConfig } from 'next/server';

import { buildContentSecurityPolicy, createNonce } from '@/core/config/csp';

const CSP_HEADER = 'Content-Security-Policy';

export const proxy = (request: NextRequest): NextResponse => {
  const policy: string = buildContentSecurityPolicy(
    createNonce(),
    process.env.NODE_ENV === 'development',
  );

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(CSP_HEADER, policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set(CSP_HEADER, policy);

  return response;
};

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
} satisfies ProxyConfig;
