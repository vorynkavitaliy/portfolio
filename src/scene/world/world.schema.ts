import * as z from 'zod/mini';

import { GLYPHS } from '@/scene/world/world.constants';

const GLYPH_LINE = new RegExp(`^[${Object.keys(GLYPHS).join('')}]+$`);

export const worldRequestSchema = z.object({
  skyName: z.array(z.string().check(z.regex(GLYPH_LINE))).check(z.minLength(1), z.maxLength(3)),
});
