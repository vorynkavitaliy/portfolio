import { Color, FogExp2, PerspectiveCamera, Scene, type WebGLRenderer } from 'three';

import { track } from '@/core/analytics/analytics';
import { STATION_IDS } from '@/core/world/stations';
import {
  failWorld,
  markInputUsed,
  markReady,
  markSlow,
  setSound,
} from '@/core/world/world-actions';
import { SCENE_TIMING } from '@/motion/motion.tokens';
import { prefersReducedMotion } from '@/motion/reduced-motion';
import { createWorldAudio, type WorldAudio } from '@/scene/audio/world-audio';
import { controlFor, createControl } from '@/scene/flight/control';
import { createDocking, resetDocking, stepDocking } from '@/scene/flight/docking';
import { HOME_STATION, MAX_DT, ORBIT_START_ANGLE } from '@/scene/flight/flight.constants';
import { stepPlane } from '@/scene/flight/integrate';
import { createPlane, placeOnOrbit } from '@/scene/flight/plane';
import { createFlightInput } from '@/scene/input/flight-input';
import { drawMinimap, stationAtMap } from '@/scene/nav/minimap';
import { selectTarget } from '@/scene/nav/nav-math';
import { createNavOverlay } from '@/scene/nav/nav-overlay';
import { applyViewport, createCameraRig, type RigFrame } from '@/scene/runtime/camera-rig';
import { createEffects, decayEffects, triggerTakeOff } from '@/scene/runtime/effects';
import { shouldRun } from '@/scene/runtime/loop-gate';
import {
  bloomAllowed,
  createFpsMonitor,
  dprFor,
  INITIAL_TIER,
  nextTier,
  profileFor,
} from '@/scene/runtime/quality';
import { createRenderer } from '@/scene/runtime/renderer';
import {
  BLOOM_BASE,
  BLOOM_GAIN,
  CAMERA_FAR,
  CAMERA_NEAR,
  FOG_COLOR,
  FOG_DENSITY,
  FOV,
} from '@/scene/runtime/runtime.constants';
import { createWorldController } from '@/scene/runtime/world-controller';
import { WorldStartError } from '@/scene/runtime/world-start-error';
import { createActors } from '@/scene/visuals/actors/actors';
import { createEnvironment } from '@/scene/visuals/environment/environment';
import { createPixelTexture } from '@/scene/visuals/pixel-texture';
import { createTerrainModule } from '@/scene/visuals/terrain';
import { createTerrain } from '@/scene/world/heightmap';
import { MAP_SIZE, STATION_COUNT } from '@/scene/world/world.constants';

import type { WorldStore } from '@/core/world/world-store';
import type { Vec3 } from '@/scene/flight/flight.types';
import type {
  BloomPass,
  FrameContext,
  SceneModule,
  StickElements,
  Tier,
  Viewport,
} from '@/scene/runtime/runtime.types';
import type { WorldData } from '@/scene/world/world.types';

export type StartWorldOptions = Readonly<{
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  stick: StickElements;
  data: WorldData;
  labels: readonly string[];
  navTemplate: string;
  store: WorldStore;
}>;

export type WorldRuntime = Readonly<{ dispose: () => void }>;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type MapStation = { x: number; z: number; lit: boolean };

export const MARKS = {
  generated: 'world:generated',
  ready: 'world:ready',
  firstFrame: 'world:first-frame',
} as const;

export const stationsFrom = (tops: Float32Array): Vec3[] => {
  const stations: Vec3[] = [];

  for (let index = 0; index < STATION_COUNT; index += 1) {
    stations.push({
      x: tops[index * 3] ?? 0,
      y: tops[index * 3 + 1] ?? 0,
      z: tops[index * 3 + 2] ?? 0,
    });
  }

  return stations;
};

const openAudioContext = (): AudioContext | null => {
  return typeof AudioContext === 'function' ? new AudioContext() : null;
};

const measure = (canvas: HTMLCanvasElement, viewport: Viewport): void => {
  viewport.width = Math.max(1, canvas.clientWidth || window.innerWidth);
  viewport.height = Math.max(1, canvas.clientHeight || window.innerHeight);
};

const markOnce = (name: string): void => {
  if (typeof performance.mark === 'function') {
    performance.mark(name);
  }
};

const runAll = (disposers: (() => void)[]): void => {
  while (disposers.length > 0) {
    const dispose = disposers.pop();

    if (dispose === undefined) {
      continue;
    }

    try {
      dispose();
    } catch {
      console.error('world-runtime:dispose-failed');
    }
  }
};

export const startWorld = async (options: StartWorldOptions): Promise<WorldRuntime> => {
  const { canvas, data, store } = options;
  const profile = profileFor(window.innerWidth);
  const reducedMotion = prefersReducedMotion();
  const disposers: (() => void)[] = [];
  let contextLost = false;
  let disposed = false;

  const renderer: WebGLRenderer = createRenderer(canvas, profile);

  disposers.push(() => {
    renderer.dispose();
  });

  const dispose = (): void => {
    if (disposed) {
      return;
    }

    disposed = true;
    runAll(disposers);
  };

  const onContextLost = (event: Event): void => {
    event.preventDefault();
    contextLost = true;

    store.update((state) => {
      return failWorld(state, 'context-lost');
    });

    dispose();
  };

  canvas.addEventListener('webglcontextlost', onContextLost);

  disposers.push(() => {
    canvas.removeEventListener('webglcontextlost', onContextLost);
  });

  try {
    const viewport: Viewport = { width: 1, height: 1 };
    let tier: Tier = INITIAL_TIER;

    measure(canvas, viewport);

    const scene = new Scene();
    const horizon = new Color(FOG_COLOR);

    scene.background = horizon;
    scene.fog = new FogExp2(horizon, FOG_DENSITY);

    disposers.push(() => {
      scene.clear();
    });

    const camera = new PerspectiveCamera(
      FOV[profile],
      viewport.width / viewport.height,
      CAMERA_NEAR,
      CAMERA_FAR,
    );

    const pixelTexture = createPixelTexture(data.pixelTexture);

    disposers.push(() => {
      pixelTexture.dispose();
    });

    const build = { data, profile, renderer, camera, pixelTexture };
    const modules: SceneModule[] = [createTerrainModule(data.chunks, pixelTexture), ...createEnvironment(build)];
    const actors = createActors(build);

    modules.push(...actors.modules);

    disposers.push(() => {
      for (const sceneModule of modules) {
        sceneModule.dispose();
      }
    });

    for (const sceneModule of modules) {
      scene.add(sceneModule.object);
    }

    const updaters: ((frame: FrameContext) => void)[] = [];

    for (const sceneModule of modules) {
      if (sceneModule.update !== null) {
        updaters.push(sceneModule.update);
      }
    }

    let bloom: BloomPass | null =
      bloomAllowed(profile, tier) && actors.createBloom !== null ? actors.createBloom() : null;

    const dropBloom = (): void => {
      bloom?.dispose();
      bloom = null;
    };

    disposers.push(dropBloom);

    const applySize = (): void => {
      measure(canvas, viewport);
      renderer.setPixelRatio(dprFor(profile, tier, window.devicePixelRatio));
      renderer.setSize(viewport.width, viewport.height, false);
      applyViewport(camera, viewport.width, viewport.height);
      bloom?.setSize(viewport.width, viewport.height);
    };

    applySize();

    const stations = stationsFrom(data.stationTops);
    const terrain = createTerrain(data.heights);
    const plane = createPlane();
    const home = stations[HOME_STATION];

    if (home !== undefined) {
      placeOnOrbit(plane, home, ORBIT_START_ANGLE);
    }

    const docking = createDocking();
    const control = createControl();
    const effects = createEffects();
    const rig = createCameraRig({ camera, stations, terrain, reducedMotion });
    const monitor = createFpsMonitor(profile);

    const input = createFlightInput({
      canvas,
      stick: options.stick,
      onFirstInput: () => {
        store.update(markInputUsed);
      },
    });

    input.setEnabled(false);

    disposers.push(() => {
      input.dispose();
    });

    const overlay = createNavOverlay({
      root: options.overlay,
      stationIds: STATION_IDS,
      labels: options.labels,
      template: options.navTemplate,
    });

    overlay.setVisible(false);

    disposers.push(() => {
      overlay.dispose();
    });

    const audio: WorldAudio = createWorldAudio(openAudioContext);

    disposers.push(() => {
      audio.dispose();
    });

    const mapStations: MapStation[] = stations.map((station) => {
      return { x: station.x, z: station.z, lit: false };
    });

    const mapPlane = { x: 0, z: 0, yaw: 0 };

    const mapFrame = {
      image: data.minimap,
      size: MAP_SIZE,
      stations: mapStations,
      plane: mapPlane,
    };

    const runtimeController = createWorldController({
      store,
      docking,
      plane,
      stations,
      terrain,
      effects,
      audio,
      track,
      reducedMotion,
      setBoostHeld: input.setBoostHeld,
      map: {
        draw: (target) => {
          const docked = docking.mode.kind === 'docked' ? docking.mode.station : -1;

          mapStations.forEach((station, index) => {
            station.lit = index === docked || (docking.visited & (1 << index)) !== 0;
          });

          mapPlane.x = plane.pos.x;
          mapPlane.z = plane.pos.z;
          mapPlane.yaw = plane.yaw;
          drawMinimap(target, mapFrame);
        },
        pick: (point) => {
          return stationAtMap(point.u, point.v, mapStations);
        },
      },
    });

    const intro: Mutable<FrameContext['intro']> = {
      progress: reducedMotion ? 1 : 0,
      done: reducedMotion,
    };

    const frame: Mutable<FrameContext> = {
      time: 0,
      dt: 0,
      plane,
      camera,
      profile,
      tier,
      reducedMotion,
      dockedIndex: -1,
      targetIndex: -1,
      autopilotIndex: -1,
      intro,
      effects,
      stations,
      viewport,
    };

    const rigFrame: Mutable<RigFrame> = { plane, dt: 0, focusIndex: HOME_STATION, intro, shake: 0 };

    const navFrame = {
      camera,
      plane: plane.pos,
      stations,
      targetIndex: -1,
      width: viewport.width,
      height: viewport.height,
    };

    let introStart: number | null = null;
    let autoDock: ReturnType<typeof setTimeout> | null = null;
    let raf = 0;
    let running = false;
    let lastNow = 0;
    let audioOn = false;
    let navVisible = false;
    let firstFrame = true;

    const render = (): void => {
      if (bloom !== null) {
        bloom.render(BLOOM_BASE + effects.bloomBoost * BLOOM_GAIN);

        return;
      }

      renderer.render(scene, camera);
    };

    const declineTier = (): void => {
      tier = nextTier(tier);
      frame.tier = tier;

      if (!bloomAllowed(profile, tier)) {
        dropBloom();
      }

      applySize();
    };

    const updateIntro = (now: number): void => {
      if (intro.done || introStart === null) {
        return;
      }

      intro.progress = Math.min(1, Math.max(0, (now - introStart) / SCENE_TIMING.introMs));
      intro.done = intro.progress >= 1;
    };

    const syncNav = (): void => {
      const visible = docking.introDone;

      if (visible !== navVisible) {
        navVisible = visible;
        overlay.setVisible(visible);
      }

      if (visible) {
        navFrame.targetIndex = frame.targetIndex;
        navFrame.width = viewport.width;
        navFrame.height = viewport.height;
        overlay.update(navFrame);
      }
    };

    const step = (now: number): void => {
      raf = 0;

      if (!running) {
        return;
      }

      const frameMs = now - lastNow;
      const dt = Math.min(MAX_DT, Math.max(0, frameMs / 1000));

      lastNow = now;

      const steer = input.read();
      const docked = stepDocking(docking, plane, steer, stations, terrain);

      if (docked !== null) {
        runtimeController.applyEvent(docked);
      }

      controlFor(docking.mode, docking.orbitSide, plane, steer, terrain, stations, control);

      if (stepPlane(plane, control, docking.mode, stations, terrain, dt) === 'reset') {
        runtimeController.applyEvent(resetDocking(docking, plane, stations));
        rig.snap(plane, -1);
      }

      updateIntro(now);

      const { mode } = docking;

      frame.time = now / 1000;
      frame.dt = dt;
      frame.dockedIndex = mode.kind === 'docked' ? mode.station : -1;
      frame.autopilotIndex = mode.kind === 'autopilot' ? mode.target : -1;
      frame.targetIndex = selectTarget(mode, plane.pos, stations, docking.visited);

      rigFrame.dt = dt;
      rigFrame.focusIndex = mode.kind === 'intro' ? HOME_STATION : frame.dockedIndex;
      rigFrame.shake = effects.shake;
      rig.update(rigFrame);
      decayEffects(effects, dt);

      for (const update of updaters) {
        update(frame);
      }

      syncNav();
      audio.update(plane.speed);
      render();

      const verdict = monitor.push(frameMs, now);

      if (verdict === 'decline') {
        declineTier();
      } else if (verdict === 'slow') {
        store.update(markSlow);
      }

      if (firstFrame) {
        firstFrame = false;
        markOnce(MARKS.firstFrame);
      }

      raf = requestAnimationFrame(step);
    };

    const syncAudio = (desired: boolean): void => {
      if (desired === audioOn) {
        return;
      }

      audioOn = desired;

      const enabled = audio.setEnabled(desired);

      if (desired && !enabled) {
        audioOn = false;

        store.update((state) => {
          return setSound(state, false);
        });
      }
    };

    const startIntro = (now: number): void => {
      introStart = now;
      triggerTakeOff(effects);

      if (reducedMotion) {
        runtimeController.command({ type: 'intro-done' });

        return;
      }

      autoDock = setTimeout(() => {
        autoDock = null;
        runtimeController.command({ type: 'intro-done' });
      }, SCENE_TIMING.autoDockMs);
    };

    const sync = (): void => {
      if (disposed) {
        return;
      }

      const state = store.getSnapshot();

      const run = shouldRun({
        view: state.view,
        bootStatus: state.boot.status,
        hidden: document.hidden,
        contextLost,
      });

      running = run;
      input.setEnabled(run);
      syncAudio(state.sound && run);

      if (state.boot.status === 'running' && introStart === null) {
        startIntro(performance.now());
      }

      if (run && raf === 0) {
        lastNow = performance.now();
        monitor.restart(lastNow);
        raf = requestAnimationFrame(step);
      } else if (!run && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    disposers.push(() => {
      running = false;

      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }

      if (autoDock !== null) {
        clearTimeout(autoDock);
        autoDock = null;
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      applySize();
    });

    resizeObserver.observe(canvas);

    disposers.push(() => {
      resizeObserver.disconnect();
    });

    rig.showIntroStart(plane);
    await renderer.compileAsync(scene, camera);

    if (contextLost || disposed) {
      throw new WorldStartError('context-lost');
    }

    render();

    const { controller } = runtimeController;

    store.setController(controller);

    disposers.push(() => {
      if (store.controller() === controller) {
        store.setController(null);
      }
    });

    document.addEventListener('visibilitychange', sync);

    disposers.push(() => {
      document.removeEventListener('visibilitychange', sync);
    });

    const unsubscribe = store.subscribe(sync);

    disposers.push(unsubscribe);
    markOnce(MARKS.ready);
    store.update(markReady);
    sync();
  } catch (error) {
    dispose();

    throw error instanceof WorldStartError ? error : new WorldStartError('renderer-failed');
  }

  return { dispose };
};
