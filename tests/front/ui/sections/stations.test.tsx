import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/sections/stations.case-test';
import { ANALYTICS_EVENT } from '@/core/analytics/analytics';
import { FlightLog } from '@/sections/flight-log/flight-log.component';
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
    station: 'llm-product',
    title: 'An LLM product from zero',
    tag: 'Mission 1 of 3',
    items: 4,
    chips: 6,
    result: 'On time',
  },
  {
    station: 'marketplace-chat',
    title: 'Chat and video player, live',
    tag: 'Mission 2 of 3',
    items: 3,
    chips: 5,
    result: 'Live',
  },
  {
    station: 'admin-app',
    title: 'An admin app with 46 pages',
    tag: 'Mission 3 of 3',
    items: 3,
    chips: 5,
    result: '46 pages',
  },
  {
    station: 'ai-engineering',
    title: 'Builds with agent workflows',
    tag: 'AI engineering',
    items: 4,
    chips: 6,
    result: 'Daily',
  },
  {
    station: 'this-world',
    title: 'You are flying the proof',
    tag: 'How this was built',
    items: 3,
    chips: 6,
    result: '1 + AI',
  },
];

const LOG_YEARS: readonly string[] = [
  '2024–26',
  '2022–24',
  '2021–22',
  '2020–21',
  '2018–20',
  '2015–18',
];

const LOG_ROLES: readonly string[] = [
  'Tech lead',
  'Frontend engineer',
  'Team lead',
  'Frontend developer',
  'Freelance developer',
  'Public service, Ukraine',
];

const SYSTEM_GROUPS: readonly string[] = [
  'Frontend',
  'Backend',
  'Architecture and security',
  'AI',
  'Tooling',
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
  expect(document.body.textContent).toContain('Full-stack dev with AI engineering');

  expect(document.body.textContent).toContain(
    'Builds interfaces and the services behind them. Runs AI agents as part of the workflow.',
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

  expect(texts('[data-motion="stat-value"]')).toEqual(['7+', '2+']);

  expect(texts('[data-motion="stat"]')).toEqual([
    '7+years in production',
    '2+years as a tech lead',
  ]);

  expect(texts('[data-motion="chip"]')).toEqual([
    'TypeScript',
    'React',
    'Next.js',
    'Vue',
    'Nuxt',
    'Node.js',
    'Three.js',
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
  expect(headings[0]?.textContent).toBe('What is in the cockpit');

  const groups = [...document.querySelectorAll('h3')];

  expect(
    groups.map((group) => {
      return group.firstChild?.textContent;
    }),
  ).toEqual(SYSTEM_GROUPS);

  expect(groups[0]?.textContent).toBe('Frontend7+ yrs');
  expect(groups[1]?.textContent).toBe('Backend');

  const backendChips = [...(groups[1]?.nextElementSibling?.querySelectorAll('li') ?? [])].map(
    (chip) => {
      return chip.textContent;
    },
  );

  expect(backendChips).toEqual([
    'Node.js2 yrs',
    'NestJS',
    'REST',
    'WebSockets',
    'RabbitMQ',
    'Redis',
    'PostgreSQL',
  ]);
});

caseTest('stations.flight-log', 'six entries, newest first', async () => {
  await render(<FlightLog />);

  const headings = document.querySelectorAll('h2');

  expect(headings).toHaveLength(1);
  expect(headings[0]?.id).toBe('flight-log-title');
  expect(headings[0]?.textContent).toBe('Routes flown so far');

  expect(document.querySelectorAll('ol')).toHaveLength(1);
  expect(texts('ol > li > span')).toEqual(LOG_YEARS);
  expect(texts('ol h3')).toEqual(LOG_ROLES);

  expect(
    [...document.querySelectorAll('ol li p')].every((summary) => {
      return (summary.textContent ?? '') !== '';
    }),
  ).toBe(true);

  expect(document.querySelectorAll('ol li p')).toHaveLength(6);
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

      <section>
        <FlightLog />
      </section>

      <section>
        <MissionBrief station="this-world" />
      </section>
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

  const [home, , , , , systems, log] = sections;

  expect(home && has(home, 'stat')).toBe(true);
  expect(home && has(home, 'stat-value')).toBe(true);
  expect(home && has(home, 'chip')).toBe(true);
  expect(home && has(home, 'lede')).toBe(true);

  for (const brief of [sections[1], sections[2], sections[3], sections[4], sections[7]]) {
    expect(brief && has(brief, 'lede')).toBe(true);
    expect(brief && has(brief, 'chip')).toBe(true);
    expect(brief && has(brief, 'result')).toBe(true);
  }

  expect(systems && has(systems, 'lede')).toBe(true);
  expect(systems && has(systems, 'chip')).toBe(true);
  expect(log && has(log, 'chip')).toBe(false);
});

caseTest('stations.server-html', 'complete markup without client effects', () => {
  const html = renderToString(
    <>
      <HomeBase cvHref={null} />

      {BRIEFS.map((brief) => {
        return <MissionBrief key={brief.station} station={brief.station} />;
      })}

      <Systems />

      <FlightLog />
    </>,
  );

  expect(html).toContain('Vitalii Vorynka');
  expect(html).toContain('Full-stack dev with AI engineering');

  for (const brief of BRIEFS) {
    expect(html).toContain(brief.title);
  }

  expect(html).toContain('What is in the cockpit');
  expect(html).toContain('Routes flown so far');

  for (const role of LOG_ROLES) {
    expect(html).toContain(role);
  }

  for (const years of LOG_YEARS) {
    expect(html).toContain(years);
  }
});
