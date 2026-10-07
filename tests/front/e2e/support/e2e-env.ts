export const MAIL_SMTP_HOST = '127.0.0.1';
export const MAIL_SMTP_PORT = 1025;
export const MAIL_API_ORIGIN = 'http://127.0.0.1:8025';
export const MAIL_INFO_URL = `${MAIL_API_ORIGIN}/api/v1/info`;
export const CLIENT_IP_HEADER = 'x-test-client-ip';
export const CONTACT_FROM = 'site@portfolio.test';
export const CONTACT_TO = 'owner@portfolio.test';
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000BB';
export const TURNSTILE_TEST_SECRET_PASS = '1x0000000000000000000000000000000AA';
export const TURNSTILE_TEST_SECRET_FAIL = '2x0000000000000000000000000000000AA';

export const serverEnvFor = (baseURL: string): Readonly<Record<string, string>> => {
  return {
    SMTP_HOST: MAIL_SMTP_HOST,
    SMTP_PORT: String(MAIL_SMTP_PORT),
    SMTP_USER: 'e2e',
    SMTP_PASS: 'e2e',
    CONTACT_FROM,
    CONTACT_TO,
    CLIENT_IP_HEADER,
    SITE_URL: baseURL,
    TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
    TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET_PASS,
  };
};
