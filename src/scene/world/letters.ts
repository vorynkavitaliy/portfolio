import { createRng } from '@/scene/world/rng';
import {
  GLYPHS,
  LETTER_ADVANCE,
  LETTER_LINE_GAP,
  LETTER_ROWS,
  LETTER_SCALE,
  RNG_SEEDS,
} from '@/scene/world/world.constants';

const DELAY_SPREAD = 0.55;

type LetterCell = readonly [number, number];

const collectCells = (lines: readonly string[]): readonly LetterCell[] => {
  const cells: LetterCell[] = [];

  lines.forEach((word, line) => {
    const width = word.length * LETTER_ADVANCE - 1;

    [...word].forEach((character, letterIndex) => {
      const glyph = GLYPHS[character];

      if (glyph === undefined) {
        throw new Error(`no glyph for ${character}`);
      }

      glyph.forEach((row, rowIndex) => {
        [...row].forEach((bit, column) => {
          if (bit === '1') {
            cells.push([
              letterIndex * LETTER_ADVANCE + column - width / 2,
              LETTER_ROWS - 1 - rowIndex + (1 - line) * LETTER_LINE_GAP,
            ]);
          }
        });
      });
    });
  });

  return cells;
};

export const generateLetters = (
  lines: readonly string[],
): Readonly<{ targets: Float32Array; starts: Float32Array; delays: Float32Array }> => {
  const random = createRng(RNG_SEEDS.letters);
  const cells = collectCells(lines);
  const targets = new Float32Array(cells.length * 3);
  const starts = new Float32Array(cells.length * 3);
  const delays = new Float32Array(cells.length);

  cells.forEach(([x, y], index) => {
    targets[index * 3] = x * LETTER_SCALE;
    targets[index * 3 + 1] = y * LETTER_SCALE;
  });

  for (let i = 0; i < cells.length; i++) {
    starts[i * 3] = (random() - 0.5) * 70;
    starts[i * 3 + 1] = (random() - 0.2) * 40;
    starts[i * 3 + 2] = (random() - 0.5) * 50;
  }

  for (let i = 0; i < cells.length; i++) {
    delays[i] = random() * DELAY_SPREAD;
  }

  return { targets, starts, delays };
};
