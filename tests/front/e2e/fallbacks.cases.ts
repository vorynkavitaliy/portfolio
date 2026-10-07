import type { FirstScreenCase } from '@tests/front/e2e/first-screen.cases';

export const CASES = [
  {
    id: 'spec.fallback.server-html-boot',
    source: 'spec',
    reference: 'plan S21 integration; portfolio-spec FR-001',
    expected:
      'server HTML has data-view boot, data-boot idle, the loader name and role line, and the loader name is not an h2',
  },
  {
    id: 'spec.fallback.no-webgl-notice',
    source: 'spec',
    reference: 'portfolio-spec FR-004, SC-002',
    expected: 'without WebGL2 the text version and the notice show within 1 s of hydration',
  },
  {
    id: 'spec.fallback.chunks-aborted',
    source: 'spec',
    reference: 'portfolio-spec FR-004, SC-002',
    expected: 'with lazy chunks aborted the text version and the failed notice show, no loader',
  },
  {
    id: 'spec.fallback.low-end-default',
    source: 'spec',
    reference: 'portfolio-spec FR-005, SC-003',
    expected: 'with deviceMemory 2 the text version is the default and 3D world opens the loader',
  },
] as const satisfies readonly FirstScreenCase[];

export type FallbacksCaseId = (typeof CASES)[number]['id'];
