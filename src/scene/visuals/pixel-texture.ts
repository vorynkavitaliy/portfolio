import {
  DataTexture,
  NearestFilter,
  NearestMipmapNearestFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three';

import { PIXEL_TEXTURE_SIZE } from '@/scene/world/world.constants';

const CHANNELS = 4;

export const flipRows = (pixels: Uint8Array, size: number): Uint8Array => {
  const rowLength = size * CHANNELS;
  const flipped = new Uint8Array(pixels.length);

  for (let row = 0; row < size; row += 1) {
    const from = row * rowLength;

    flipped.set(pixels.subarray(from, from + rowLength), (size - 1 - row) * rowLength);
  }

  return flipped;
};

export const createPixelTexture = (pixels: Uint8Array): DataTexture => {
  const size = PIXEL_TEXTURE_SIZE;
  const texture = new DataTexture(flipRows(pixels, size), size, size, RGBAFormat, UnsignedByteType);

  texture.magFilter = NearestFilter;
  texture.minFilter = NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};
