import { createRng } from '@/scene/world/rng';

const PERMUTATION_SIZE = 256;

const GRADIENTS: readonly (readonly [number, number])[] = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const SKEW = 0.5 * (Math.sqrt(3) - 1);
const UNSKEW = (3 - Math.sqrt(3)) / 6;

const buildPermutation = (seed: number): Uint8Array => {
  const random = createRng(seed);

  const shuffled: number[] = Array.from({ length: PERMUTATION_SIZE }, (_, index) => {
    return index;
  });

  for (let i = PERMUTATION_SIZE - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const held = shuffled[i] ?? 0;

    shuffled[i] = shuffled[j] ?? 0;
    shuffled[j] = held;
  }

  const doubled = new Uint8Array(PERMUTATION_SIZE * 2);

  for (let i = 0; i < PERMUTATION_SIZE * 2; i++) {
    doubled[i] = shuffled[i & (PERMUTATION_SIZE - 1)] ?? 0;
  }

  return doubled;
};

const corner = (x: number, y: number, gradientIndex: number): number => {
  const falloff = 0.5 - x * x - y * y;

  if (falloff < 0) {
    return 0;
  }

  const gradient = GRADIENTS[gradientIndex & 7] ?? [0, 0];

  return falloff * falloff * falloff * falloff * ((gradient[0] ?? 0) * x + (gradient[1] ?? 0) * y);
};

export const createNoise = (seed: number): ((x: number, y: number) => number) => {
  const perm = buildPermutation(seed);

  const at = (index: number): number => {
    return perm[index] ?? 0;
  };

  return (x: number, y: number): number => {
    const skew = (x + y) * SKEW;
    const i = Math.floor(x + skew);
    const j = Math.floor(y + skew);
    const unskew = (i + j) * UNSKEW;
    const x0 = x - (i - unskew);
    const y0 = y - (j - unskew);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const ii = i & 255;
    const jj = j & 255;

    return (
      70 *
      (corner(x0, y0, at(ii + at(jj))) +
        corner(x0 - i1 + UNSKEW, y0 - j1 + UNSKEW, at(ii + i1 + at(jj + j1))) +
        corner(x0 - 1 + 2 * UNSKEW, y0 - 1 + 2 * UNSKEW, at(ii + 1 + at(jj + 1))))
    );
  };
};
