import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { cpus, platform, release } from 'node:os';
import { join, resolve } from 'node:path';

import { chromium } from 'playwright';
import { z } from 'zod';

import { serverEnvFor } from '@tests/front/e2e/support/e2e-env';

import type { ChildProcess } from 'node:child_process';
import type { Browser, BrowserContext, Page } from 'playwright';

type PassId = 'laptop' | 'cpu4x' | 'phone';

type Network = Readonly<{
  title: string;
  latency: number;
  downloadThroughput: number;
  uploadThroughput: number;
}>;

type Limits = Readonly<{
  readyMs: number | null;
  generationMs: number | null;
  longTaskMs: number | null;
  medianFps: number | null;
  p95FrameMs: number | null;
  drawCalls: number | null;
  triangles: number | null;
}>;

type Pass = Readonly<{
  id: PassId;
  title: string;
  viewport: Readonly<{ width: number; height: number }>;
  deviceScaleFactor: number;
  isMobile: boolean;
  cpuRate: number;
  network: Network | null;
  limits: Limits;
}>;

type Check = {
  pass: PassId;
  metric: string;
  measured: number | null;
  limit: number;
  direction: 'max' | 'min';
  unit: string;
  status: 'pass' | 'breach' | 'not-measured';
};

type RequestLog = {
  url: string;
  type: string;
};

type PassResult = {
  pass: Pass;
  gpu: string;
  load: z.infer<typeof loadSchema>;
  flight: z.infer<typeof flightSchema>;
  requests: RequestLog[];
  workerUrls: string[];
  docked: boolean;
};

const ROOT: string = process.cwd();
const NEXT_DIR: string = resolve(ROOT, '.next');
const OUTPUT_DIR: string = resolve(ROOT, '.regression');
const REPORT_FILE: string = join(OUTPUT_DIR, 'perf.md');
const CHUNKS_FILE: string = join(OUTPUT_DIR, 'perf-chunks.json');
const LOCK_DIR: string = resolve(ROOT, '.e2e.lock.d');
const NEXT_BIN: string = join(ROOT, 'node_modules', '.bin', 'next');
const LOCK_POLL_MS = 5_000;
const SERVER_READY_MS = 60_000;
const READY_TIMEOUT_MS = 120_000;
const READY_POLL_MS = 200;
const DOCK_TIMEOUT_MS = 15_000;
const SETTLE_MS = 1_500;
const LOAD_TAIL_MS = 500;
const KBPS = 1024 / 8;

const FLIGHT_PLAN: readonly (readonly [string, number])[] = [
  ['w', 2_500],
  ['d', 3_000],
  ['w', 2_000],
  ['a', 3_500],
  ['Shift+w', 2_000],
  ['d', 2_500],
  ['s', 1_500],
  ['a', 3_000],
];

const FAST_4G: Network = {
  title: 'Fast 4G (165 ms RTT, 8.1 Mbps down)',
  latency: 165,
  downloadThroughput: 9 * 1000 * 0.9 * KBPS,
  uploadThroughput: 1.5 * 1000 * 0.9 * KBPS,
};

const SLOW_4G: Network = {
  title: 'Lighthouse slow 4G (562.5 ms RTT, 1.47 Mbps down)',
  latency: 562.5,
  downloadThroughput: 1.6 * 1024 * 0.9 * KBPS,
  uploadThroughput: 750 * 0.9 * KBPS,
};

const PASSES: readonly Pass[] = [
  {
    id: 'laptop',
    title: 'Reference laptop · 1920×1080 · DPR 1 · no throttling',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    cpuRate: 1,
    network: null,
    limits: {
      readyMs: null,
      generationMs: 150,
      longTaskMs: 50,
      medianFps: 55,
      p95FrameMs: 50,
      drawCalls: 60,
      triangles: 150_000,
    },
  },
  {
    id: 'cpu4x',
    title: 'Laptop · 1920×1080 · DPR 1 · 4× CPU · Fast 4G',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    cpuRate: 4,
    network: FAST_4G,
    limits: {
      readyMs: 3_000,
      generationMs: null,
      longTaskMs: null,
      medianFps: null,
      p95FrameMs: null,
      drawCalls: 60,
      triangles: 150_000,
    },
  },
  {
    id: 'phone',
    title: 'Phone class · 390×844 · DPR 3 · touch · 4× CPU · slow 4G',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    cpuRate: 4,
    network: SLOW_4G,
    limits: {
      readyMs: 6_000,
      generationMs: 800,
      longTaskMs: null,
      medianFps: 30,
      p95FrameMs: 50,
      drawCalls: 40,
      triangles: 110_000,
    },
  },
];

const PROBE_SCRIPT = `(() => {
  const probe = {
    longTasks: [], loafs: [], takeOffAt: null, sampling: false,
    frames: [], calls: [], triangles: [], glCalls: [], glTriangles: [], rendererSeen: false,
  };
  Object.defineProperty(window, '__perfProbe', { value: probe });
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        probe.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        probe.loafs.push({
          start: entry.startTime,
          duration: entry.duration,
          scripts: (entry.scripts || []).map((script) => {
            return {
              invoker: String(script.invokerType),
              name: String(script.invoker).slice(0, 80),
              source: String(script.sourceURL).split('/').pop() || '',
              duration: script.duration,
            };
          }),
        });
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch {}
  let renderer = null;
  const hook = new EventTarget();
  hook.addEventListener('observe', (event) => {
    const detail = event.detail;
    if (detail && detail.isWebGLRenderer === true && detail.info) {
      renderer = detail;
      renderer.info.autoReset = false;
      probe.rendererSeen = true;
    }
  });
  Object.defineProperty(window, '__THREE_DEVTOOLS__', { value: hook, configurable: true });
  let glCalls = 0;
  let glTriangles = 0;
  const primitives = (mode, count, instances) => {
    if (mode === 4) { return Math.floor(count / 3) * instances; }
    if (mode === 5 || mode === 6) { return Math.max(0, count - 2) * instances; }
    return 0;
  };
  const proto = WebGL2RenderingContext.prototype;
  const wrap = (name, countAt, instancesAt) => {
    const original = proto[name];
    if (typeof original !== 'function') { return; }
    proto[name] = function (...args) {
      glCalls += 1;
      glTriangles += primitives(args[0], args[countAt], instancesAt === null ? 1 : args[instancesAt]);
      return original.apply(this, args);
    };
  };
  wrap('drawArrays', 2, null);
  wrap('drawElements', 1, null);
  wrap('drawRangeElements', 3, null);
  wrap('drawArraysInstanced', 2, 3);
  wrap('drawElementsInstanced', 1, 4);
  let last = null;
  const tick = (now) => {
    if (probe.sampling) {
      if (last !== null) { probe.frames.push(now - last); }
      probe.glCalls.push(glCalls);
      probe.glTriangles.push(glTriangles);
      if (renderer !== null) {
        probe.calls.push(renderer.info.render.calls);
        probe.triangles.push(renderer.info.render.triangles);
      }
    }
    glCalls = 0;
    glTriangles = 0;
    if (renderer !== null) { renderer.info.reset(); }
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const takeOffEnabled = () => {
    const loader = document.querySelector('[data-loader]');
    if (loader === null) { return false; }
    for (const button of loader.querySelectorAll('button')) {
      const name = (button.getAttribute('aria-label') || button.textContent || '').trim();
      if (/take off/i.test(name) && !button.disabled && button.getAttribute('aria-disabled') !== 'true') {
        return true;
      }
    }
    return false;
  };
  const watch = () => {
    const observer = new MutationObserver(() => {
      if (probe.takeOffAt === null && takeOffEnabled()) {
        probe.takeOffAt = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch, { once: true });
  } else {
    watch();
  }
})();`;

const LOAD_EXPRESSION = `(() => {
  const probe = window.__perfProbe;
  const marks = performance.getEntriesByType('mark').map((mark) => {
    const detail = mark.detail;
    return {
      name: mark.name,
      start: mark.startTime,
      ms: detail !== null && typeof detail === 'object' && typeof detail.ms === 'number' ? detail.ms : null,
    };
  });
  const resources = performance.getEntriesByType('resource').map((entry) => {
    return { url: entry.name, start: entry.startTime, end: entry.responseEnd, type: entry.initiatorType };
  });
  const navigation = performance.getEntriesByType('navigation')[0];
  return {
    marks,
    resources,
    takeOffAt: probe.takeOffAt,
    longTasks: probe.longTasks,
    loafs: probe.loafs,
    rendererSeen: probe.rendererSeen,
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd : null,
    loadEvent: navigation ? navigation.loadEventEnd : null,
  };
})()`;

const FLIGHT_EXPRESSION = `(() => {
  const probe = window.__perfProbe;
  probe.sampling = false;
  const debug = window.__worldDebug;
  return {
    frames: probe.frames,
    calls: probe.calls,
    triangles: probe.triangles,
    glCalls: probe.glCalls,
    glTriangles: probe.glTriangles,
    debug: debug && typeof debug.snapshot === 'function' ? JSON.stringify(debug.snapshot()) : null,
    firstFrame: performance.getEntriesByName('world:first-frame')[0]?.startTime ?? null,
    pageScripts: performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /\.js($|[?#])/.test(name)),
  };
})()`;

const GPU_EXPRESSION = `(() => {
  const context = document.createElement('canvas').getContext('webgl2');
  if (context === null) { return 'no WebGL2'; }
  const extension = context.getExtension('WEBGL_debug_renderer_info');
  const name = extension === null ? context.getParameter(context.RENDERER) : context.getParameter(extension.UNMASKED_RENDERER_WEBGL);
  context.getExtension('WEBGL_lose_context')?.loseContext();
  return String(name);
})()`;

const loadSchema = z.object({
  marks: z.array(z.object({ name: z.string(), start: z.number(), ms: z.number().nullable() })),
  resources: z.array(
    z.object({ url: z.string(), start: z.number(), end: z.number(), type: z.string() }),
  ),
  takeOffAt: z.number().nullable(),
  longTasks: z.array(z.object({ start: z.number(), duration: z.number() })),
  loafs: z.array(
    z.object({
      start: z.number(),
      duration: z.number(),
      scripts: z.array(
        z.object({
          invoker: z.string(),
          name: z.string(),
          source: z.string(),
          duration: z.number(),
        }),
      ),
    }),
  ),
  rendererSeen: z.boolean(),
  domContentLoaded: z.number().nullable(),
  loadEvent: z.number().nullable(),
});

const flightSchema = z.object({
  frames: z.array(z.number()),
  calls: z.array(z.number()),
  triangles: z.array(z.number()),
  glCalls: z.array(z.number()),
  glTriangles: z.array(z.number()),
  debug: z.string().nullable(),
  firstFrame: z.number().nullable(),
  pageScripts: z.array(z.string()),
});

const statsSchema = z.array(
  z.object({ route: z.string(), firstLoadChunkPaths: z.array(z.string()) }),
);

const sleep = (ms: number): Promise<void> => {
  return new Promise((done) => {
    setTimeout(done, ms);
  });
};

let lockHeld = false;

const acquireLock = async (): Promise<void> => {
  for (;;) {
    try {
      mkdirSync(LOCK_DIR);
      lockHeld = true;

      return;
    } catch {
      console.log(`perf:world: waiting for ${LOCK_DIR}`);
      await sleep(LOCK_POLL_MS);
    }
  }
};

const releaseLock = (): void => {
  if (!lockHeld) {
    return;
  }

  lockHeld = false;

  try {
    rmdirSync(LOCK_DIR);
  } catch {
    console.error('perf:world: lock already released');
  }
};

const freePort = (): Promise<number> => {
  return new Promise((done, reject) => {
    const server = createServer();

    server.once('error', reject);

    server.listen(0, 'localhost', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;

      server.close(() => {
        done(port);
      });
    });
  });
};

const startServer = async (port: number): Promise<ChildProcess> => {
  const base = `http://localhost:${port}`;

  const server = spawn(NEXT_BIN, ['start', '-p', String(port), '-H', 'localhost'], {
    env: {
      ...process.env,
      ...serverEnvFor(base),
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  const deadline = Date.now() + SERVER_READY_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(base);

      if (response.ok) {
        return server;
      }
    } catch {
      await sleep(250);
    }
  }

  server.kill('SIGTERM');
  throw new Error(`next start did not answer on ${base} within ${SERVER_READY_MS} ms`);
};

const sorted = (values: readonly number[]): number[] => {
  return [...values].sort((left, right) => {
    return left - right;
  });
};

const percentile = (values: readonly number[], q: number): number | null => {
  const list = sorted(values);

  if (list.length === 0) {
    return null;
  }

  const index = Math.min(list.length - 1, Math.max(0, Math.ceil(q * list.length) - 1));

  return list[index] ?? null;
};

const maxOf = (values: readonly number[]): number | null => {
  return values.length === 0 ? null : Math.max(...values);
};

const round = (value: number | null, digits = 0): string => {
  if (value === null) {
    return '—';
  }

  return value.toFixed(digits);
};

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname.replace(/^\/_next\//, '');
  } catch {
    return url;
  }
};

const firstLoadPaths = (): Set<string> => {
  const stats = statsSchema.parse(
    JSON.parse(readFileSync(join(NEXT_DIR, 'diagnostics', 'route-bundle-stats.json'), 'utf8')),
  );

  const route = stats.find((entry) => {
    return entry.route === '/';
  });

  return new Set(
    (route?.firstLoadChunkPaths ?? []).map((path) => {
      return path.replace(/^\.next\//, '');
    }),
  );
};

const workerChunks = (workerUrls: readonly string[]): string[] => {
  const chunks: string[] = [];

  for (const url of workerUrls) {
    chunks.push(pathOf(url));

    const hash = new URL(url).hash;
    const raw = hash.startsWith('#params=') ? decodeURIComponent(hash.slice(8)) : null;
    const params: unknown = raw === null ? null : JSON.parse(raw);
    const list: unknown = Array.isArray(params) ? params[0] : null;

    if (Array.isArray(list)) {
      for (const item of list) {
        if (typeof item === 'string') {
          chunks.push(pathOf(new URL(item, url).href));
        }
      }
    }
  }

  return [...new Set(chunks)];
};

const configure = async (context: BrowserContext, page: Page, pass: Pass): Promise<void> => {
  const session = await context.newCDPSession(page);

  if (pass.cpuRate > 1) {
    await session.send('Emulation.setCPUThrottlingRate', { rate: pass.cpuRate });
  }

  if (pass.network !== null) {
    await session.send('Network.enable');

    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: pass.network.latency,
      downloadThroughput: pass.network.downloadThroughput,
      uploadThroughput: pass.network.uploadThroughput,
    });
  }
};

const fly = async (page: Page): Promise<void> => {
  await page.keyboard.press('Space');

  for (const [key, ms] of FLIGHT_PLAN) {
    const keys = key.split('+');

    for (const part of keys) {
      await page.keyboard.down(part);
    }

    await page.waitForTimeout(ms);

    for (const part of [...keys].reverse()) {
      await page.keyboard.up(part);
    }
  }
};

const waitForTakeOff = async (page: Page): Promise<void> => {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if ((await page.evaluate('window.__perfProbe.takeOffAt !== null')) === true) {
      return;
    }

    await sleep(READY_POLL_MS);
  }

  throw new Error(`«Take off» was not enabled within ${READY_TIMEOUT_MS} ms`);
};

const runPass = async (browser: Browser, base: string, pass: Pass): Promise<PassResult> => {
  const context = await browser.newContext({
    viewport: pass.viewport,
    deviceScaleFactor: pass.deviceScaleFactor,
    isMobile: pass.isMobile,
    hasTouch: pass.isMobile,
    locale: 'en-US',
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  });

  const requests: RequestLog[] = [];
  const workerUrls: string[] = [];

  context.on('request', (request) => {
    requests.push({ url: request.url(), type: request.resourceType() });
  });

  try {
    await context.addInitScript({ content: PROBE_SCRIPT });

    const page = await context.newPage();

    page.on('worker', (worker) => {
      workerUrls.push(worker.url());
    });

    const gpu = String(await page.evaluate(GPU_EXPRESSION));

    await configure(context, page, pass);
    await page.goto(base, { waitUntil: 'load' });

    await waitForTakeOff(page);

    await page.waitForTimeout(SETTLE_MS);

    const load = loadSchema.parse(await page.evaluate(LOAD_EXPRESSION));

    await page
      .locator('[data-loader]')
      .getByRole('button', { name: /take off/i })
      .click();

    const docked = await page
      .locator('section[data-station="home-base"][data-docked]')
      .waitFor({ state: 'attached', timeout: DOCK_TIMEOUT_MS })
      .then(
        () => {
          return true;
        },
        () => {
          return false;
        },
      );

    await page.evaluate('window.__perfProbe.frames.length = 0; window.__perfProbe.sampling = true');
    await fly(page);

    const flight = flightSchema.parse(await page.evaluate(FLIGHT_EXPRESSION));

    return { pass, gpu, load, flight, requests, workerUrls, docked };
  } finally {
    await context.close();
  }
};

const markAt = (result: PassResult, name: string): number | null => {
  return (
    result.load.marks.find((mark) => {
      return mark.name === name;
    })?.start ?? null
  );
};

const generationMs = (result: PassResult): number | null => {
  return (
    result.load.marks.find((mark) => {
      return mark.name === 'world:generated';
    })?.ms ?? null
  );
};

const worldStartAt = (result: PassResult, firstLoad: ReadonlySet<string>): number | null => {
  const explicit = markAt(result, 'world:start');

  if (explicit !== null) {
    return explicit;
  }

  const lazy = result.load.resources.filter((entry) => {
    const path = pathOf(entry.url);

    return path.startsWith('static/chunks/') && path.endsWith('.js') && !firstLoad.has(path);
  });

  return lazy.length === 0
    ? null
    : Math.min(
        ...lazy.map((entry) => {
          return entry.start;
        }),
      );
};

const loadWindowEnd = (result: PassResult): number => {
  return (markAt(result, 'world:ready') ?? result.load.takeOffAt ?? 0) + LOAD_TAIL_MS;
};

const scriptDurations = (result: PassResult, evaluation: boolean): number[] => {
  const end = loadWindowEnd(result);
  const durations: number[] = [];

  for (const frame of result.load.loafs) {
    if (frame.start > end) {
      continue;
    }

    for (const script of frame.scripts) {
      const isEvaluation =
        script.invoker === 'classic-script' || script.invoker === 'module-script';

      if (isEvaluation === evaluation) {
        durations.push(script.duration);
      }
    }
  }

  return durations;
};

const slowestLoadScripts = (result: PassResult): string[] => {
  const end = loadWindowEnd(result);

  return result.load.loafs
    .filter((frame) => {
      return frame.start <= end;
    })
    .flatMap((frame) => {
      return frame.scripts.map((script) => {
        return { ...script, at: frame.start };
      });
    })
    .sort((left, right) => {
      return right.duration - left.duration;
    })
    .slice(0, 5)
    .map((script) => {
      return `| ${result.pass.id} | ${script.at.toFixed(0)} | ${script.duration.toFixed(1)} | ${script.invoker} | \`${script.name}\` | ${script.source} |`;
    });
};

const longTasksInLoad = (result: PassResult): number[] => {
  const end = loadWindowEnd(result);

  return result.load.longTasks
    .filter((task) => {
      return task.start <= end;
    })
    .map((task) => {
      return task.duration;
    });
};

const nonZero = (values: readonly number[]): number[] => {
  return values.filter((value) => {
    return value > 0;
  });
};

type Metrics = {
  readyFromStart: number | null;
  readyFromNavigation: number | null;
  worldStart: number | null;
  generated: number | null;
  ready: number | null;
  firstFrame: number | null;
  generation: number | null;
  longTaskMax: number | null;
  longTaskCount: number;
  workScriptMax: number | null;
  evalScriptMax: number | null;
  frames: number;
  p50Frame: number | null;
  p95Frame: number | null;
  p99Frame: number | null;
  medianFps: number | null;
  callsP50: number | null;
  callsMax: number | null;
  trianglesP50: number | null;
  trianglesMax: number | null;
  glCallsMax: number | null;
  glTrianglesMax: number | null;
};

const metricsOf = (result: PassResult, firstLoad: ReadonlySet<string>): Metrics => {
  const worldStart = worldStartAt(result, firstLoad);
  const takeOffAt = result.load.takeOffAt;
  const p50Frame = percentile(result.flight.frames, 0.5);
  const calls = nonZero(result.flight.calls);
  const triangles = nonZero(result.flight.triangles);
  const longTasks = longTasksInLoad(result);

  return {
    readyFromStart: worldStart !== null && takeOffAt !== null ? takeOffAt - worldStart : null,
    readyFromNavigation: takeOffAt,
    worldStart,
    generated: markAt(result, 'world:generated'),
    ready: markAt(result, 'world:ready'),
    firstFrame: result.flight.firstFrame,
    generation: generationMs(result),
    longTaskMax: maxOf(longTasks),
    longTaskCount: longTasks.length,
    workScriptMax: maxOf(scriptDurations(result, false)),
    evalScriptMax: maxOf(scriptDurations(result, true)),
    frames: result.flight.frames.length,
    p50Frame,
    p95Frame: percentile(result.flight.frames, 0.95),
    p99Frame: percentile(result.flight.frames, 0.99),
    medianFps: p50Frame === null || p50Frame === 0 ? null : 1000 / p50Frame,
    callsP50: percentile(calls, 0.5),
    callsMax: maxOf(calls),
    trianglesP50: percentile(triangles, 0.5),
    trianglesMax: maxOf(triangles),
    glCallsMax: maxOf(nonZero(result.flight.glCalls)),
    glTrianglesMax: maxOf(nonZero(result.flight.glTriangles)),
  };
};

const checksOf = (pass: Pass, metrics: Metrics): Check[] => {
  const checks: Check[] = [];
  const { limits } = pass;

  const add = (
    metric: string,
    measured: number | null,
    limit: number | null,
    direction: 'max' | 'min',
    unit: string,
  ): void => {
    if (limit === null) {
      return;
    }

    const breached =
      measured !== null && (direction === 'max' ? measured > limit : measured < limit);

    checks.push({
      pass: pass.id,
      metric,
      measured,
      limit,
      direction,
      unit,
      status: measured === null ? 'not-measured' : breached ? 'breach' : 'pass',
    });
  };

  add('world start → «Take off» enabled', metrics.readyFromStart, limits.readyMs, 'max', 'ms');
  add('generation (worker)', metrics.generation, limits.generationMs, 'max', 'ms');

  add(
    'longest load task outside chunk evaluation',
    metrics.workScriptMax,
    limits.longTaskMs,
    'max',
    'ms',
  );

  add('median fps in flight', metrics.medianFps, limits.medianFps, 'min', 'fps');
  add('p95 frame time in flight', metrics.p95Frame, limits.p95FrameMs, 'max', 'ms');
  add('draw calls per frame (max)', metrics.callsMax, limits.drawCalls, 'max', '');
  add('triangles per frame (max)', metrics.trianglesMax, limits.triangles, 'max', '');

  return checks;
};

const PHONE_PROBE = `(async () => {
  const marks = Object.fromEntries(
    performance.getEntriesByType('mark')
      .filter((mark) => mark.name.startsWith('world:'))
      .map((mark) => [mark.name, Math.round(mark.startTime)]),
  );
  const generated = performance.getEntriesByName('world:generated')[0];
  const scripts = performance.getEntriesByType('resource').filter((entry) => entry.name.endsWith('.js'));
  const bytes = scripts.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0);
  const frames = [];
  let last = performance.now();
  const end = last + 20000;
  await new Promise((done) => {
    const tick = (now) => {
      frames.push(now - last);
      last = now;
      if (now < end) { requestAnimationFrame(tick); } else { done(); }
    };
    requestAnimationFrame(tick);
  });
  frames.sort((a, b) => a - b);
  const pick = (q) => frames[Math.min(frames.length - 1, Math.ceil(q * frames.length) - 1)];
  const debug = window.__worldDebug && window.__worldDebug.snapshot ? window.__worldDebug.snapshot() : null;
  console.table({
    ...marks,
    generationMs: generated && generated.detail ? Math.round(generated.detail.ms) : null,
    scriptKB: Math.round(bytes / 100) / 10,
    frames: frames.length,
    medianFps: Math.round(1000 / pick(0.5)),
    p95FrameMs: Math.round(pick(0.95)),
    dpr: devicePixelRatio,
    viewport: innerWidth + 'x' + innerHeight,
    drawCalls: debug ? debug.calls : 'debug build only',
    triangles: debug ? debug.triangles : 'debug build only',
  });
})();`;

const reportOf = (
  buildId: string,
  browserVersion: string,
  results: readonly PassResult[],
  firstLoad: ReadonlySet<string>,
): { markdown: string; breaches: Check[] } => {
  const metrics = results.map((result) => {
    return metricsOf(result, firstLoad);
  });

  const checks = results.flatMap((result, index) => {
    const measured = metrics[index];

    return measured === undefined ? [] : checksOf(result.pass, measured);
  });

  const breaches = checks.filter((check) => {
    return check.status === 'breach';
  });

  const header = `| Metric | ${results
    .map((result) => {
      return result.pass.id;
    })
    .join(' | ')} |`;

  const divider = `|---|${results
    .map(() => {
      return '---';
    })
    .join('|')}|`;

  const row = (label: string, pick: (entry: Metrics) => string): string => {
    return `| ${label} | ${metrics.map(pick).join(' | ')} |`;
  };

  const lines: string[] = [
    `# World performance · build ${buildId}`,
    '',
    `- Date: ${new Date().toISOString()}`,
    `- Machine: ${cpus()[0]?.model ?? 'unknown CPU'} · ${platform()} ${release()}`,
    `- Browser: Playwright Chromium ${browserVersion}, headless, \`--mute-audio\`, GPU: ${results[0]?.gpu ?? 'unknown'}`,
    '- Server: `next start` on the production build in `.next/`',
    '- Times are ms from navigation start unless noted; «world start» = first lazy chunk request (no `world:start` mark in the product).',
    '',
    '## Passes',
    '',
    ...results.map((result) => {
      return `- **${result.pass.id}** — ${result.pass.title}${result.pass.network === null ? '' : ` · ${result.pass.network.title}`}`;
    }),
    '',
    '## Summary',
    '',
    header,
    divider,
    row('world start (first lazy chunk request)', (entry) => {
      return round(entry.worldStart);
    }),
    row('world:generated mark', (entry) => {
      return round(entry.generated);
    }),
    row('generation in worker (ms)', (entry) => {
      return round(entry.generation, 1);
    }),
    row('world:ready mark', (entry) => {
      return round(entry.ready);
    }),
    row('«Take off» enabled (from navigation)', (entry) => {
      return round(entry.readyFromNavigation);
    }),
    row('**world start → «Take off» enabled**', (entry) => {
      return round(entry.readyFromStart);
    }),
    row('world:first-frame mark', (entry) => {
      return round(entry.firstFrame);
    }),
    row('long tasks during load (count / max ms)', (entry) => {
      return `${entry.longTaskCount} / ${round(entry.longTaskMax)}`;
    }),
    row('longest script outside chunk evaluation (LoAF, ms)', (entry) => {
      return round(entry.workScriptMax);
    }),
    row('longest chunk evaluation (LoAF, ms)', (entry) => {
      return round(entry.evalScriptMax);
    }),
    row('frames sampled in 20 s flight', (entry) => {
      return String(entry.frames);
    }),
    row('frame time p50 / p95 / p99 (ms)', (entry) => {
      return `${round(entry.p50Frame, 1)} / ${round(entry.p95Frame, 1)} / ${round(entry.p99Frame, 1)}`;
    }),
    row('median fps', (entry) => {
      return round(entry.medianFps, 1);
    }),
    row('draw calls p50 / max (renderer.info, per frame)', (entry) => {
      return `${round(entry.callsP50)} / ${round(entry.callsMax)}`;
    }),
    row('triangles p50 / max (renderer.info, per frame)', (entry) => {
      return `${round(entry.trianglesP50)} / ${round(entry.trianglesMax)}`;
    }),
    row('GL draw calls / triangles max (WebGL hook)', (entry) => {
      return `${round(entry.glCallsMax)} / ${round(entry.glTrianglesMax)}`;
    }),
    `| Home docked after «Take off» | ${results
      .map((result) => {
        return result.docked ? 'yes' : 'no';
      })
      .join(' | ')} |`,
    `| renderer captured | ${results
      .map((result) => {
        return result.load.rendererSeen ? 'yes' : 'no';
      })
      .join(' | ')} |`,
    `| debug hook snapshot | ${results
      .map((result) => {
        return result.flight.debug ?? 'off (prod build)';
      })
      .join(' | ')} |`,
    '',
    '## Budget checks (scene-3d rules §3, plan §8)',
    '',
    '| Pass | Check | Measured | Budget | Status |',
    '|---|---|---|---|---|',
    ...checks.map((check) => {
      const sign = check.direction === 'max' ? '≤' : '≥';

      return `| ${check.pass} | ${check.metric} | ${round(check.measured, 1)} ${check.unit} | ${sign} ${check.limit} ${check.unit} | ${check.status} |`;
    }),
    '',
    breaches.length === 0
      ? '**No breach.**'
      : `**${breaches.length} breach(es):** ${breaches
          .map((check) => {
            return `${check.pass} ${check.metric}`;
          })
          .join('; ')}`,
    '',
    '## Slowest scripts during load (Long Animation Frame attribution)',
    '',
    '| Pass | At (ms) | Duration (ms) | Invoker type | Invoker | Source |',
    '|---|---|---|---|---|---|',
    ...results.flatMap(slowestLoadScripts),
    '',
    '## Requests (laptop pass)',
    '',
  ];

  const laptop = results[0];

  if (laptop !== undefined) {
    const scripts = laptop.flight.pageScripts.map(pathOf);

    const fonts = laptop.requests.filter((request) => {
      return request.type === 'font';
    });

    lines.push(
      `- Page scripts: ${scripts.length} (${
        scripts.filter((path) => {
          return !firstLoad.has(path);
        }).length
      } outside first load): ${scripts.join(', ')}`,
      `- Worker scripts: ${workerChunks(laptop.workerUrls).join(', ') || 'none'}`,
      `- Fonts fetched: ${
        fonts
          .map((request) => {
            return pathOf(request.url);
          })
          .join(', ') || 'none'
      }`,
      '',
    );
  }

  lines.push(
    '## Method',
    '',
    '- Probe installed by an init script: `__THREE_DEVTOOLS__` captures the `WebGLRenderer`, sets `info.autoReset = false` and resets it once per rAF, so calls/triangles are per-frame totals including bloom passes; a WebGL2 prototype hook counts draw calls independently.',
    '- Frame times are rAF deltas during a scripted 20 s keyboard flight after Home docks (Space, then W/D/W/A/Shift+W/D/S/A holds).',
    '- Long tasks: `longtask` observer up to `world:ready` + 500 ms; chunk evaluation is split from the rest with Long Animation Frame script attribution (`classic-script` / `module-script`).',
    '- CPU throttle: CDP `Emulation.setCPUThrottlingRate`; network: CDP `Network.emulateNetworkConditions`. CPU throttling applies to the page target; the worker may run unthrottled, so generation under 4× is optimistic.',
    '- Headless Chromium paces rAF itself; fps here is a lower bound on frame cost, not a display-synchronised measurement.',
    '',
    '## Phone probe (owner, real device)',
    '',
    'Open the site on the phone, connect it to the Mac (Safari → Develop → <phone> → the page; Android: chrome://inspect), wait for «Take off», press it, then paste this into the console and fly for 20 s:',
    '',
    '```js',
    PHONE_PROBE,
    '```',
    '',
  );

  return { markdown: lines.join('\n'), breaches };
};

const writeChunks = (
  buildId: string,
  result: PassResult | undefined,
  firstLoad: ReadonlySet<string>,
): void => {
  if (result === undefined) {
    return;
  }

  const pageLazy = result.flight.pageScripts
    .map((url) => {
      return pathOf(url);
    })
    .filter((path) => {
      return path.startsWith('static/chunks/') && path.endsWith('.js') && !firstLoad.has(path);
    });

  const assets = result.requests
    .map((request) => {
      return pathOf(request.url);
    })
    .filter((path) => {
      return /\.(glb|gltf|bin|ktx2|basis|drc|png|jpe?g|webp|avif|mp3|ogg|wav|m4a)$/i.test(path);
    })
    .filter((path) => {
      return !path.startsWith('/icon') && !path.startsWith('/apple-icon');
    });

  writeFileSync(
    CHUNKS_FILE,
    `${JSON.stringify(
      {
        buildId,
        pass: result.pass.id,
        pageLazy: [...new Set(pageLazy)],
        worker: workerChunks(result.workerUrls),
        fonts: [
          ...new Set(
            result.requests
              .filter((request) => {
                return request.type === 'font';
              })
              .map((request) => {
                return pathOf(request.url);
              }),
          ),
        ],
        assets: [...new Set(assets)],
      },
      null,
      2,
    )}\n`,
  );
};

const selectedPasses = (): Pass[] => {
  const flag = process.argv.find((arg) => {
    return arg.startsWith('--pass=');
  });

  if (flag === undefined) {
    return [...PASSES];
  }

  const wanted = new Set(flag.slice('--pass='.length).split(','));

  return PASSES.filter((pass) => {
    return wanted.has(pass.id);
  });
};

const launchArgs = (): string[] => {
  const args = ['--mute-audio', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'];

  return platform() === 'darwin' ? [...args, '--use-angle=metal'] : [...args, '--use-angle=gl'];
};

const main = async (): Promise<number> => {
  const buildIdFile = join(NEXT_DIR, 'BUILD_ID');

  if (!existsSync(buildIdFile)) {
    console.error('perf:world: .next/BUILD_ID is missing — run `npx next build` first');

    return 2;
  }

  const passes = selectedPasses();
  let server: ChildProcess | null = null;
  let browser: Browser | null = null;

  const cleanUp = (): void => {
    server?.kill('SIGTERM');
    releaseLock();
  };

  const onSignal = (): void => {
    cleanUp();
    process.exit(130);
  };

  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  await acquireLock();

  try {
    const buildId = readFileSync(buildIdFile, 'utf8').trim();
    const firstLoad = firstLoadPaths();
    const port = await freePort();
    const base = `http://localhost:${port}`;

    server = await startServer(port);
    browser = await chromium.launch({ headless: true, args: launchArgs() });

    const results: PassResult[] = [];

    for (const pass of passes) {
      console.log(`perf:world: ${pass.id} — ${pass.title}`);
      results.push(await runPass(browser, base, pass));
    }

    const { markdown, breaches } = reportOf(buildId, browser.version(), results, firstLoad);

    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(REPORT_FILE, markdown);

    writeChunks(
      buildId,
      results.find((result) => {
        return result.pass.id === 'laptop';
      }),
      firstLoad,
    );

    console.log(`perf:world: wrote ${REPORT_FILE}`);

    console.log(
      breaches.length === 0
        ? 'perf:world: no breach'
        : `perf:world: ${breaches.length} breach(es): ${breaches
            .map((check) => {
              return `${check.pass} ${check.metric} = ${round(check.measured, 1)} (${check.direction} ${check.limit})`;
            })
            .join('; ')}`,
    );

    return breaches.length === 0 ? 0 : 1;
  } finally {
    await browser?.close();
    cleanUp();
  }
};

main().then(
  (code) => {
    process.exit(code);
  },
  (error: unknown) => {
    console.error('perf:world:', error instanceof Error ? error.message : error);
    process.exit(2);
  },
);
