export type MotionCaseSource = 'motion-tokens' | 'prototype' | 'spec' | 'gsap-docs';

export type MotionCase = Readonly<{
  id: string;
  source: MotionCaseSource;
  reference: string;
  expected: string;
}>;

const PANEL_TOKENS = 'rules/motion.md §1 «Panel timeline»';
const PANEL_PROTOTYPE = 'docs/prototype/index.html:504-514 (animatePanel)';
const TITLE_CARD = 'docs/prototype/index.html:527-534 (titleCard); rules/motion.md §1 «Title card»';
const MAGNET = 'docs/prototype/index.html:537-543 (magnet)';
const SCENE_TIMING = 'rules/motion.md §1 «Scene timing»';
const ROLL = 'docs/prototype/index.html:490-497 (rollNumber)';
const REDUCED = 'spec FR-039, SC-010; rules/motion.md §2';

const RESTORE =
  'spec FR-023 (stat counters) and principle 4 (content complete); rules/motion.md §3 (no hidden content)';

const GSAP_EASES =
  'https://gsap.com/docs/v3/Eases (power3 is the quartic curve: power3.out = 1 - (1 - p)^4)';

export const MOTION_CASES = [
  {
    id: 'motion.panel.wipe-in',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'wipe in: 0.28 s, power4.in, no stagger, at 0',
  },
  {
    id: 'motion.panel.wipe-out',
    source: 'motion-tokens',
    reference: `${PANEL_TOKENS}; position from ${PANEL_PROTOTYPE} (follows wipe in)`,
    expected: 'wipe out: 0.45 s, expo.out, no stagger, at 0.28, origin switched to right at 0.28',
  },
  {
    id: 'motion.panel.tag',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'tag: 0.4 s, expo.out, no stagger, at 0.3',
  },
  {
    id: 'motion.panel.title-chars',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'title chars: 0.7 s, expo.out, stagger 0.018, at 0.32',
  },
  {
    id: 'motion.panel.lede',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'lede: 0.5 s, power3.out, stagger 0.08, at 0.5',
  },
  {
    id: 'motion.panel.items',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'items: 0.45 s, power3.out, stagger 0.05, at 0.6',
  },
  {
    id: 'motion.panel.stats',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'stats: 0.5 s, back.out(1.8), stagger 0.07, at 0.62',
  },
  {
    id: 'motion.panel.chips',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'chips: 0.35 s, back.out(2.6), stagger 0.022, at 0.75',
  },
  {
    id: 'motion.panel.result',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'result: 0.6 s, expo.out, no stagger, at 0.85',
  },
  {
    id: 'motion.panel.number-roll',
    source: 'motion-tokens',
    reference: PANEL_TOKENS,
    expected: 'number roll: 0.9 s, power3.out, starts at 0.7 + 0.08·i',
  },
  {
    id: 'motion.panel.from-states',
    source: 'prototype',
    reference: PANEL_PROTOTYPE,
    expected:
      'steps in prototype order with its states: wipe scaleX 0→1 from left, origin right, scaleX→0; tag x −24 opacity 0; chars yPercent 115 rotate 8; lede y 14 opacity 0; items x −18 opacity 0; stats y 18 opacity 0; chips scale 0.4 opacity 0; result scaleX 0 from left',
  },
  {
    id: 'motion.panel.selectors',
    source: 'prototype',
    reference: `${PANEL_PROTOTYPE} selectors, renamed to the data-motion contract (wipe, tag, title, lede, item, stat, stat-value, chip, result)`,
    expected: 'every panel target is selected by [data-motion="<name>"] with the contract name',
  },
  {
    id: 'motion.panel.transform-opacity-only',
    source: 'motion-tokens',
    reference: 'rules/motion.md §3 «Animate only transform and opacity» and §6',
    expected:
      'every animated property of the panel and title-card steps is a transform component, transformOrigin or opacity',
  },
  {
    id: 'motion.title-card.card-shown',
    source: 'prototype',
    reference: TITLE_CARD,
    expected: 'the card is set to opacity 1 at 0',
  },
  {
    id: 'motion.title-card.line-in',
    source: 'prototype',
    reference: TITLE_CARD,
    expected: 'line scaleX 0→1, 0.5 s, expo.out, at 0',
  },
  {
    id: 'motion.title-card.kicker-in',
    source: 'prototype',
    reference: TITLE_CARD,
    expected: 'kicker y 20 opacity 0 → y 0 opacity 1, 0.4 s, expo.out, at 0.08',
  },
  {
    id: 'motion.title-card.chars-in',
    source: 'prototype',
    reference: TITLE_CARD,
    expected: 'chars yPercent 120 skewX −18 → 0 0, 0.65 s, expo.out, stagger 0.025, at 0.1',
  },
  {
    id: 'motion.title-card.chars-out',
    source: 'prototype',
    reference: TITLE_CARD,
    expected: 'chars to yPercent −120, 0.45 s, power3.in, stagger 0.015, at 1.35',
  },
  {
    id: 'motion.title-card.line-out',
    source: 'prototype',
    reference: TITLE_CARD,
    expected: 'line to scaleX 0 from left, 0.4 s, power3.in, at 1.4',
  },
  {
    id: 'motion.title-card.kicker-out',
    source: 'gsap-docs',
    reference: `${TITLE_CARD}; the prototype names no ease, GSAP's default is power1.out (https://gsap.com/docs/v3/GSAP/gsap.defaults())`,
    expected: 'kicker to opacity 0, 0.3 s, power1.out, at 1.4',
  },
  {
    id: 'motion.magnet.tokens',
    source: 'motion-tokens',
    reference: 'rules/motion.md §1 «Magnet»',
    expected: 'magnet: 0.4 s, power3.out, factors 0.3 (x) and 0.4 (y)',
  },
  {
    id: 'motion.magnet.offset',
    source: 'prototype',
    reference: MAGNET,
    expected:
      'rect left 100 top 50 width 80 height 40, pointer (150, 60) → offset x 3, y −4 (distance from the centre × factor)',
  },
  {
    id: 'motion.magnet.enabled',
    source: 'prototype',
    reference: `${MAGNET} (pointer: fine and motion allowed)`,
    expected: 'with no-preference and a fine pointer the magnet is enabled',
  },
  {
    id: 'motion.magnet.disabled.reduced',
    source: 'spec',
    reference: `${REDUCED} (no button magnet effect)`,
    expected: 'with reduce and a fine pointer the magnet is disabled',
  },
  {
    id: 'motion.magnet.disabled.coarse',
    source: 'prototype',
    reference: `${MAGNET} (pointer: fine only)`,
    expected: 'with no-preference and a coarse pointer the magnet is disabled',
  },
  {
    id: 'motion.scene.intro',
    source: 'motion-tokens',
    reference: SCENE_TIMING,
    expected: 'intro 3200 ms',
  },
  {
    id: 'motion.scene.auto-dock',
    source: 'motion-tokens',
    reference: SCENE_TIMING,
    expected: 'auto-dock 2600 ms',
  },
  {
    id: 'motion.scene.ring',
    source: 'motion-tokens',
    reference: SCENE_TIMING,
    expected: 'ring 1.3 s',
  },
  {
    id: 'motion.scene.burst',
    source: 'motion-tokens',
    reference: SCENE_TIMING,
    expected: 'burst 1.4 s',
  },
  {
    id: 'motion.scene.flash-take-off',
    source: 'motion-tokens',
    reference: `${SCENE_TIMING}; meaning from docs/prototype/index.html:621 flash(strength, ms)`,
    expected: 'take-off flash: opacity 0.6, 900 ms',
  },
  {
    id: 'motion.scene.flash-send',
    source: 'motion-tokens',
    reference: `${SCENE_TIMING}; meaning from docs/prototype/index.html:621 flash(strength, ms)`,
    expected: 'send flash: opacity 0.5, 700 ms',
  },
  {
    id: 'motion.css.transitions',
    source: 'motion-tokens',
    reference:
      'rules/motion.md §1 «CSS transitions»; panel split from docs/prototype/index.html:79-82 (opacity 320, transform out 420, in 520)',
    expected:
      'base 140, panel opacity 320, panel out 420, panel in 520, loader 700, hint 400, nav layer 500 (ms)',
  },
  {
    id: 'motion.reduced.query',
    source: 'spec',
    reference: `${REDUCED}; Media Queries Level 5 §12.2 (no-preference | reduce)`,
    expected: 'motion is allowed by «(prefers-reduced-motion: no-preference)»',
  },
  {
    id: 'motion.reduced.reduce',
    source: 'spec',
    reference: REDUCED,
    expected: 'with reduce, prefersReducedMotion is true',
  },
  {
    id: 'motion.reduced.no-preference',
    source: 'spec',
    reference: REDUCED,
    expected: 'with no-preference, prefersReducedMotion is false',
  },
  {
    id: 'motion.reduced.no-window',
    source: 'spec',
    reference: `${REDUCED}; rules/motion.md §3 (hidden state only by JS when motion is allowed)`,
    expected: 'without window (server) prefersReducedMotion is true and the magnet is disabled',
  },
  {
    id: 'motion.roll.parse.suffix',
    source: 'prototype',
    reference: ROLL,
    expected: '«8+» → prefix «», value 8, suffix «+»',
  },
  {
    id: 'motion.roll.parse.prefix-suffix',
    source: 'prototype',
    reference: ROLL,
    expected: '«~40% faster» → prefix «~», value 40, suffix «% faster»',
  },
  {
    id: 'motion.roll.parse.no-digits',
    source: 'prototype',
    reference: ROLL,
    expected: '«Remote» → no roll target',
  },
  {
    id: 'motion.roll.format',
    source: 'prototype',
    reference: ROLL,
    expected: 'value 34.6 with prefix «~» and suffix «%» → «~35%» (rounded)',
  },
  {
    id: 'motion.roll.mid-value',
    source: 'gsap-docs',
    reference: `${ROLL}; ${GSAP_EASES}`,
    expected: '«80%» at half the roll (0.45 s after 0.7) shows «75%»',
  },
  {
    id: 'motion.roll.skip-non-numeric',
    source: 'prototype',
    reference: ROLL,
    expected: 'a holder without digits keeps its text and adds no tween',
  },
  {
    id: 'motion.roll.restore.complete',
    source: 'spec',
    reference: RESTORE,
    expected: '«007 days» reads «007 days» again when the timeline completes',
  },
  {
    id: 'motion.roll.restore.revert',
    source: 'spec',
    reference: RESTORE,
    expected: 'a timeline reverted mid-roll leaves the original text',
  },
  {
    id: 'motion.roll.restore.kill',
    source: 'spec',
    reference: RESTORE,
    expected: 'a timeline killed mid-roll leaves the original text',
  },
  {
    id: 'motion.roll.restore.context',
    source: 'spec',
    reference: `${RESTORE}; useGSAP cleanup reverts its gsap.context`,
    expected: 'reverting the owning gsap.context mid-roll leaves the original text',
  },
  {
    id: 'motion.roll.settle-once',
    source: 'spec',
    reference: RESTORE,
    expected: 'completion followed by revert runs the cleanup once',
  },
] as const satisfies readonly MotionCase[];

export type MotionCaseId = (typeof MOTION_CASES)[number]['id'];
