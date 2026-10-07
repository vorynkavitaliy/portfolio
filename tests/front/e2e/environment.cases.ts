export type EnvironmentCaseSource = 'owner-2026-10-07' | 'playwright-docs';

export type EnvironmentCase = Readonly<{
  id: string;
  source: EnvironmentCaseSource;
  reference: string;
  expected: string;
}>;

export const ENVIRONMENT_CASES = [
  {
    id: 'env.webgl2.desktop-1440',
    source: 'owner-2026-10-07',
    reference: '0002-voxel-world/plan.md §9 S09 environment cases',
    expected: 'desktop-1440 creates a WebGL2 context',
  },
  {
    id: 'env.webgl2.reduced-motion',
    source: 'owner-2026-10-07',
    reference: '0002-voxel-world/plan.md §9 S09 environment cases',
    expected: 'reduced-motion creates a WebGL2 context',
  },
  {
    id: 'env.webgl2.mobile-390',
    source: 'owner-2026-10-07',
    reference: '0002-voxel-world/plan.md §9 S09 environment cases',
    expected: 'mobile-390 creates a WebGL2 context',
  },
  {
    id: 'env.pointer.coarse-mobile-390',
    source: 'owner-2026-10-07',
    reference: '0002-voxel-world/plan.md §9 S09 environment cases',
    expected: 'mobile-390 matches (pointer: coarse)',
  },
  {
    id: 'env.mailpit.answers',
    source: 'owner-2026-10-07',
    reference: '0002-voxel-world/plan.md §7 e2e environment',
    expected: 'Mailpit answers /api/v1/info on 127.0.0.1:8025',
  },
] as const satisfies readonly EnvironmentCase[];

export type EnvironmentCaseId = (typeof ENVIRONMENT_CASES)[number]['id'];
