import { ImageResponse } from 'next/og';

import { createBrandIcon } from '@/core/brand/brand-icon';

const SIDES = [192, 512] as const;

export const contentType = 'image/png';

export function generateImageMetadata() {
  return SIDES.map((side) => {
    return {
      id: String(side),
      size: { width: side, height: side },
      contentType,
    };
  });
}

type IconProps = Readonly<{ id: Promise<string | number> }>;

export default async function Icon({ id }: IconProps) {
  const side: number = Number(await id);

  return new ImageResponse(createBrandIcon(side), { width: side, height: side });
}
