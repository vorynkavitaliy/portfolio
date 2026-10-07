import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const MAIL_INFO_URL = 'http://127.0.0.1:8025/api/v1/info';

const FREE_PORT_SCRIPT =
  "const s=require('node:net').createServer();s.listen(0,'localhost',()=>{process.stdout.write(String(s.address().port));s.close();})";

const BUILD_AND_START_TIMEOUT_MS = 600_000;
const MAILPIT_TIMEOUT_MS = 120_000;
const SHUTDOWN_TIMEOUT_MS = 30_000;
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

type WebServer = Extract<
  NonNullable<PlaywrightTestConfig['webServer']>,
  readonly unknown[]
>[number];

const MAILPIT_SERVER: WebServer = {
  command: 'docker compose -f docker-compose.dev.yml up mailpit',
  url: MAIL_INFO_URL,
  timeout: MAILPIT_TIMEOUT_MS,
  reuseExistingServer: true,
  stdout: 'ignore',
  stderr: 'pipe',
  gracefulShutdown: { signal: 'SIGTERM', timeout: SHUTDOWN_TIMEOUT_MS },
};

if (process.env['E2E_PORT'] === undefined) {
  process.env['E2E_PORT'] = execFileSync(process.execPath, ['-e', FREE_PORT_SCRIPT], {
    encoding: 'utf8',
  });
}

const baseURL = `http://localhost:${process.env['E2E_PORT']}`;

export default defineConfig({
  testDir: 'tests/front/e2e',
  outputDir: join('node_modules', '.cache', 'portfolio-e2e', 'results'),
  fullyParallel: true,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    locale: 'en-US',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP },
    },
    {
      name: 'mobile-390',
      use: { ...devices['iPhone 14'], viewport: PHONE },
    },
    {
      name: 'no-webgl',
      use: {
        ...devices['Desktop Chrome'],
        viewport: DESKTOP,
        launchOptions: { args: ['--disable-gpu', '--disable-3d-apis', '--disable-webgl'] },
      },
    },
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP, reducedMotion: 'reduce' },
    },
  ],
  webServer: [
    ...(process.env['CI'] === undefined ? [MAILPIT_SERVER] : []),
    {
      command: 'node --import tsx tests/front/e2e/support/serve.ts',
      url: baseURL,
      timeout: BUILD_AND_START_TIMEOUT_MS,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
      gracefulShutdown: { signal: 'SIGTERM', timeout: SHUTDOWN_TIMEOUT_MS },
    },
  ],
});
