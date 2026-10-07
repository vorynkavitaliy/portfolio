export type HudCaseSource = 'spec' | 'owner-2026-10-07' | 'prototype' | 'apg';

export type HudCase = Readonly<{
  id: string;
  source: HudCaseSource;
  reference: string;
  expected: string;
}>;

const KEYS =
  'spec FR-025 (Space when focus is not in a field or on a button; Esc closes an open menu first, otherwise takes off); prototype :583–590';

const MENUS = 'spec FR-031, FR-035; plan 0002 §9 S22 (AutopilotMenu, RoadMap)';

const MOTION = 'spec FR-039 (reduced motion: no flash, no title-card animation, no panel entrance)';

export const HUD_CASES = [
  {
    id: 'hud.gate.running',
    source: 'spec',
    reference:
      'plan 0002 §4.3 (HUD controls exist only while the world runs); §4.1 (hud/** world view only)',
    expected:
      'nothing rendered while loading, ready or in the text view; rendered once the world runs',
  },
  {
    id: 'hud.bar.cells',
    source: 'prototype',
    reference:
      'docs/prototype/index.html:560–568 (one cell per station, aria-label «Autopilot to <label>»); plan 0002 §5.9 (button[data-station-cell])',
    expected:
      'nine cells in station order, each with the aria-label from the template and the station label; the group is labelled «Stations, autopilot»',
  },
  {
    id: 'hud.bar.current',
    source: 'spec',
    reference:
      'FR-027 (the current station is outlined); plan 0002 §5.9 (aria-current="true" on the docked cell)',
    expected:
      'no cell current while flying; only the docked station’s cell has aria-current="true"',
  },
  {
    id: 'hud.bar.counter',
    source: 'spec',
    reference: 'FR-027 («Linked n/9» counts distinct visited stations)',
    expected:
      '«Linked 0/9» at start; «Linked 3/9» after three distinct visits; a repeated visit does not change it',
  },
  {
    id: 'hud.bar.click',
    source: 'spec',
    reference: 'FR-031 (bottom bar cells fly the plane to the station)',
    expected: 'clicking a cell sends one autopilot command for that station',
  },
  {
    id: 'hud.menu.items',
    source: 'spec',
    reference: `${MENUS}; prototype :569–578 (title «Autopilot to…», index or ✓ per item)`,
    expected:
      '#autopilot-menu has role menu, hidden while closed; nine menuitems in order; visited ones carry «Visited» and ✓, unvisited show the two-digit index',
  },
  {
    id: 'hud.menu.focus-open',
    source: 'apg',
    reference:
      'APG menu button pattern (focus moves to the first item when the menu opens); spec FR-035',
    expected:
      'opening the autopilot menu focuses its first item; the road map dialog takes focus when it opens',
  },
  {
    id: 'hud.menu.arrows',
    source: 'apg',
    reference: 'APG menu pattern (Down/Up/Home/End move between items and wrap)',
    expected:
      'ArrowDown moves to the next item and wraps to the first; ArrowUp wraps to the last; End and Home jump',
  },
  {
    id: 'hud.menu.choose',
    source: 'prototype',
    reference: 'docs/prototype/index.html:575 (choose → autopilot + close); spec FR-031',
    expected:
      'choosing an item sends one autopilot command and closes the menu, focus returns to its header button',
  },
  {
    id: 'hud.menu.escape',
    source: 'apg',
    reference: 'spec FR-035 (menus close with Esc); APG (focus returns to the invoking button)',
    expected: 'Esc closes the open menu, focus is back on its header trigger, no take-off is sent',
  },
  {
    id: 'hud.menu.escape-order',
    source: 'spec',
    reference: KEYS,
    expected:
      'docked with a menu open: first Esc closes the menu and sends no take-off; second Esc sends one take-off',
  },
  {
    id: 'hud.menu.single',
    source: 'prototype',
    reference: 'docs/prototype/index.html:584–591 (toggleMenu closes the other menu)',
    expected: 'opening the road map hides the autopilot menu; exactly one of the two is visible',
  },
  {
    id: 'hud.map.canvas',
    source: 'owner-2026-10-07',
    reference:
      'plan 0002 §9 S22 and integration notes S16 (128×128 canvas, scaled by CSS with image-rendering: pixelated)',
    expected:
      'canvas width and height 128, computed image-rendering pixelated, caption «Click a station to autopilot there.»',
  },
  {
    id: 'hud.map.draw',
    source: 'spec',
    reference: 'FR-033 (refreshes while open); plan 0002 §6.3 MAP_REFRESH_MS 200',
    expected:
      'drawMap called with the canvas on open, again every 200 ms while open, never while closed, and stops after closing',
  },
  {
    id: 'hud.map.click',
    source: 'spec',
    reference:
      'FR-033 (click within 14 blocks starts autopilot and closes; elsewhere nothing); plan 0002 §5.5 stationAtMap(u, v)',
    expected:
      'a click maps to normalised (u, v) of the canvas box; a hit sends autopilot for that station and closes the map; a miss sends nothing and keeps the map open',
  },
  {
    id: 'hud.keys.space',
    source: 'spec',
    reference: KEYS,
    expected:
      'Space while docked with focus on body sends one take-off and prevents the default scroll',
  },
  {
    id: 'hud.keys.space-exceptions',
    source: 'spec',
    reference: KEYS,
    expected:
      'Space sends nothing when flying, when focus is in a text field, or when focus is on a button',
  },
  {
    id: 'hud.keys.esc-take-off',
    source: 'spec',
    reference: KEYS,
    expected:
      'Esc while docked and no menu open sends one take-off; Esc while flying sends nothing',
  },
  {
    id: 'hud.keys.other-keys',
    source: 'owner-2026-10-07',
    reference:
      'integration notes (any key while docked does not undock); spec FR-025 (take-off only explicit)',
    expected: 'W, ArrowUp, Enter, Shift and a letter while docked send no take-off',
  },
  {
    id: 'hud.hint.keyboard',
    source: 'spec',
    reference: 'FR-015; prototype :388, :595–597',
    expected: 'flying on a fine pointer shows the keyboard text, visible',
  },
  {
    id: 'hud.hint.touch',
    source: 'spec',
    reference: 'FR-015 (a different text on touch devices); prototype :388',
    expected: 'flying on a coarse pointer shows «Drag to steer. Fly into a beam to connect.»',
  },
  {
    id: 'hud.hint.hidden-after-input',
    source: 'spec',
    reference: 'FR-015 (shown until the first flight input); prototype :393, :597',
    expected:
      'after the first input the hint is not visible; after take-off with no input it is visible again',
  },
  {
    id: 'hud.hint.docked',
    source: 'spec',
    reference: 'FR-015, FR-025 (the hint returns on take-off); prototype :596',
    expected: 'docked shows the docked keyboard or touch text and stays visible even after input',
  },
  {
    id: 'hud.boost.hold',
    source: 'spec',
    reference:
      'FR-012 (the plane boosts while the button is held); integration notes S16 (Boost → setBoostHeld)',
    expected:
      'pointerdown sends boost held true; pointerup, pointercancel and pointerleave send held false',
  },
  {
    id: 'hud.boost.release-on-dock',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §9 S22 review focus (no stuck input)',
    expected: 'docking while the button is held releases boost and removes the button',
  },
  {
    id: 'hud.boost.touch-only',
    source: 'spec',
    reference: 'FR-012 (touch devices only); plan 0002 §9 S22 (coarse pointers only)',
    expected: 'on this fine-pointer run the button exists but is not displayed',
  },
  {
    id: 'hud.announcer',
    source: 'spec',
    reference: 'FR-028 (polite live region announces the docked station)',
    expected: 'role status, aria-live polite; empty while flying; «Docked at <label>.» when docked',
  },
  {
    id: 'hud.title.dock',
    source: 'spec',
    reference: 'FR-023; plan 0002 §9 S22 (TitleCard aria-hidden, plays on dock)',
    expected:
      'card is aria-hidden and hidden; on each dock playTitleCard runs once with the card elements, tag «Link established · <tag>» and the station label; nothing while flying',
  },
  {
    id: 'hud.title.reduced',
    source: 'spec',
    reference: MOTION,
    expected: 'with reduced motion in effect the card stays hidden after a dock',
  },
  {
    id: 'hud.flash.reduced',
    source: 'spec',
    reference: MOTION,
    expected:
      'with reduced motion in effect the take-off flash leaves opacity at 0 and sets no transition',
  },
  {
    id: 'hud.flash.take-off',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 §6.3 (flash take-off 0.6 / 900 ms); docs/prototype/index.html:625',
    expected:
      'with motion allowed the flash starts at opacity 0.6 and fades with «opacity 900ms ease-out»',
  },
  {
    id: 'hud.flash.send',
    source: 'owner-2026-10-07',
    reference:
      'plan 0002 §6.3 (flash send 0.5 / 700 ms); spec FR-038; docs/prototype/index.html:625',
    expected: 'a send flash starts at opacity 0.5 and fades with «opacity 700ms ease-out»',
  },
  {
    id: 'hud.panel-motion',
    source: 'spec',
    reference:
      'FR-023 (staged panel entrance on docking); plan 0002 §9 S22 (PanelMotion scoped to the docked section)',
    expected:
      'playPanelEntrance runs once per dock with the docked section element; not while flying; again for another station',
  },
  {
    id: 'hud.magnet',
    source: 'owner-2026-10-07',
    reference:
      'plan 0002 §5.9 ([data-magnet]); §9 S22 (Magnet); spec FR-039 (no magnet under reduced motion, in motion module)',
    expected:
      'every [data-magnet] element gets one attachMagnet on mount; every detach runs on unmount',
  },
  {
    id: 'hud.slow',
    source: 'owner-2026-10-07',
    reference: 'plan 0002 D-22 and Q-16 B; spec FR-040',
    expected:
      'no prompt until slow; then the prompt text with «Open text version» (switches to the text view, one text_version_opened event) and «Keep flying» (hides it)',
  },
  {
    id: 'hud.lazy.gsap',
    source: 'spec',
    reference:
      'plan 0002 §4.1 (hud/** is the lazy chunk with GSAP); plan 0002 §8 (GSAP stays out of first load)',
    expected:
      'no first-load world file imports the HUD statically or imports gsap or @/motion; the shell reaches the HUD only through a dynamic import',
  },
] as const satisfies readonly HudCase[];

export type HudCaseId = (typeof HUD_CASES)[number]['id'];
