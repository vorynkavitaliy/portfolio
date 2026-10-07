import { SRGBColorSpace, WebGLRenderer } from 'three';

import { WorldStartError } from '@/scene/runtime/world-start-error';

import type { Profile } from '@/scene/runtime/runtime.types';

export const contextAttributesFor = (profile: Profile): WebGLContextAttributes => {
  return {
    alpha: false,
    antialias: profile === 'desktop',
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  };
};

const openContext = (
  canvas: HTMLCanvasElement,
  attributes: WebGLContextAttributes,
): WebGL2RenderingContext | null => {
  try {
    return canvas.getContext('webgl2', attributes);
  } catch {
    return null;
  }
};

export const createRenderer = (canvas: HTMLCanvasElement, profile: Profile): WebGLRenderer => {
  const attributes = contextAttributesFor(profile);
  const context = openContext(canvas, attributes);

  if (context === null) {
    throw new WorldStartError('no-webgl2');
  }

  try {
    const renderer = new WebGLRenderer({
      canvas,
      context,
      antialias: attributes.antialias ?? false,
      powerPreference: 'high-performance',
    });

    renderer.outputColorSpace = SRGBColorSpace;

    return renderer;
  } catch {
    throw new WorldStartError('renderer-failed');
  }
};
