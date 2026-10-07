import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';

import type { ChildProcess } from 'node:child_process';

const NEXT_BIN: string = join(process.cwd(), 'node_modules', '.bin', 'next');

const port: string = process.env['E2E_PORT'] ?? '';

if (port === '') {
  console.error('E2E_PORT is not set');
  process.exit(1);
}

const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
};

const build = spawnSync(NEXT_BIN, ['build'], { env, stdio: ['ignore', 'ignore', 'inherit'] });

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const server: ChildProcess = spawn(NEXT_BIN, ['start', '-p', port, '-H', 'localhost'], {
  env,
  stdio: ['ignore', 'ignore', 'inherit'],
});

const stop = (): void => {
  server.kill('SIGTERM');
};

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
process.on('SIGHUP', stop);

server.on('close', (code: number | null) => {
  process.exit(code ?? 0);
});
