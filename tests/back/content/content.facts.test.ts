import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect } from 'vitest';

import { caseTest } from '@tests/back/content/content.facts.case-test';
import {
  ALL_STRINGS,
  FORBIDDEN_LIST_PATH,
  LLM_PRODUCT_STRINGS,
  STATION_STRINGS,
  containsTerm,
  forbiddenNames,
  loadForbiddenList,
} from '@tests/back/content/content.facts.support';
import { ALLOWED_NUMBERS, numericTokens } from '@tests/back/content/content.facts.numbers';
import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { STATIONS_COPY } from '@/content/stations.content';

const AI_TELLS: readonly RegExp[] = [
  /\b(delve|tapestry|realm|embark|beacon|multifaceted|paradigm|synergy|myriad|plethora|meticulous|intricate|utilize|supercharge|turbocharge|game-changer)\b/i,
  /\btestament to\b/i,
  /\bleverag(e|es|ed|ing)\b/i,
  /\bever-evolving\b/i,
  /\bplays? a crucial role\b/i,
  /\b(passionate|seamless|seamlessly|cutting-edge|robust|effortless|effortlessly|revolutionary|world-class|best-in-class|next-level)\b/i,
  /\bnot just\b/i,
  /\bnot only\b/i,
  /\bin today's\b/i,
  /\bwhen it comes to\b/i,
  /\bimagine\b/i,
  /\blet's dive\b/i,
  /\bit's worth noting\b/i,
  /\b(moreover|additionally|importantly|ultimately)\b/i,
  /\bin conclusion\b/i,
  /\bsay goodbye\b/i,
  /\bunlock the power\b/i,
  /\btake .{1,20} to the next level\b/i,
  /\bin just a few clicks\b/i,
  /\bthe (result|catch|secret)\?/i,
];

const PRONOUNS: RegExp =
  /(?<![\p{L}\p{N}'’])(i|me|my|mine|myself|he|his|him|himself|she|her|we|our)(?![\p{L}\p{N}])/iu;

const PHONE_SHAPED: RegExp = /\+?\d[\d\s().-]{7,}\d/;

const committedFiles = (dir: string): readonly string[] => {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path: string = join(dir, entry.name);

    if (entry.isDirectory()) {
      return committedFiles(path);
    }

    return entry.name.endsWith('.ts') ? [path] : [];
  });
};

caseTest(
  'content.forbidden.list-present',
  'the owner list loads and every category has entries',
  () => {
    const list = loadForbiddenList();

    expect(list.employers.length).toBeGreaterThan(0);
    expect(list.projects.length).toBeGreaterThan(0);
    expect(list.clients.length).toBeGreaterThan(0);
    expect(list.terms.length).toBeGreaterThan(0);
    expect(list.phones.length).toBeGreaterThan(0);
  },
);

caseTest(
  'content.forbidden.missing-file-fails-loudly',
  'a missing list throws and tells the owner to create it',
  () => {
    const missing: string = `${FORBIDDEN_LIST_PATH}.does-not-exist`;

    expect(() => {
      loadForbiddenList(missing);
    }).toThrow(/forbidden-names list is missing: create .*does-not-exist/i);
  },
);

caseTest('content.term-matching.word-aware', 'whole words only, any case', () => {
  expect(containsTerm('A Pipeline.', 'pipeline')).toBe(true);
  expect(containsTerm('two pipelines', 'pipeline')).toBe(true);
  expect(containsTerm('a pdf file', 'PDF')).toBe(true);
  expect(containsTerm('about 3 min or so', '3 min')).toBe(true);
  expect(containsTerm('prepipeline', 'pipeline')).toBe(false);
  expect(containsTerm('pipelined', 'pipeline')).toBe(false);
  expect(containsTerm('3 minutes', '3 min')).toBe(false);
});

caseTest('content.forbidden.names', 'no employer, project or client name in any string', () => {
  const names: readonly string[] = forbiddenNames(loadForbiddenList());

  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    return names.some((name) => {
      return containsTerm(entry.text, name);
    });
  }).map((entry) => {
    return entry.path;
  });

  expect(hits).toEqual([]);
});

caseTest('content.forbidden.terms', 'no banned term in any string', () => {
  const { terms } = loadForbiddenList();

  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    return terms.some((term) => {
      return containsTerm(entry.text, term);
    });
  }).map((entry) => {
    return entry.path;
  });

  expect(hits).toEqual([]);
});

caseTest('content.forbidden.committed-files-clean', 'no name typed into a committed file', () => {
  const names: readonly string[] = forbiddenNames(loadForbiddenList());

  const files: readonly string[] = [
    ...committedFiles('src/content'),
    ...committedFiles('tests/back/content'),
  ];

  const hits: readonly string[] = files.filter((file) => {
    const source: string = readFileSync(file, 'utf8');

    return names.some((name) => {
      return containsTerm(source, name);
    });
  });

  expect(files.length).toBeGreaterThan(0);
  expect(hits).toEqual([]);
});

caseTest('content.no-github', 'no github mention or link', () => {
  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    return /github/i.test(entry.text);
  }).map((entry) => {
    return entry.path;
  });

  expect(hits).toEqual([]);
});

caseTest('content.no-phone', 'no phone number in any string', () => {
  const { phones } = loadForbiddenList();

  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    const digits: string = entry.text.replace(/\D/g, '');

    return (
      PHONE_SHAPED.test(entry.text) ||
      phones.some((phone) => {
        return digits.includes(phone);
      })
    );
  }).map((entry) => {
    return entry.path;
  });

  expect(hits).toEqual([]);
});

caseTest(
  'content.llm-product.no-internals',
  'no pipeline, minute or PDF in the llm-product copy',
  () => {
    const hits: readonly string[] = LLM_PRODUCT_STRINGS.filter((entry) => {
      return /pipeline|minute|\bpdf\b/i.test(entry.text);
    }).map((entry) => {
      return entry.path;
    });

    expect(LLM_PRODUCT_STRINGS.length).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  },
);

caseTest('content.missions.exactly-three', 'exactly three Mission n of 3 stations', () => {
  const tags: readonly string[] = Object.values(STATIONS_COPY)
    .map((station) => {
      return station.tag;
    })
    .filter((tag) => {
      return /^Mission \d+ of \d+$/.test(tag);
    })
    .sort();

  expect(tags).toEqual(['Mission 1 of 3', 'Mission 2 of 3', 'Mission 3 of 3']);
});

caseTest('content.station-copy.no-pronouns', 'no pronoun as a word in station copy', () => {
  const hits: readonly string[] = STATION_STRINGS.filter((entry) => {
    return PRONOUNS.test(entry.text);
  }).map((entry) => {
    return entry.path;
  });

  expect(STATION_STRINGS.length).toBeGreaterThan(0);
  expect(hits).toEqual([]);
});

caseTest('content.no-em-dash', 'no em dash anywhere', () => {
  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    return entry.text.includes('—');
  }).map((entry) => {
    return entry.path;
  });

  expect(hits).toEqual([]);
});

caseTest('content.no-ai-tells', 'no AI-tell word or phrase', () => {
  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    return AI_TELLS.some((pattern) => {
      return pattern.test(entry.text);
    });
  }).map((entry) => {
    return entry.path;
  });

  expect(hits).toEqual([]);
});

caseTest('content.numbers.verified', 'every number is in the verified list', () => {
  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    return numericTokens(entry.text).length > 0;
  }).map((entry) => {
    return `${entry.path}: ${numericTokens(entry.text).join(',')}`;
  });

  expect(hits).toEqual([]);
});

caseTest('content.numbers.allow-list-sourced', 'every allowed number cites its source', () => {
  const sources: readonly string[] = ['facts', 'spec', 'security-md', 'owner-2026-10-07'];

  for (const entry of ALLOWED_NUMBERS) {
    expect(sources).toContain(entry.source);
    expect(entry.reference).not.toBe('');
    expect(entry.phrase).not.toBe('');
  }

  expect(
    new Set(
      ALLOWED_NUMBERS.map((entry) => {
        return entry.phrase;
      }),
    ).size,
  ).toBe(ALLOWED_NUMBERS.length);
});

caseTest('content.no-need-marker', 'no [NEED marker', () => {
  const hits: readonly string[] = ALL_STRINGS.filter((entry) => {
    return /\[NEED/i.test(entry.text);
  }).map((entry) => {
    return entry.path;
  });

  expect(hits).toEqual([]);
});

caseTest('content.form.status-invalid', 'the invalid-status line is exact', () => {
  expect(CONTACT_FORM_COPY.status.invalid).toBe('Message not sent. Check the marked fields.');
});
