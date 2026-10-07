export type FlightInputCaseSource = 'spec' | 'prototype' | 'owner-2026-10-07';

export type FlightInputCase = Readonly<{
  id: string;
  source: FlightInputCaseSource;
  reference: string;
  expected: string;
}>;

const KEYS = 'spec FR-009–FR-012; prototype :400–417; owner 2026-10-07 (keyboard is primary)';
const STICK = 'spec FR-010, FR-011; prototype :425–452';

export const FLIGHT_INPUT_CASES = [
  {
    id: 'input.key.steer',
    source: 'prototype',
    reference: `${KEYS}; steer.ts maps the codes`,
    expected:
      'W/ArrowUp climb, A/ArrowLeft turn left, S and D the opposites, Shift boosts; keyup releases each',
  },
  {
    id: 'input.key.prevent',
    source: 'prototype',
    reference: `${KEYS}; :409–415`,
    expected:
      'a flight key on the page is default-prevented; inside a station panel or menu it is not; Shift is never prevented',
  },
  {
    id: 'input.key.editable',
    source: 'spec',
    reference: `${KEYS}; keys typed into form fields are not flight input`,
    expected:
      'keydown on input, textarea, select and contenteditable steers nothing, is not prevented and is not a first input',
  },
  {
    id: 'input.key.modifiers',
    source: 'prototype',
    reference: `${KEYS}; :408`,
    expected: 'Ctrl, Meta or Alt held makes a flight key ignored, so browser shortcuts survive',
  },
  {
    id: 'input.key.enabled',
    source: 'owner-2026-10-07',
    reference: 'plan §5.5 setEnabled; prototype :408 (state.started)',
    expected:
      'keys and the stick are ignored until enabled; disabling releases held keys, boost and the stick',
  },
  {
    id: 'input.key.blur',
    source: 'prototype',
    reference: `${KEYS}; :418`,
    expected: 'window blur releases held keys and boost',
  },
  {
    id: 'input.boost',
    source: 'spec',
    reference: 'spec FR-012 (Boost button on touch); plan §5.5 setBoostHeld',
    expected: 'setBoostHeld(true) boosts and false stops it',
  },
  {
    id: 'input.first',
    source: 'spec',
    reference: 'spec FR-015 (first input hides the hint); prototype :396',
    expected:
      'onFirstInput fires once for the first flight key or stick press; Shift alone and ignored keys do not count',
  },
  {
    id: 'input.first-stick',
    source: 'spec',
    reference: 'spec FR-015; prototype :431–438 (noteInput on press)',
    expected:
      'a primary-button or touch press on the canvas counts as the first input, once; a right-button press does not',
  },
  {
    id: 'input.mouse-hover',
    source: 'owner-2026-10-07',
    reference: 'owner decision: the mouse steers only while dragging',
    expected: 'mouse movement without a press steers nothing and is not a first input',
  },
  {
    id: 'stick.press',
    source: 'prototype',
    reference: `${STICK}; :431–438`,
    expected:
      'a press shows the stick centred on the press point, the knob at rest, steer still zero',
  },
  {
    id: 'stick.clamp',
    source: 'prototype',
    reference: `${STICK}; :440–448`,
    expected:
      'dragging beyond 56 px clamps the knob to the ring; full right is turn −1, full up is climb +1',
  },
  {
    id: 'stick.release',
    source: 'prototype',
    reference: `${STICK}; :449–453`,
    expected: 'pointerup and pointercancel hide the stick and zero the steer',
  },
  {
    id: 'stick.buttons',
    source: 'prototype',
    reference: `${STICK}; :426`,
    expected:
      'a right or middle mouse press is ignored; a second pointer is ignored while one is active',
  },
  {
    id: 'stick.capture-fallback',
    source: 'spec',
    reference: 'plan S16 review focus (pointer capture errors need a fallback)',
    expected:
      'when pointer capture is refused the drag still steers and ends from events on the window',
  },
  {
    id: 'stick.no-redundant-writes',
    source: 'spec',
    reference: 'plan S16 review focus (DOM writes when nothing changed)',
    expected: 'a move to the same clamped position writes nothing to the knob',
  },
  {
    id: 'input.dispose',
    source: 'spec',
    reference: 'plan S16 review focus (listeners left after dispose)',
    expected:
      'every listener added is removed with the same function; afterwards keys and presses do nothing',
  },
] as const satisfies readonly FlightInputCase[];

export type FlightInputCaseId = (typeof FLIGHT_INPUT_CASES)[number]['id'];
