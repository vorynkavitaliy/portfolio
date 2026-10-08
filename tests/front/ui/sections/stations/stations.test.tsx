import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/sections/stations/stations.case-test';
import { ANALYTICS_EVENT } from '@/core/analytics/analytics';
import { HomeBase } from '@/sections/home-base/home-base.component';
import { MissionBrief } from '@/sections/mission-brief/mission-brief.component';
import { Systems } from '@/sections/systems/systems.component';

import type { BriefStationId } from '@/content/content.types';

const LINKEDIN = 'https://www.linkedin.com/in/vitaliy-vorynka-7b6005142';

const BRIEFS: readonly Readonly<{
  station: BriefStationId;
  title: string;
  tag: string;
  items: number;
  chips: number;
  result: string;
}>[] = [
  {
    station: 'full-cycle',
    title: 'From idea to production',
    tag: 'Full cycle',
    items: 5,
    chips: 0,
    result: 'Idea to MVP',
  },
  {
    station: 'frontend',
    title: 'Interfaces in React and Vue',
    tag: 'Frontend · 7+ years',
    items: 7,
    chips: 14,
    result: '7+ yrs',
  },
  {
    station: 'backend',
    title: 'Services on Node.js',
    tag: 'Backend',
    items: 6,
    chips: 9,
    result: 'Node.js',
  },
  {
    station: 'ai',
    title: 'AI in the product and the workflow',
    tag: 'AI integration',
    items: 5,
    chips: 10,
    result: 'Own MCP',
  },
  {
    station: 'deploy',
    title: 'Ships to production',
    tag: 'DevOps',
    items: 5,
    chips: 6,
    result: 'Dev + prod',
  },
  {
    station: 'this-world',
    title: 'This site is a project too',
    tag: 'How it was built',
    items: 3,
    chips: 0,
    result: '1 + AI',
  },
];

const SYSTEM_GROUPS: readonly string[] = [
  'Frontend',
  'Backend',
  'Integrations',
  'DevOps',
  'AI',
  'Tools and 3D',
];

let details: unknown[];

const recordEvent = (event: Event): void => {
  details.push(event instanceof CustomEvent ? event.detail : undefined);
};

const cancelNavigation = (event: MouseEvent): void => {
  event.preventDefault();
};

beforeEach(() => {
  details = [];
  window.addEventListener(ANALYTICS_EVENT, recordEvent);
  document.addEventListener('click', cancelNavigation);
});

afterEach(() => {
  window.removeEventListener(ANALYTICS_EVENT, recordEvent);
  document.removeEventListener('click', cancelNavigation);
});

const texts = (selector: string): readonly string[] => {
  return [...document.querySelectorAll(selector)].map((element) => {
    return element.textContent;
  });
};

caseTest('stations.home-base.heading', 'name, tag, role and lede', async () => {
  await render(<HomeBase cvHref={null} />);

  const headings = document.querySelectorAll('h1');

  expect(headings).toHaveLength(1);
  expect(headings[0]?.textContent).toBe('Vitalii Vorynka');
  expect(headings[0]?.id).toBe('home-base-title');
  expect(document.body.textContent).toContain('Pilot on duty');
  expect(document.body.textContent).toContain('Full-stack Developer · AI Engineer');

  expect(document.body.textContent).toContain(
    'Builds web products end to end: interface, backend, deploy. 7+ years in production, 20+ projects.',
  );
});

caseTest('stations.home-base.contact', 'the Contact CTA', async () => {
  const screen = await render(<HomeBase cvHref={null} />);

  await expect
    .element(screen.getByRole('link', { name: 'Contact', exact: true }))
    .toHaveAttribute('href', '#contact');
});

caseTest('stations.home-base.cv-link', 'the CV link from the prop', async () => {
  const screen = await render(<HomeBase cvHref="https://cv.example.test/cv.pdf" />);
  const link = screen.getByRole('link', { name: 'Download CV', exact: true });

  await expect.element(link).toHaveAttribute('href', 'https://cv.example.test/cv.pdf');
  await expect.element(link).toHaveAttribute('download');

  await link.click();
  expect(details).toEqual([{ name: 'cv_download' }]);

  await link.click();
  expect(details).toEqual([{ name: 'cv_download' }, { name: 'cv_download' }]);
});

caseTest('stations.home-base.cv-placeholder', 'no CV address yet', async () => {
  const screen = await render(<HomeBase cvHref={null} />);

  await expect
    .element(screen.getByRole('button', { name: 'Download CV', exact: true }))
    .toBeDisabled();

  expect(document.querySelectorAll('a[download]')).toHaveLength(0);
  expect(details).toEqual([]);
});

caseTest('stations.home-base.linkedin', 'the profile link', async () => {
  const screen = await render(<HomeBase cvHref={null} />);
  const link = screen.getByRole('link', { name: 'LinkedIn', exact: true });

  await expect.element(link).toHaveAttribute('href', LINKEDIN);
  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noopener');

  await link.click();
  expect(details).toEqual([{ name: 'linkedin_click' }]);
});

caseTest('stations.home-base.facts', 'stats and chips', async () => {
  await render(<HomeBase cvHref={null} />);

  expect(texts('[data-motion="stat-value"]')).toEqual(['7+', '20+']);

  expect(texts('[data-motion="stat"]')).toEqual(['7+years in production', '20+projects']);

  expect(texts('[data-motion="chip"]')).toEqual([
    'TypeScript',
    'React',
    'Next.js',
    'Vue',
    'Nuxt',
    'Node.js',
    'NestJS',
    'Express',
    'Docker',
    'Claude Code',
  ]);
});

caseTest('stations.brief.heading', 'a titled h2 per brief', async () => {
  for (const brief of BRIEFS) {
    const screen = await render(<MissionBrief station={brief.station} />);
    const headings = document.querySelectorAll('h2');

    expect(headings).toHaveLength(1);
    expect(headings[0]?.id).toBe(`${brief.station}-title`);
    expect(headings[0]?.textContent).toBe(brief.title);

    await screen.unmount();
  }
});

caseTest('stations.brief.body', 'tag, items, chips and result', async () => {
  for (const brief of BRIEFS) {
    const screen = await render(<MissionBrief station={brief.station} />);

    expect(texts('[data-motion="tag"]')).toEqual([brief.tag]);
    expect(document.querySelectorAll('[data-motion="lede"]')).toHaveLength(1);
    expect(document.querySelectorAll('li[data-motion="item"]')).toHaveLength(brief.items);
    expect(document.querySelectorAll('li[data-motion="chip"]')).toHaveLength(brief.chips);
    expect(document.querySelector('[data-motion="result"] b')?.textContent).toBe(brief.result);

    await screen.unmount();
  }
});

caseTest('stations.systems', 'groups and chips', async () => {
  await render(<Systems />);

  const headings = document.querySelectorAll('h2');

  expect(headings).toHaveLength(1);
  expect(headings[0]?.id).toBe('systems-title');
  expect(headings[0]?.textContent).toBe('The working stack');

  const groups = [...document.querySelectorAll('h3')];

  expect(
    groups.map((group) => {
      return group.firstChild?.textContent;
    }),
  ).toEqual(SYSTEM_GROUPS);

  expect(groups[0]?.textContent).toBe('Frontend');
  expect(groups[1]?.textContent).toBe('Backend');

  const backendChips = [...(groups[1]?.nextElementSibling?.querySelectorAll('li') ?? [])].map(
    (chip) => {
      return chip.textContent;
    },
  );

  expect(backendChips).toEqual([
    'Node.js',
    'NestJS',
    'Express',
    'REST',
    'GraphQL',
    'WebSockets',
    'RabbitMQ',
    'Redis',
    'PostgreSQL',
    'MongoDB',
  ]);
});

const renderAll = async () => {
  return render(
    <>
      <section>
        <HomeBase cvHref={null} />
      </section>

      {BRIEFS.slice(0, 4).map((brief) => {
        return (
          <section key={brief.station}>
            <MissionBrief station={brief.station} />
          </section>
        );
      })}

      <section>
        <Systems />
      </section>

      {BRIEFS.slice(4).map((brief) => {
        return (
          <section key={brief.station}>
            <MissionBrief station={brief.station} />
          </section>
        );
      })}
    </>,
  );
};

caseTest('stations.heading-order', 'one h1, an h2 per section', async () => {
  await renderAll();

  expect(document.querySelectorAll('h1')).toHaveLength(1);

  const h2 = [...document.querySelectorAll('h2')];

  expect(h2).toHaveLength(7);

  expect(
    new Set(
      h2.map((heading) => {
        return heading.id;
      }),
    ).size,
  ).toBe(7);

  for (const heading of document.querySelectorAll('h1, h2')) {
    expect(heading.id).toMatch(/-title$/);
  }

  for (const section of document.querySelectorAll('section')) {
    const levels = [...section.querySelectorAll('h1, h2, h3')].map((heading) => {
      return heading.tagName;
    });

    expect(levels[0] === 'H1' || levels[0] === 'H2').toBe(true);
  }
});

caseTest('stations.motion', 'motion targets are present', async () => {
  await renderAll();

  const sections = [...document.querySelectorAll('section')];

  const has = (section: Element, target: string): boolean => {
    return section.querySelector(`[data-motion="${target}"]`) !== null;
  };

  expect(sections).toHaveLength(8);

  for (const section of sections) {
    expect(has(section, 'tag')).toBe(true);
    expect(has(section, 'title')).toBe(true);
    expect(has(section, 'item')).toBe(true);
  }

  const [home, , , , , systems] = sections;

  expect(home && has(home, 'stat')).toBe(true);
  expect(home && has(home, 'stat-value')).toBe(true);
  expect(home && has(home, 'chip')).toBe(true);
  expect(home?.querySelectorAll('[data-motion="lede"]')).toHaveLength(2);

  const briefSections = [
    sections[1],
    sections[2],
    sections[3],
    sections[4],
    sections[6],
    sections[7],
  ];

  for (const [index, brief] of briefSections.entries()) {
    expect(brief && has(brief, 'lede')).toBe(true);
    expect(brief && has(brief, 'chip')).toBe((BRIEFS[index]?.chips ?? 0) > 0);
    expect(brief && has(brief, 'result')).toBe(true);
  }

  expect(systems && has(systems, 'lede')).toBe(false);
  expect(systems && has(systems, 'chip')).toBe(true);
});

caseTest('stations.server-html', 'complete markup without client effects', () => {
  const html = renderToString(
    <>
      <HomeBase cvHref={null} />

      {BRIEFS.map((brief) => {
        return <MissionBrief key={brief.station} station={brief.station} />;
      })}

      <Systems />
    </>,
  );

  expect(html).toContain('Vitalii Vorynka');
  expect(html).toContain('Full-stack Developer · AI Engineer');

  for (const brief of BRIEFS) {
    expect(html).toContain(brief.title);
  }

  expect(html).toContain('The working stack');
});
