export type RuntimeCaseSource =
  'prototype' | 'spec' | 'scene-rule' | 'motion-tokens' | 'owner-2026-10-07' | 'three-docs';

export type RuntimeCase = Readonly<{
  id: string;
  source: RuntimeCaseSource;
  reference: string;
  expected: string;
}>;

const GATE =
  'scene-3d.md §2 (loop runs only in world view, after Take off, tab visible, context alive); spec FR-006, FR-007';

const PROFILE = 'scene-3d.md §2 (desktop > 860 px, narrow otherwise); prototype :376';

const DPR =
  'spec FR-040 (DPR capped 1.75 desktop, 1.5 narrow; tier lowers to DPR 1); prototype :1202';

const FPS =
  'scene-3d.md §2 (tiers decline when the median fps of two consecutive 2 s windows is under 45 desktop / 26 narrow; first 2 s after Take off ignored; bloom off → DPR 1 → slow prompt)';

const EFFECTS = 'prototype :1373–1389 (onArrive, onSend), scene-map.md Effects table';

const DECAY =
  'scene-3d.md §2 (effects decay with k ** (dt * 60)); prototype :1520, :1534, :1557 per-frame k';

const OFFSET = 'prototype :1205–1210 (applyView); spec FR-041';
const CHASE = 'prototype :1363–1374 (chase), :1505–1515 (intro, floor)';

export const RUNTIME_CASES = [
  {
    id: 'gate.runs.world-running',
    source: 'scene-rule',
    reference: GATE,
    expected: 'world view, boot running, visible, context alive → runs',
  },
  { id: 'gate.stops.text-view', source: 'spec', reference: GATE, expected: 'text view → stopped' },
  {
    id: 'gate.stops.before-take-off',
    source: 'scene-rule',
    reference: GATE,
    expected: 'boot idle, loading, ready or failed → stopped',
  },
  { id: 'gate.stops.hidden', source: 'spec', reference: GATE, expected: 'hidden tab → stopped' },
  {
    id: 'gate.stops.context-lost',
    source: 'scene-rule',
    reference: GATE,
    expected: 'context lost → stopped',
  },
  {
    id: 'gate.table.single-true',
    source: 'scene-rule',
    reference: GATE,
    expected: 'of all 60 combinations exactly one runs',
  },

  {
    id: 'quality.profile.desktop',
    source: 'scene-rule',
    reference: PROFILE,
    expected: '861 and 1440 px → desktop',
  },
  {
    id: 'quality.profile.narrow',
    source: 'scene-rule',
    reference: PROFILE,
    expected: '860 and 390 px → narrow',
  },
  {
    id: 'quality.dpr.desktop-cap',
    source: 'spec',
    reference: DPR,
    expected: 'desktop tier 0 at DPR 3 → 1.75',
  },
  {
    id: 'quality.dpr.narrow-cap',
    source: 'spec',
    reference: DPR,
    expected: 'narrow tier 0 at DPR 3 → 1.5',
  },
  {
    id: 'quality.dpr.below-cap',
    source: 'prototype',
    reference: DPR,
    expected: 'desktop DPR 1.25 → 1.25',
  },
  {
    id: 'quality.dpr.tier-one-keeps',
    source: 'scene-rule',
    reference: FPS,
    expected: 'tier 1 (bloom off) keeps the cap: desktop DPR 3 → 1.75',
  },
  {
    id: 'quality.dpr.tier-two',
    source: 'spec',
    reference: DPR,
    expected: 'tier 2 at DPR 3 → 1 on both profiles',
  },
  {
    id: 'quality.tier.initial',
    source: 'scene-rule',
    reference: FPS,
    expected: 'initial tier is 0',
  },
  {
    id: 'quality.bloom.desktop-tier-zero',
    source: 'scene-rule',
    reference: 'scene-3d.md §2, §6 (bloom desktop tier 0 only; never narrow)',
    expected: 'desktop 0 true; desktop 1, desktop 2, narrow 0 false',
  },

  {
    id: 'fps.hold.fast',
    source: 'scene-rule',
    reference: FPS,
    expected: 'desktop at 50 fps for 20 s → only hold',
  },
  {
    id: 'fps.decline.two-windows',
    source: 'scene-rule',
    reference: FPS,
    expected:
      'desktop at 25 fps from 0 ms → first decline at 6000 ms (grace 2000 + two 2000 ms windows)',
  },
  {
    id: 'fps.grace.ignored',
    source: 'scene-rule',
    reference: FPS,
    expected: '25 fps for the first 4 s (grace + one window) then 50 fps → never declines',
  },
  {
    id: 'fps.consecutive.only',
    source: 'scene-rule',
    reference: FPS,
    expected: 'slow, fast, slow, fast windows → never declines',
  },
  {
    id: 'fps.floor.by-profile',
    source: 'scene-rule',
    reference: FPS,
    expected: '40 fps declines on desktop (floor 45) and holds on narrow (floor 26)',
  },
  {
    id: 'fps.sequence.slow-last',
    source: 'scene-rule',
    reference: FPS,
    expected:
      'sustained 25 fps desktop → decline at 6000, decline at 10000, slow at 14000, then hold only',
  },
  {
    id: 'fps.restart.grace',
    source: 'scene-rule',
    reference: FPS,
    expected: 'restart at 20000 → 2 s grace again; 25 fps then declines first at 26000',
  },

  {
    id: 'effects.initial',
    source: 'prototype',
    reference: `${EFFECTS}; ring t < 1 and burst uT < 1.2 mean active (:1545–1551)`,
    expected: 'shake 0, bloom 0, 9 beams at 0, ring t 1, burst t 1.2',
  },
  {
    id: 'effects.dock.values',
    source: 'prototype',
    reference: EFFECTS,
    expected:
      'station 3: beam 2.6 (others 0), ring t 0 at top + 0.15 scale 18, burst t 0 at top + 1.2, bloom 0.7, shake 0.35',
  },
  {
    id: 'effects.send.values',
    source: 'prototype',
    reference: EFFECTS,
    expected: 'Contact (8): beam 5, ring scale 60, burst at top + 1.2, bloom 2, shake 0.6',
  },
  {
    id: 'effects.take-off.bloom',
    source: 'prototype',
    reference: 'prototype :1594 (bloomBoost = 0.6 on Take off)',
    expected: 'bloom 0.6',
  },
  {
    id: 'effects.decay.one-frame',
    source: 'prototype',
    reference: DECAY,
    expected: 'one 1/60 s step: beam ×0.965, bloom ×0.94, shake ×0.9',
  },
  {
    id: 'effects.decay.rate-independent',
    source: 'scene-rule',
    reference: DECAY,
    expected: 'one second at 30 and 120 fps equals one second at 60 fps',
  },
  {
    id: 'effects.shake.cutoff',
    source: 'prototype',
    reference: 'prototype :1520 (shake < 0.01 → 0)',
    expected: 'shake 0.0105 after one 60 fps step → 0',
  },
  {
    id: 'effects.ring.duration',
    source: 'motion-tokens',
    reference: 'motion.md §1 ring 1.3 s; prototype :1545',
    expected: 'ring t 0.5 after 0.65 s, 1 once 1.3 s have passed and stays 1',
  },
  {
    id: 'effects.burst.duration',
    source: 'motion-tokens',
    reference: 'motion.md §1 burst 1.4 s; prototype :1551 (stops at 1.2)',
    expected: 'burst t 0.5 after 0.7 s, 1.2 after 2 s and stays 1.2',
  },

  {
    id: 'view.offset.desktop',
    source: 'prototype',
    reference: OFFSET,
    expected: '1440×900 → x −244.8, y 0',
  },
  {
    id: 'view.offset.narrow',
    source: 'prototype',
    reference: OFFSET,
    expected: '390×844 → x 0, y 143.48',
  },
  {
    id: 'view.offset.boundary',
    source: 'spec',
    reference: OFFSET,
    expected: '860 → bottom-sheet offset, 861 → left-panel offset',
  },
  {
    id: 'view.offset.camera',
    source: 'three-docs',
    reference: 'https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset',
    expected: 'applyViewport sets aspect 1.6 and view offsetX −244.8 on a 1440×900 camera',
  },
  {
    id: 'camera.ease',
    source: 'prototype',
    reference: 'prototype :380 easeInOut',
    expected: '0 → 0, 0.25 → 0.0625, 0.5 → 0.5, 0.75 → 0.9375, 1 → 1',
  },
  {
    id: 'camera.fov-kick',
    source: 'prototype',
    reference:
      'prototype :1525 (clamp01((speed − 13) / 13) · 8); spec FR-039 (no kick under reduced motion)',
    expected: 'speed 13 → 0, 19.5 → 4, 26 → 8, 40 → 8; reduced → 0',
  },
  {
    id: 'camera.follow.rates',
    source: 'spec',
    reference: `${CHASE}; spec FR-039 (fast follow under reduced motion: 12 / 20)`,
    expected:
      'after a 10-block sideways move and one 0.1 s step the camera moves 10·(1 − e^−0.4), reduced 10·(1 − e^−1.2)',
  },
  {
    id: 'camera.intro.start',
    source: 'prototype',
    reference: CHASE,
    expected: 'intro progress 0 → camera at Home top + (−30, 90, 60)',
  },
  {
    id: 'camera.floor',
    source: 'spec',
    reference: 'spec FR-019; prototype :1518 (+2.5)',
    expected: 'plane at y 30 over ground 40 → camera y 42.5',
  },

  {
    id: 'controller.dock.store',
    source: 'spec',
    reference: 'spec FR-022 (docking opens the station panel); plan D-7',
    expected: 'docked 2 → flight docked marketplace-chat, visited [marketplace-chat]',
  },
  {
    id: 'controller.dock.track-once',
    source: 'spec',
    reference: 'spec FR-054, SC-019 (station_docked with id, once per action)',
    expected: 'one station_docked event with station marketplace-chat',
  },
  {
    id: 'controller.dock.effects',
    source: 'prototype',
    reference: `${EFFECTS}; spec FR-023`,
    expected: 'beam 2 boosted to 2.6, shake 0.35',
  },
  {
    id: 'controller.dock.reduced',
    source: 'spec',
    reference: 'spec FR-039; prototype :1374 (onArrive returns under reduced motion)',
    expected: 'effects unchanged under reduced motion; chime still plays',
  },
  {
    id: 'controller.dock.sound',
    source: 'prototype',
    reference: 'prototype :599 (chime(k), blip(true))',
    expected: 'chime(2, 0) and blip(true)',
  },
  {
    id: 'controller.take-off.ready',
    source: 'owner-2026-10-07',
    reference: 'Q-9 B: Take off turns sound on; plan D-15',
    expected: 'take-off at boot ready → boot running, sound true, flight intro',
  },
  {
    id: 'controller.take-off.undock',
    source: 'prototype',
    reference: 'prototype :1250–1256 (unlink), :600 blip(false)',
    expected: 'docked at Home → take-off → flight free, blip(false)',
  },
  {
    id: 'controller.autopilot.mapping',
    source: 'spec',
    reference: 'spec FR-031 (autopilot to the chosen station)',
    expected: 'autopilot contact → docking target 8, flight autopilot contact',
  },
  {
    id: 'controller.autopilot.before-intro',
    source: 'prototype',
    reference: 'prototype :1258 (autopilot ignored before introDone); spec FR-008',
    expected: 'before intro-done the command changes nothing',
  },
  {
    id: 'controller.send.flash',
    source: 'spec',
    reference: 'spec FR-038; prototype :745–746, :1382–1388',
    expected: 'flash send seq 1, beam 8 at 5, chimes (0, 0), (2, 0.12), (4, 0.24)',
  },
  {
    id: 'controller.send.reduced',
    source: 'spec',
    reference: 'spec FR-039 (no flash, ring, burst or shake)',
    expected: 'flash stays null, effects unchanged, three chimes',
  },
  {
    id: 'controller.boost',
    source: 'spec',
    reference: 'spec FR-012 (Boost button)',
    expected: 'boost held true then false reach the input',
  },
  {
    id: 'controller.reset',
    source: 'spec',
    reference: 'spec FR-020; plan D-24',
    expected: 'reset event → flight free',
  },
  {
    id: 'controller.map.pick',
    source: 'spec',
    reference: 'spec FR-033 (road map click flies to the station)',
    expected: 'index 8 → contact; null → null',
  },

  {
    id: 'loader.message.progress',
    source: 'scene-rule',
    reference:
      'architecture.md §3 (worker posts WorldData); plan §5.3 (main thread parses WorldMessage)',
    expected: 'progress 0.4 parsed',
  },
  {
    id: 'loader.message.done',
    source: 'scene-rule',
    reference: 'plan §5.3 WorldData shape',
    expected: 'done with the generated world parses with every typed array kept by reference',
  },
  {
    id: 'loader.message.rejects',
    source: 'scene-rule',
    reference: 'typescript.md §6 (zod at every runtime boundary)',
    expected: 'wrong array class, missing field, unknown type, non-object → null',
  },
  {
    id: 'loader.message.lengths',
    source: 'scene-rule',
    reference: 'typescript.md §6 (zod at every runtime boundary); plan §5 WorldData sizes',
    expected:
      'heights 128², stationTops 27, pixelTexture 1024, minimap 128²·4; any other length → null',
  },
  {
    id: 'loader.message.error',
    source: 'scene-rule',
    reference: 'plan §5.3 WorldMessage',
    expected: 'error message parsed as error',
  },

  {
    id: 'pixel.flip',
    source: 'three-docs',
    reference:
      'https://threejs.org/docs/#api/en/textures/Texture.flipY (CanvasTexture flips, DataTexture does not); prototype :885–893 canvas rows',
    expected: 'row 0 moves to row 15 and row 15 to row 0',
  },
  {
    id: 'pixel.filters',
    source: 'prototype',
    reference: 'prototype :893 (Nearest, NearestMipmapNearest, sRGB)',
    expected: 'mag Nearest, min NearestMipmapNearest, mipmaps on, sRGB, 16×16',
  },
  {
    id: 'terrain.chunks',
    source: 'scene-rule',
    reference:
      'scene-3d.md §4 (chunk meshes, per-vertex colours, one material); scene-map.md terrain',
    expected:
      'one mesh per non-empty chunk, one shared Lambert material with vertex colours and the pixel map, normalized normal/uv/color',
  },
  {
    id: 'terrain.dispose',
    source: 'scene-rule',
    reference: 'scene-3d.md §4 (dispose every geometry and material)',
    expected: 'dispose fires on every geometry and the material',
  },
  {
    id: 'loop.single-callback',
    source: 'scene-rule',
    reference: 'scene-3d.md §2 (one requestAnimationFrame loop); review B3 round 1 finding 1',
    expected:
      'store updates inside a frame (dock, reset, slow) and repeated starts leave exactly one pending callback and one start',
  },
  {
    id: 'loop.restart-in-frame',
    source: 'scene-rule',
    reference: 'scene-3d.md §2; review B3 round 1 finding 1 (reset or view change inside a frame)',
    expected: 'a stop then start inside one frame leaves one pending callback and a second start',
  },
  {
    id: 'loop.stops',
    source: 'scene-rule',
    reference: 'scene-3d.md §2 (a gated loop renders zero frames); §6 (no loop while hidden)',
    expected: 'stop cancels the pending frame; a stop inside a frame schedules nothing',
  },
  {
    id: 'start-error.reason',
    source: 'spec',
    reference: 'spec FR-004 (renderer cannot start → text version)',
    expected: 'WorldStartError keeps its reason; any other error → renderer-failed',
  },
  {
    id: 'build.yields-between-modules',
    source: 'scene-rule',
    reference: 'scene-3d.md §4 (no long task during load); perf.md S27 long-task breach',
    expected:
      'terrain, environment and actors are built in separate turns with a yield between each, order kept',
  },
  {
    id: 'renderer.attributes',
    source: 'spec',
    reference: 'spec FR-040 (narrow without antialiasing); plan S15 renderer',
    expected: 'desktop antialias true, narrow false, high-performance, no alpha',
  },
] as const satisfies readonly RuntimeCase[];

export type RuntimeCaseId = (typeof RUNTIME_CASES)[number]['id'];
