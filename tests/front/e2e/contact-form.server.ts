import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { serverEnvFor } from '@tests/front/e2e/support/e2e-env';

import type { ChildProcess } from 'node:child_process';

const NEXT_BIN: string = join(process.cwd(), 'node_modules', '.bin', 'next');
const READY_TIMEOUT_MS = 60_000;
const READY_POLL_MS = 250;

export type ExtraServer = Readonly<{ baseURL: string; stop: () => Promise<void> }>;

const freePort = async (): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer();

    probe.once('error', reject);

    probe.listen(0, 'localhost', () => {
      const address = probe.address();
      const port: number = typeof address === 'object' && address !== null ? address.port : 0;

      probe.close(() => {
        resolve(port);
      });
    });
  });
};

const pause = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const waitUntilUp = async (baseURL: string, server: ChildProcess): Promise<void> => {
  const deadline: number = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`extra server exited with ${server.exitCode}`);
    }

    const response: Response | null = await fetch(baseURL).catch(() => {
      return null;
    });

    if (response?.ok === true) {
      return;
    }

    await pause(READY_POLL_MS);
  }

  throw new Error('extra server did not start');
};

export const startServerWith = async (
  overrides: Readonly<Record<string, string>>,
): Promise<ExtraServer> => {
  const port: number = await freePort();
  const baseURL = `http://localhost:${port}`;

  const server: ChildProcess = spawn(NEXT_BIN, ['start', '-p', String(port), '-H', 'localhost'], {
    env: {
      ...process.env,
      ...serverEnvFor(baseURL),
      ...overrides,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  await waitUntilUp(baseURL, server);

  return {
    baseURL,
    stop: async () => {
      if (server.exitCode !== null) {
        return;
      }

      await new Promise<void>((resolve) => {
        server.once('close', () => {
          resolve();
        });

        server.kill('SIGTERM');
      });
    },
  };
};
