import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

import { z } from 'zod';

type Status = 'pass' | 'breach' | 'over-target' | 'info' | 'not-measured';

type Row = {
  item: string;
  measured: string;
  budget: string;
  status: Status;
  note: string;
};

type ChunkSize = {
  path: string;
  raw: number;
  gzip: number;
  brotli: number;
  markers: string[];
};

type FontFace = {
  family: string;
  file: string;
  display: string;
  latin: boolean;
};

const ROOT: string = process.cwd();
const NEXT_DIR: string = resolve(ROOT, '.next');
const STATIC_DIR: string = join(NEXT_DIR, 'static');
const CHUNKS_DIR: string = join(STATIC_DIR, 'chunks');
const MEDIA_DIR: string = join(STATIC_DIR, 'media');
const BUILD_ID_FILE: string = join(NEXT_DIR, 'BUILD_ID');
const STATS_FILE: string = join(NEXT_DIR, 'diagnostics', 'route-bundle-stats.json');
const BUILD_MANIFEST_FILE: string = join(NEXT_DIR, 'build-manifest.json');
const RUNTIME_FILE: string = resolve(ROOT, '.regression', 'perf-chunks.json');
const ROUTE = '/';
const KB = 1000;

const BUDGET = {
  firstLoadBrotli: 130 * KB,
  threeCap: 250 * KB,
  threeTarget: 200 * KB,
  gsap: 45 * KB,
  hud: 15 * KB,
  worker: 15 * KB,
  fontFamilies: 2,
  fontFiles: 2,
} as const;

const MARKERS: readonly (readonly [string, RegExp])[] = [
  ['three', /THREE\.WebGLRenderer|"srgb-linear"/],
  ['gsap', /GreenSock|ScrollTrigger/],
  ['zod', /ZodError|\b_zod\b/],
  ['react', /__reactContainer|react-dom|__reactFiber/],
];

const ASSET_FILE = /\.(glb|gltf|bin|ktx2|basis|drc|png|jpe?g|webp|avif|mp3|ogg|wav|m4a)$/i;
const WORKER_GROUP = /\.f\("(static\/chunks\/turbopack-worker-[^"]+\.js)",\[([^\]]*)\]\)/g;
const QUOTED = /"([^"]+)"/g;
const FONT_FACE = /@font-face\{([^}]*)\}/g;
const LATIN_PROBE = 0x41;

const statsSchema = z.array(
  z.object({
    route: z.string(),
    firstLoadChunkPaths: z.array(z.string()),
  }),
);

const manifestSchema = z.object({
  polyfillFiles: z.array(z.string()),
});

const runtimeSchema = z.object({
  buildId: z.string(),
  pass: z.string(),
  pageLazy: z.array(z.string()),
  worker: z.array(z.string()),
  fonts: z.array(z.string()),
  assets: z.array(z.string()),
});

type Runtime = z.infer<typeof runtimeSchema>;

const fail = (message: string): never => {
  console.error(`budget: ${message}`);
  process.exit(2);
};

const readJson = (file: string): unknown => {
  if (!existsSync(file)) {
    return fail(`${file} is missing — run \`npx next build\` first`);
  }

  return JSON.parse(readFileSync(file, 'utf8'));
};

const kb = (bytes: number): string => {
  return `${(bytes / KB).toFixed(1)} KB`;
};

const normalise = (path: string): string => {
  return path.replace(/^\/?_next\//, '').replace(/^\.next\//, '');
};

const sizeOf = (relative: string): ChunkSize => {
  const path = normalise(relative);
  const file = join(NEXT_DIR, path);

  if (!existsSync(file)) {
    return fail(`${path} is listed by the build but missing on disk — rebuild`);
  }

  const buffer = readFileSync(file);
  const text = buffer.toString('utf8');

  return {
    path,
    raw: buffer.length,
    gzip: gzipSync(buffer, { level: 9 }).length,
    brotli: brotliCompressSync(buffer, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
    markers: MARKERS.filter(([, pattern]) => {
      return pattern.test(text);
    }).map(([name]) => {
      return name;
    }),
  };
};

const total = (chunks: readonly ChunkSize[], key: 'gzip' | 'brotli'): number => {
  return chunks.reduce((sum, chunk) => {
    return sum + chunk[key];
  }, 0);
};

const contributors = (chunks: readonly ChunkSize[], key: 'gzip' | 'brotli'): string => {
  return [...chunks]
    .sort((left, right) => {
      return right[key] - left[key];
    })
    .slice(0, 4)
    .map((chunk) => {
      const label = chunk.markers.length > 0 ? chunk.markers.join('+') : 'app';
      const name = chunk.path.replace('static/chunks/', '');

      return `${name} ${kb(chunk[key])} (${label})`;
    })
    .join(' · ');
};

const allChunkPaths = (): string[] => {
  return readdirSync(CHUNKS_DIR)
    .filter((name) => {
      return name.endsWith('.js');
    })
    .sort()
    .map((name) => {
      return `static/chunks/${name}`;
    });
};

const workerGroups = (paths: readonly string[]): string[][] => {
  const groups: string[][] = [];

  for (const path of paths) {
    const text = readFileSync(join(NEXT_DIR, path), 'utf8');

    for (const match of text.matchAll(WORKER_GROUP)) {
      const entry = match[1] ?? '';

      const others = [...(match[2] ?? '').matchAll(QUOTED)].map((quoted) => {
        return quoted[1] ?? '';
      });

      groups.push([entry, ...others]);
    }
  }

  return groups;
};

const coversLatin = (range: string): boolean => {
  return range.split(',').some((token) => {
    const spec = token.trim().replace(/^U\+/i, '');
    const [startText = '', endText] = spec.split('-');
    const start = Number.parseInt(startText.replaceAll('?', '0'), 16);
    const end = Number.parseInt((endText ?? startText).replaceAll('?', 'F'), 16);

    return start <= LATIN_PROBE && LATIN_PROBE <= end;
  });
};

const fontFaces = (): FontFace[] => {
  const faces: FontFace[] = [];

  const sheets = readdirSync(CHUNKS_DIR).filter((name) => {
    return name.endsWith('.css');
  });

  for (const sheet of sheets) {
    const text = readFileSync(join(CHUNKS_DIR, sheet), 'utf8');

    for (const match of text.matchAll(FONT_FACE)) {
      const body = match[1] ?? '';
      const file = /url\(\.\.\/media\/([^)]+)\)/.exec(body)?.[1];

      if (file === undefined) {
        continue;
      }

      const range = /unicode-range:([^;]+)/.exec(body)?.[1];

      faces.push({
        family: (/font-family:([^;]+)/.exec(body)?.[1] ?? '').replaceAll(/["']/g, '').trim(),
        file,
        display: /font-display:([^;]+)/.exec(body)?.[1]?.trim() ?? 'auto',
        latin: range === undefined || coversLatin(range),
      });
    }
  }

  return faces;
};

const readRuntime = (buildId: string): Runtime | null => {
  if (!existsSync(RUNTIME_FILE)) {
    return null;
  }

  const parsed = runtimeSchema.safeParse(JSON.parse(readFileSync(RUNTIME_FILE, 'utf8')));

  if (!parsed.success || parsed.data.buildId !== buildId) {
    return null;
  }

  return parsed.data;
};

const verdict = (measured: number, cap: number, target?: number): Status => {
  if (measured > cap) {
    return 'breach';
  }

  return target !== undefined && measured > target ? 'over-target' : 'pass';
};

const run = (): number => {
  if (!existsSync(BUILD_ID_FILE)) {
    return fail('.next/BUILD_ID is missing — run `npx next build` first');
  }

  const buildId = readFileSync(BUILD_ID_FILE, 'utf8').trim();
  const stats = statsSchema.parse(readJson(STATS_FILE));
  const manifest = manifestSchema.parse(readJson(BUILD_MANIFEST_FILE));

  const route = stats.find((entry) => {
    return entry.route === ROUTE;
  });

  if (route === undefined) {
    return fail(`route ${ROUTE} is missing from route-bundle-stats.json`);
  }

  const rows: Row[] = [];
  const firstLoad = route.firstLoadChunkPaths.map(sizeOf);

  const firstLoadSet = new Set(
    firstLoad.map((chunk) => {
      return chunk.path;
    }),
  );

  const polyfills = new Set(manifest.polyfillFiles.map(normalise));
  const chunks = allChunkPaths();

  const lazy = chunks
    .filter((path) => {
      return !firstLoadSet.has(path) && !polyfills.has(path);
    })
    .map(sizeOf);

  const firstLoadBrotli = total(firstLoad, 'brotli');

  const heavyInFirstLoad = firstLoad.filter((chunk) => {
    return chunk.markers.includes('three') || chunk.markers.includes('gsap');
  });

  rows.push({
    item: `First-load JS \`${ROUTE}\` (${firstLoad.length} chunks)`,
    measured: `${kb(firstLoadBrotli)} br · ${kb(total(firstLoad, 'gzip'))} gz`,
    budget: `≤ ${kb(BUDGET.firstLoadBrotli)} br`,
    status: verdict(firstLoadBrotli, BUDGET.firstLoadBrotli),
    note: contributors(firstLoad, 'brotli'),
  });

  rows.push({
    item: 'three / GSAP in first load',
    measured: `${heavyInFirstLoad.length} chunks`,
    budget: '0',
    status: heavyInFirstLoad.length === 0 ? 'pass' : 'breach',
    note:
      heavyInFirstLoad
        .map((chunk) => {
          return chunk.path;
        })
        .join(', ') || 'markers: THREE., GreenSock',
  });

  const groups = workerGroups(chunks);
  const workerPaths = [...new Set(groups.flat())];
  const worker = workerPaths.map(sizeOf);
  const workerGzip = total(worker, 'gzip');
  const runtime = readRuntime(buildId);
  const pageRequested = new Set([...firstLoadSet, ...(runtime?.pageLazy ?? []).map(normalise)]);

  const workerOnly = worker.filter((chunk) => {
    return !pageRequested.has(chunk.path) || chunk.path.includes('turbopack-worker-');
  });

  rows.push({
    item: `Worker chunk group (${worker.length} files, everything the worker evaluates)`,
    measured: `${kb(workerGzip)} gz`,
    budget: `≤ ${kb(BUDGET.worker)} gz`,
    status: groups.length === 0 ? 'not-measured' : verdict(workerGzip, BUDGET.worker),
    note: groups.length === 0 ? 'no turbopack worker group found' : contributors(worker, 'gzip'),
  });

  rows.push({
    item: 'Worker-only bytes (not shared with page chunks)',
    measured: `${kb(total(workerOnly, 'gzip'))} gz`,
    budget: '—',
    status: runtime === null ? 'not-measured' : 'info',
    note:
      runtime === null
        ? 'needs the request log from `npm run perf:world`'
        : contributors(workerOnly, 'gzip'),
  });

  const three = lazy.filter((chunk) => {
    return chunk.markers.includes('three');
  });

  const threeGzip = total(three, 'gzip');

  rows.push({
    item: `three chunk(s) (${three.length})`,
    measured: `${kb(threeGzip)} gz`,
    budget: `≤ ${kb(BUDGET.threeTarget)} target · ${kb(BUDGET.threeCap)} cap`,
    status:
      three.length === 0 ? 'not-measured' : verdict(threeGzip, BUDGET.threeCap, BUDGET.threeTarget),
    note: contributors(three, 'gzip'),
  });

  const motion = lazy.filter((chunk) => {
    return chunk.markers.includes('gsap');
  });

  const motionGzip = total(motion, 'gzip');

  rows.push({
    item: `GSAP chunk(s) incl. the HUD code they carry (${motion.length})`,
    measured: `${kb(motionGzip)} gz`,
    budget: `≤ ${kb(BUDGET.gsap)} gz (GSAP part)`,
    status: motion.length === 0 ? 'not-measured' : verdict(motionGzip, BUDGET.gsap),
    note: `${contributors(motion, 'gzip')} — scope-hoisted, the GSAP part alone is smaller`,
  });

  rows.push({
    item: 'HUD code alone',
    measured: '—',
    budget: `≤ ${kb(BUDGET.hud)} gz`,
    status: 'not-measured',
    note: 'Turbopack hoists the HUD and GSAP into one module; not separable from the build output',
  });

  if (runtime === null) {
    rows.push({
      item: '3D path: page JS requested after first load',
      measured: '—',
      budget: `≤ ${kb(BUDGET.threeTarget)} target · ${kb(BUDGET.threeCap)} cap`,
      status: 'not-measured',
      note: 'run `npm run perf:world` on this build to record the requested chunks',
    });
  } else {
    const motionSet = new Set(
      motion.map((chunk) => {
        return chunk.path;
      }),
    );

    const world = [...new Set(runtime.pageLazy.map(normalise))]
      .filter((path) => {
        return (
          !firstLoadSet.has(path) && !motionSet.has(path) && !path.includes('turbopack-worker-')
        );
      })
      .map(sizeOf);

    const worldGzip = total(world, 'gzip');

    rows.push({
      item: `3D path: page JS requested after first load, minus GSAP/HUD (${world.length}, ${runtime.pass} run)`,
      measured: `${kb(worldGzip)} gz`,
      budget: `≤ ${kb(BUDGET.threeTarget)} target · ${kb(BUDGET.threeCap)} cap`,
      status: verdict(worldGzip, BUDGET.threeCap, BUDGET.threeTarget),
      note: contributors(world, 'gzip'),
    });

    rows.push({
      item: 'Model / texture / audio files fetched',
      measured: `${runtime.assets.length}`,
      budget: '0',
      status: runtime.assets.length === 0 ? 'pass' : 'breach',
      note: runtime.assets.join(', ') || 'none requested',
    });
  }

  const faces = fontFaces();

  const families = new Set(
    faces.map((face) => {
      return face.family;
    }),
  );

  const latinFiles = new Set(
    faces
      .filter((face) => {
        return face.latin;
      })
      .map((face) => {
        return face.file;
      }),
  );

  const notSwap = faces.filter((face) => {
    return face.display !== 'swap';
  });

  const media = readdirSync(MEDIA_DIR);

  const emittedFonts = media.filter((name) => {
    return name.endsWith('.woff2');
  });

  const assets = media.filter((name) => {
    return ASSET_FILE.test(name);
  });

  rows.push({
    item: 'Font families',
    measured: `${families.size}`,
    budget: `≤ ${BUDGET.fontFamilies}`,
    status: verdict(families.size, BUDGET.fontFamilies),
    note: [...families].join(', '),
  });

  rows.push({
    item: 'Font files a latin page can fetch',
    measured: `${latinFiles.size}`,
    budget: `≤ ${BUDGET.fontFiles}`,
    status: verdict(latinFiles.size, BUDGET.fontFiles),
    note:
      runtime === null
        ? [...latinFiles].join(', ')
        : `fetched at runtime: ${runtime.fonts.length} (${runtime.fonts.join(', ')})`,
  });

  rows.push({
    item: 'Font faces without `font-display: swap`',
    measured: `${notSwap.length}`,
    budget: '0',
    status: notSwap.length === 0 ? 'pass' : 'breach',
    note:
      notSwap
        .map((face) => {
          return `${face.family} ${face.display}`;
        })
        .join(', ') || 'all swap',
  });

  rows.push({
    item: 'Font files emitted (other unicode subsets)',
    measured: `${emittedFonts.length}`,
    budget: '—',
    status: 'info',
    note: 'next/font emits latin-ext / cyrillic / vietnamese faces; fetched only for glyphs in those ranges',
  });

  rows.push({
    item: 'Model / texture / audio files in the build',
    measured: `${assets.length}`,
    budget: '0',
    status: assets.length === 0 ? 'pass' : 'breach',
    note: assets.join(', ') || 'none',
  });

  console.log(`# Budget · build ${buildId} · KB = 1000 B · gzip -9 · brotli q11\n`);
  console.log('| Item | Measured | Budget | Status | Biggest contributors / note |');
  console.log('|---|---|---|---|---|');

  for (const row of rows) {
    console.log(`| ${row.item} | ${row.measured} | ${row.budget} | ${row.status} | ${row.note} |`);
  }

  const breaches = rows.filter((row) => {
    return row.status === 'breach';
  });

  console.log(
    breaches.length === 0
      ? '\nbudget: no breach'
      : `\nbudget: ${breaches.length} breach(es): ${breaches
          .map((row) => {
            return row.item;
          })
          .join('; ')}`,
  );

  return breaches.length === 0 ? 0 : 1;
};

process.exit(run());
