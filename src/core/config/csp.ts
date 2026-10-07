const scriptSources = (nonce: string, development: boolean): string => {
  const sources: readonly string[] = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];

  return (development ? [...sources, "'unsafe-eval'"] : sources).join(' ');
};

export const buildContentSecurityPolicy = (nonce: string, development: boolean): string => {
  return [
    "default-src 'self'",
    `script-src ${scriptSources(nonce, development)}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
};

export const createNonce = (): string => {
  return Buffer.from(crypto.randomUUID()).toString('base64');
};
