import type { WebGLRenderer } from 'three';

export type WorldDebugSnapshot = Readonly<{
  frames: number;
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
  pixelRatio: number;
}>;

export type WorldDebug = Readonly<{ snapshot: () => WorldDebugSnapshot }>;

const releaseNothing = (): void => {};

export const exposeWorldDebug = (renderer: WebGLRenderer): (() => void) => {
  if (process.env.NEXT_PUBLIC_WORLD_DEBUG !== '1' || typeof window === 'undefined') {
    return releaseNothing;
  }

  const globalKey = '__worldDebug';
  const { info } = renderer;
  let latest: WorldDebugSnapshot | null = null;
  let frames = 0;
  let handle = 0;

  const read = (): WorldDebugSnapshot => {
    return {
      frames,
      calls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
      pixelRatio: renderer.getPixelRatio(),
    };
  };

  const sample = (): void => {
    frames += 1;
    latest = read();
    info.reset();
    handle = requestAnimationFrame(sample);
  };

  const api: WorldDebug = {
    snapshot: () => {
      return latest ?? read();
    },
  };

  info.autoReset = false;
  info.reset();
  handle = requestAnimationFrame(sample);
  Reflect.set(window, globalKey, api);

  return () => {
    cancelAnimationFrame(handle);
    info.autoReset = true;

    if (Reflect.get(window, globalKey) === api) {
      Reflect.deleteProperty(window, globalKey);
    }
  };
};
