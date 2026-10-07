export type BootCaseSource = 'spec' | 'owner-2026-10-07' | 'prototype' | 'mdn-docs';

export type BootCase = Readonly<{
  id: string;
  source: BootCaseSource;
  reference: string;
  expected: string;
}>;

const D5 =
  'plan 0002 D-5 (loader by default; 12 s CSS escape; after hydration JS decides the view) and S21 tests line';

const D6 = 'plan 0002 D-6 (deep link to the text version = /#text)';

const D23 =
  'plan 0002 D-23 (Save-Data on, or deviceMemory < 4, or hardwareConcurrency <= 2 → text; each ignored when unreported)';

const S21 =
  'plan 0002 §9 S21 produces: loaderStatus weights 0.6 worker / 0.25 engine / 0.15 built; label = first unfinished stage';

export const BOOT_CASES = [
  {
    id: 'boot.constants',
    source: 'owner-2026-10-07',
    reference:
      'plan 0002 §9 S21 (LOADER_ESCAPE_MS, WATCHDOG_MS 20_000, IDLE_TIMEOUT_MS 1500), §4.3',
    expected: 'LOADER_ESCAPE_MS 12000, WATCHDOG_MS 20000, IDLE_TIMEOUT_MS 1500',
  },
  {
    id: 'boot.view.default',
    source: 'spec',
    reference: 'FR-003 (capable device with WebGL2 sees the loader / world)',
    expected: 'capable probe (webgl2, no Save-Data, 8 GB, 8 cores, no hash, 100 ms) → world',
  },
  {
    id: 'boot.view.deep-link',
    source: 'owner-2026-10-07',
    reference: D6,
    expected:
      'hash "#text" → text, reason deep-link; world stays available when WebGL2 is there and is not offered without it',
  },
  {
    id: 'boot.view.escape',
    source: 'owner-2026-10-07',
    reference: D5,
    expected: '12000 ms since navigation → text, reason escape; 11999 ms → world',
  },
  {
    id: 'boot.view.no-webgl2',
    source: 'spec',
    reference: 'FR-004, NFR-005 (no WebGL1 path; text version with a notice)',
    expected: 'no WebGL2 → text, reason no-webgl2, world not available',
  },
  {
    id: 'boot.view.no-webgl2-before-low-end',
    source: 'spec',
    reference: 'FR-004 (the notice is shown when WebGL2 is unavailable), FR-005',
    expected: 'no WebGL2 on a low-end device → reason no-webgl2 (not low-end)',
  },
  {
    id: 'boot.view.save-data',
    source: 'owner-2026-10-07',
    reference: D23,
    expected: 'saveData true → text, reason low-end, world available; saveData false → world',
  },
  {
    id: 'boot.view.memory',
    source: 'owner-2026-10-07',
    reference: D23,
    expected: 'deviceMemory 2 → low-end; deviceMemory 4 → world',
  },
  {
    id: 'boot.view.cores',
    source: 'owner-2026-10-07',
    reference: D23,
    expected: 'hardwareConcurrency 2 → low-end; hardwareConcurrency 3 → world',
  },
  {
    id: 'boot.view.unreported',
    source: 'owner-2026-10-07',
    reference: D23,
    expected: 'saveData, deviceMemory and hardwareConcurrency all null → world',
  },
  {
    id: 'boot.apply.world',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §4.2 step 2 (world) and §5.1 openWorld / setWorldAvailable',
    expected: 'boot snapshot → view world, worldAvailable true, textReason null, boot idle',
  },
  {
    id: 'boot.apply.text',
    source: 'spec',
    reference: 'FR-005 (low-end: text by default, «3D world» offered)',
    expected: 'low-end decision → view text, textReason low-end, worldAvailable true, boot idle',
  },
  {
    id: 'boot.apply.no-webgl2',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §4.2 step 8 (no WebGL2 → failWorld(reason) → text + notice)',
    expected:
      'no-webgl2 decision → boot failed no-webgl2, view text, textReason no-webgl2, worldAvailable false',
  },
  {
    id: 'boot.apply.once',
    source: 'owner-2026-10-07',
    reference: D5,
    expected: 'a snapshot that already left boot is returned unchanged (same object)',
  },
  {
    id: 'boot.probe.webgl2',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §9 S21 (webgl2 probe on a throwaway canvas, then WEBGL_lose_context)',
    expected: 'context returned → true, getContext asked for "webgl2", loseContext called once',
  },
  {
    id: 'boot.probe.missing',
    source: 'mdn-docs',
    reference: 'MDN HTMLCanvasElement.getContext: null when the context type is not supported',
    expected: 'getContext returns null → false',
  },
  {
    id: 'boot.probe.throws',
    source: 'spec',
    reference: 'FR-004 (the loader never stays forever)',
    expected: 'getContext throws → false, no exception escapes',
  },
  {
    id: 'boot.read.navigator',
    source: 'mdn-docs',
    reference:
      'MDN NetworkInformation.saveData, Navigator.deviceMemory, Navigator.hardwareConcurrency',
    expected:
      'hash and now passed through; saveData from navigator.connection; deviceMemory and hardwareConcurrency read; absent or non-number → null',
  },
  {
    id: 'boot.loader.idle',
    source: 'prototype',
    reference: 'docs/prototype/index.html:350 («Generating world 0%»)',
    expected: 'idle → stage generating, progress 0, percent 0, not ready',
  },
  {
    id: 'boot.loader.worker',
    source: 'owner-2026-10-07',
    reference: S21,
    expected: 'loading worker 0.5, engine false → generating, progress 0.3, 30 %',
  },
  {
    id: 'boot.loader.engine',
    source: 'owner-2026-10-07',
    reference: S21,
    expected: 'worker 1, engine false → stage engine, 60 %',
  },
  {
    id: 'boot.loader.engine-first',
    source: 'owner-2026-10-07',
    reference: S21,
    expected: 'worker 0.5, engine true → stage generating, 55 %',
  },
  {
    id: 'boot.loader.building',
    source: 'owner-2026-10-07',
    reference: S21,
    expected: 'worker 1, engine true → stage building, 85 %',
  },
  {
    id: 'boot.loader.ready',
    source: 'prototype',
    reference: 'docs/prototype/index.html:1589 («World ready», setLoad(1))',
    expected: 'ready and running → stage ready, progress 1, 100 %, ready true',
  },
  {
    id: 'boot.text-source',
    source: 'owner-2026-10-07',
    reference:
      'plan 0002 §5.1 TextVersionSource; spec FR-054 (text version opened, once per action)',
    expected:
      'deep-link → deep-link; low-end → low-end; escape, no-webgl2, failed → fallback; visitor → null (the control tracks its own source)',
  },
] as const satisfies readonly BootCase[];

export type BootCaseId = (typeof BOOT_CASES)[number]['id'];
