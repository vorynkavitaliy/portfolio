import type { CSSProperties, ReactElement } from 'react';

import { PALETTE_TOKENS } from '@/core/styles/palette.tokens';

const GRID = 32;

const CORNER_RADIUS = 6;

const PIXELS: readonly (readonly [number, number, number, number])[] = [
  [6, 6, 4, 8],
  [22, 6, 4, 8],
  [10, 14, 4, 8],
  [18, 14, 4, 8],
  [14, 22, 4, 4],
];

export const createBrandIcon = (side: number): ReactElement => {
  const unit: number = side / GRID;

  const rootStyle: CSSProperties = {
    width: side,
    height: side,
    display: 'flex',
    position: 'relative',
    background: PALETTE_TOKENS.ink,
    borderRadius: CORNER_RADIUS * unit,
  };

  return (
    <div style={rootStyle}>
      {PIXELS.map(([x, y, width, height]) => {
        const pixelStyle: CSSProperties = {
          position: 'absolute',
          left: x * unit,
          top: y * unit,
          width: width * unit,
          height: height * unit,
          background: PALETTE_TOKENS.signal,
        };

        return <div key={`${x}-${y}`} style={pixelStyle} />;
      })}
    </div>
  );
};
