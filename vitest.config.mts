import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const SRC_DIR: string = fileURLToPath(new URL('./src', import.meta.url));
const TESTS_DIR: string = fileURLToPath(new URL('./tests', import.meta.url));

const EMPTY_MODULE: string = fileURLToPath(
  new URL('./tests/back/support/empty-module.ts', import.meta.url),
);

const ROOT_DIR: string = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        plugins: [tailwindcss()],
        resolve: {
          alias: { '@tests': TESTS_DIR, '@': SRC_DIR },
        },
        server: {
          fs: { allow: [ROOT_DIR] },
        },
        test: {
          name: 'ui',
          include: ['tests/front/ui/**/*.test.tsx'],
          setupFiles: ['tests/front/ui/support/setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              contextOptions: { reducedMotion: 'reduce', colorScheme: 'dark' },
            }),
            instances: [{ browser: 'chromium', viewport: { width: 1280, height: 800 } }],
          },
        },
      },
      {
        resolve: {
          alias: {
            '@tests': TESTS_DIR,
            '@': SRC_DIR,
            'server-only': EMPTY_MODULE,
          },
        },
        test: {
          name: 'server',
          environment: 'node',
          include: ['tests/back/**/*.test.ts'],
          setupFiles: ['tests/back/support/setup.ts'],
          env: {
            SMTP_HOST: 'smtp.test.invalid',
            SMTP_PORT: '587',
            SMTP_USER: 'test-user',
            SMTP_PASS: 'test-pass-not-real',
            CONTACT_FROM: 'site@test.invalid',
            CONTACT_TO: 'owner@test.invalid',
            CLIENT_IP_HEADER: 'x-test-client-ip',
          },
        },
      },
    ],
  },
});
