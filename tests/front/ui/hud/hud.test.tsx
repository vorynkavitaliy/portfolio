/// <reference types="vite/client" />

import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/hud/hud.case-test';
import bootSource from '@/sections/world/boot.ts?raw';
import headerSource from '@/sections/world/header-controls.client.tsx?raw';
import loaderSource from '@/sections/world/loader.client.tsx?raw';
import noticeSource from '@/sections/world/notice.client.tsx?raw';
import shellSource from '@/sections/world/world-shell.client.tsx?raw';
import stationFrameSource from '@/sections/world/station-frame.client.tsx?raw';
import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';
import { ANALYTICS_EVENT } from '@/core/analytics/analytics';
import { STATION_IDS } from '@/core/world/stations';
import { addVisited, setFlight, setMenu } from '@/core/world/world-actions';
import { INITIAL_WORLD, worldStore } from '@/core/world/world-store';
import { attachMagnet } from '@/motion/magnet';
import { playPanelEntrance } from '@/motion/panel-entrance';
import { prefersReducedMotion } from '@/motion/reduced-motion';
import { playTitleCard } from '@/motion/title-card';
import { HeaderControls } from '@/sections/world/header-controls.client';
import { StationFrame } from '@/sections/world/station-frame.client';
import { WorldHud } from '@/sections/world/hud/world-hud.client';

import type * as TitleCardModule from '@/motion/title-card';
import type * as PanelEntranceModule from '@/motion/panel-entrance';
import type * as MagnetModule from '@/motion/magnet';
import type * as ReducedMotionModule from '@/motion/reduced-motion';
import type { StationId } from '@/core/world/stations';
import type {
  FlightPhase,
  WorldCommand,
  WorldController,
  WorldSnapshot,
} from '@/core/world/world.types';

vi.mock('@/motion/title-card', async (importOriginal) => {
  const actual = await importOriginal<typeof TitleCardModule>();

  return { ...actual, playTitleCard: vi.fn(actual.playTitleCard) };
});

vi.mock('@/motion/panel-entrance', async (importOriginal) => {
  const actual = await importOriginal<typeof PanelEntranceModule>();

  return { ...actual, playPanelEntrance: vi.fn(actual.playPanelEntrance) };
});

vi.mock('@/motion/magnet', async (importOriginal) => {
  const actual = await importOriginal<typeof MagnetModule>();

  return { ...actual, attachMagnet: vi.fn(actual.attachMagnet) };
});

vi.mock('@/motion/reduced-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof ReducedMotionModule>();

  return { ...actual, prefersReducedMotion: vi.fn(actual.prefersReducedMotion) };
});

const COARSE_QUERY = '(pointer: coarse)';

const TAKE_OFF_LABEL = { label: WORLD_COPY.panel.takeOff, keyHint: WORLD_COPY.panel.takeOffKey };

const controller = {
  handle: vi.fn<(command: WorldCommand) => void>(),
  drawMap: vi.fn<(canvas: HTMLCanvasElement) => void>(),
  stationAtMap: vi.fn<WorldController['stationAtMap']>(),
};

let events: unknown[];

const recordEvent = (event: Event): void => {
  if (event instanceof CustomEvent) {
    events.push(event.detail);
  }
};

const setState = (change: (state: WorldSnapshot) => WorldSnapshot): void => {
  worldStore.update(change);
};

const state = (): WorldSnapshot => {
  return worldStore.getSnapshot();
};

const goRunning = (flight: FlightPhase = { mode: 'free' }): void => {
  setState((current) => {
    return { ...current, view: 'world', boot: { status: 'running' }, flight };
  });
};

const dock = (station: StationId): void => {
  setState((current) => {
    return setFlight(current, { mode: 'docked', station });
  });
};

const fly = (): void => {
  setState((current) => {
    return setFlight(current, { mode: 'free' });
  });
};

const openMenu = (menu: 'autopilot' | 'map' | 'none'): void => {
  setState((current) => {
    return setMenu(current, menu);
  });
};

const commands = (): WorldCommand[] => {
  return controller.handle.mock.calls.map((call) => {
    return call[0];
  });
};

const takeOffs = (): number => {
  return commands().filter((command) => {
    return command.type === 'take-off';
  }).length;
};

const stubCoarsePointer = (coarse: boolean): void => {
  const real = window.matchMedia.bind(window);

  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const list: MediaQueryList = real(query);

    if (query === COARSE_QUERY) {
      Object.defineProperty(list, 'matches', {
        configurable: true,
        get: () => {
          return coarse;
        },
      });
    }

    return list;
  });
};

const frames = async (count: number): Promise<void> => {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
};

const find = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`missing ${selector}`);
  }

  return element;
};

const isDisplayed = (element: Element | null): boolean => {
  return element !== null && getComputedStyle(element).display !== 'none';
};

const menuTrigger = (menu: 'autopilot' | 'map'): HTMLElement => {
  return find<HTMLElement>(
    menu === 'autopilot' ? '[aria-controls="autopilot-menu"]' : '[aria-controls="road-map"]',
  );
};

const menuItems = (): HTMLElement[] => {
  return [...document.querySelectorAll<HTMLElement>('#autopilot-menu [role="menuitem"]')];
};

const blurAll = (): void => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

const hint = (): HTMLElement => {
  return find<HTMLElement>('[data-hint]');
};

const harness = (): ReactNode => {
  return (
    <>
      <header>
        <HeaderControls copy={WORLD_COPY.header} />
      </header>

      <button type="button">other</button>

      <input aria-label="field" />

      <StationFrame station="systems" takeOff={TAKE_OFF_LABEL}>
        <h2 id="systems-title">Systems</h2>
      </StationFrame>

      <StationFrame station="contact" takeOff={TAKE_OFF_LABEL}>
        <h2 id="contact-title">Contact</h2>
      </StationFrame>

      <WorldHud />
    </>
  );
};

const renderHud = async () => {
  const screen = await render(harness());

  goRunning();

  await expect
    .poll(() => {
      return document.querySelectorAll('[data-station-cell]').length;
    })
    .toBe(9);

  return screen;
};

beforeEach(() => {
  events = [];
  controller.handle.mockReset();
  controller.drawMap.mockReset();
  controller.stationAtMap.mockReset();
  controller.stationAtMap.mockReturnValue(null);
  vi.mocked(playTitleCard).mockClear();
  vi.mocked(playPanelEntrance).mockClear();
  vi.mocked(attachMagnet).mockReset();
  vi.mocked(prefersReducedMotion).mockReset();
  worldStore.setController(controller);
  window.addEventListener(ANALYTICS_EVENT, recordEvent);
});

afterEach(() => {
  window.removeEventListener(ANALYTICS_EVENT, recordEvent);
  vi.useRealTimers();
  vi.restoreAllMocks();
  worldStore.setController(null);
  blurAll();

  setState(() => {
    return INITIAL_WORLD;
  });
});

caseTest('hud.gate.running', 'HUD renders only while the world runs', async () => {
  await render(harness());
  expect(document.querySelectorAll('[data-station-cell]')).toHaveLength(0);

  setState((current) => {
    return { ...current, view: 'world', boot: { status: 'ready' } };
  });

  await frames(2);
  expect(document.querySelectorAll('[data-station-cell]')).toHaveLength(0);

  goRunning();

  await expect
    .poll(() => {
      return document.querySelectorAll('[data-station-cell]').length;
    })
    .toBe(9);

  setState((current) => {
    return { ...current, view: 'text' };
  });

  await expect
    .poll(() => {
      return document.querySelectorAll('[data-station-cell]').length;
    })
    .toBe(0);
});

caseTest('hud.bar.cells', 'nine labelled cells in station order', async () => {
  await renderHud();

  const cells = [...document.querySelectorAll<HTMLElement>('[data-station-cell]')];

  expect(
    cells.map((cell) => {
      return cell.dataset['stationCell'];
    }),
  ).toEqual([...STATION_IDS]);

  expect(
    cells.map((cell) => {
      return cell.getAttribute('aria-label');
    }),
  ).toEqual(
    STATION_IDS.map((id) => {
      return `Autopilot to ${STATIONS_COPY[id].label}`;
    }),
  );

  expect(find('[role="group"]').getAttribute('aria-label')).toBe('Stations, autopilot');
});

caseTest('hud.bar.current', 'aria-current only on the docked cell', async () => {
  await renderHud();
  expect(document.querySelectorAll('[data-station-cell][aria-current]')).toHaveLength(0);

  dock('ai');

  await expect
    .poll(() => {
      return document
        .querySelector('[data-station-cell][aria-current="true"]')
        ?.getAttribute('data-station-cell');
    })
    .toBe('ai');

  expect(document.querySelectorAll('[data-station-cell][aria-current]')).toHaveLength(1);

  fly();

  await expect
    .poll(() => {
      return document.querySelectorAll('[data-station-cell][aria-current]').length;
    })
    .toBe(0);
});

caseTest('hud.bar.counter', 'Linked n/9 counts distinct visits', async () => {
  const screen = await renderHud();

  await expect.element(screen.getByText('Linked 0/9')).toBeVisible();

  for (const id of ['home-base', 'systems', 'contact', 'systems'] as const) {
    setState((current) => {
      return addVisited(current, id);
    });
  }

  await expect.element(screen.getByText('Linked 3/9')).toBeVisible();
});

caseTest('hud.bar.click', 'a cell sends autopilot for its station', async () => {
  const screen = await renderHud();

  await screen.getByRole('button', { name: 'Autopilot to Systems' }).click();

  expect(commands()).toEqual([{ type: 'autopilot', station: 'systems' }]);
});

caseTest('hud.menu.items', 'role menu with nine items and visited marks', async () => {
  await renderHud();

  const menu = find<HTMLElement>('#autopilot-menu');

  expect(menu.getAttribute('role')).toBe('menu');
  expect(menu.hidden).toBe(true);
  expect(menuItems()).toHaveLength(9);

  setState((current) => {
    return addVisited(current, 'full-cycle');
  });

  openMenu('autopilot');

  await expect
    .poll(() => {
      return menu.hidden;
    })
    .toBe(false);

  const items = menuItems();

  expect(
    items.map((item) => {
      return item.dataset['menuStation'];
    }),
  ).toEqual([...STATION_IDS]);

  expect(items[0]?.textContent).toContain('Home base');
  expect(items[0]?.textContent).toContain('00');
  expect(items[1]?.textContent).toContain('✓');
  expect(items[1]?.textContent).toContain('Visited');
  expect(items[1]?.textContent).not.toContain('01');
  expect(items[0]?.textContent).not.toContain('Visited');
});

caseTest('hud.menu.focus-open', 'focus moves into the opened menu', async () => {
  const screen = await renderHud();

  await screen.getByRole('button', { name: 'Autopilot', exact: true }).click();

  await expect
    .poll(() => {
      return document.activeElement;
    })
    .toBe(menuItems()[0]);

  await screen.getByRole('button', { name: 'Road map', exact: true }).click();

  await expect
    .poll(() => {
      return document.activeElement;
    })
    .toBe(find('#road-map'));
});

caseTest('hud.menu.arrows', 'arrow keys move and wrap', async () => {
  await renderHud();
  openMenu('autopilot');

  await expect
    .poll(() => {
      return document.activeElement;
    })
    .toBe(menuItems()[0]);

  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(menuItems()[1]);

  await userEvent.keyboard('{ArrowUp}{ArrowUp}');
  expect(document.activeElement).toBe(menuItems()[8]);

  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(menuItems()[0]);

  await userEvent.keyboard('{End}');
  expect(document.activeElement).toBe(menuItems()[8]);

  await userEvent.keyboard('{Home}');
  expect(document.activeElement).toBe(menuItems()[0]);
});

caseTest('hud.menu.choose', 'choosing flies there, closes, returns focus', async () => {
  const screen = await renderHud();

  await screen.getByRole('button', { name: 'Autopilot', exact: true }).click();

  await expect
    .poll(() => {
      return document.activeElement;
    })
    .toBe(menuItems()[0]);

  await screen.getByRole('menuitem', { name: /Full cycle/ }).click();

  expect(commands()).toEqual([{ type: 'autopilot', station: 'full-cycle' }]);
  expect(state().menu).toBe('none');

  await expect
    .poll(() => {
      return document.activeElement;
    })
    .toBe(menuTrigger('autopilot'));
});

caseTest('hud.menu.escape', 'Esc closes the menu and returns focus', async () => {
  const screen = await renderHud();

  for (const menu of ['autopilot', 'map'] as const) {
    await screen
      .getByRole('button', { name: menu === 'autopilot' ? 'Autopilot' : 'Road map', exact: true })
      .click();

    expect(state().menu).toBe(menu);

    await expect
      .poll(() => {
        return menuTrigger(menu).getAttribute('aria-expanded');
      })
      .toBe('true');

    await expect
      .poll(() => {
        return document.activeElement;
      })
      .not.toBe(menuTrigger(menu));

    await userEvent.keyboard('{Escape}');

    expect(state().menu).toBe('none');

    await expect
      .poll(() => {
        return document.activeElement;
      })
      .toBe(menuTrigger(menu));

    expect(menuTrigger(menu).getAttribute('aria-expanded')).toBe('false');
  }

  expect(takeOffs()).toBe(0);
});

caseTest('hud.menu.escape-order', 'menu first, then take-off', async () => {
  await renderHud();
  dock('systems');
  openMenu('autopilot');

  await expect
    .poll(() => {
      return document.activeElement;
    })
    .toBe(menuItems()[0]);

  await userEvent.keyboard('{Escape}');

  expect(state().menu).toBe('none');
  expect(takeOffs()).toBe(0);

  await userEvent.keyboard('{Escape}');

  expect(takeOffs()).toBe(1);
});

caseTest('hud.menu.single', 'only one menu is open', async () => {
  await renderHud();
  openMenu('autopilot');

  await expect
    .poll(() => {
      return isDisplayed(find('#autopilot-menu'));
    })
    .toBe(true);

  openMenu('map');

  await expect
    .poll(() => {
      return isDisplayed(find('#road-map'));
    })
    .toBe(true);

  expect(isDisplayed(find('#autopilot-menu'))).toBe(false);
});

caseTest('hud.map.canvas', '128 square, pixelated, with caption', async () => {
  const screen = await renderHud();

  openMenu('map');

  await expect
    .poll(() => {
      return isDisplayed(find('#road-map'));
    })
    .toBe(true);

  const canvas = find<HTMLCanvasElement>('#road-map canvas');

  expect(canvas.width).toBe(128);
  expect(canvas.height).toBe(128);
  expect(getComputedStyle(canvas).imageRendering).toBe('pixelated');
  await expect.element(screen.getByText('Click a station to autopilot there.')).toBeVisible();
});

caseTest('hud.map.draw', 'redraws every 200 ms while open only', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  await renderHud();

  expect(controller.drawMap).not.toHaveBeenCalled();

  openMenu('map');

  await expect
    .poll(() => {
      return controller.drawMap.mock.calls.length;
    })
    .toBe(1);

  expect(controller.drawMap.mock.calls[0]?.[0]).toBe(find('#road-map canvas'));

  await vi.advanceTimersByTimeAsync(450);
  expect(controller.drawMap).toHaveBeenCalledTimes(3);

  openMenu('none');
  await frames(2);
  await vi.advanceTimersByTimeAsync(1000);
  expect(controller.drawMap).toHaveBeenCalledTimes(3);
});

caseTest('hud.map.click', 'click maps to u, v; hit flies and closes', async () => {
  await renderHud();
  openMenu('map');

  await expect
    .poll(() => {
      return isDisplayed(find('#road-map'));
    })
    .toBe(true);

  const canvas = find<HTMLCanvasElement>('#road-map canvas');
  const rect = canvas.getBoundingClientRect();

  const clickAt = (u: number, v: number): void => {
    canvas.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: rect.left + u * rect.width,
        clientY: rect.top + v * rect.height,
      }),
    );
  };

  clickAt(0.25, 0.75);

  const point = controller.stationAtMap.mock.calls[0]?.[0];

  expect(point?.u).toBeCloseTo(0.25, 6);
  expect(point?.v).toBeCloseTo(0.75, 6);
  expect(commands()).toEqual([]);
  expect(state().menu).toBe('map');

  controller.stationAtMap.mockReturnValue('systems');
  clickAt(0.5, 0.5);

  expect(commands()).toEqual([{ type: 'autopilot', station: 'systems' }]);
  expect(state().menu).toBe('none');
});

caseTest('hud.keys.space', 'Space takes off when docked', async () => {
  await renderHud();
  dock('systems');
  blurAll();

  let prevented = false;

  window.addEventListener('keydown', (event) => {
    prevented = event.defaultPrevented;
  });

  await userEvent.keyboard(' ');

  expect(takeOffs()).toBe(1);
  expect(prevented).toBe(true);
});

caseTest('hud.keys.space-exceptions', 'Space ignored flying, in fields, on buttons', async () => {
  await renderHud();
  blurAll();

  await userEvent.keyboard(' ');
  expect(takeOffs()).toBe(0);

  dock('systems');

  find<HTMLInputElement>('input[aria-label="field"]').focus();
  await userEvent.keyboard(' ');
  expect(takeOffs()).toBe(0);

  const other = [...document.querySelectorAll('button')].find((button) => {
    return button.textContent === 'other';
  });

  other?.focus();
  expect(document.activeElement).toBe(other);
  await userEvent.keyboard(' ');
  expect(takeOffs()).toBe(0);
});

caseTest('hud.keys.esc-take-off', 'Esc takes off only when docked', async () => {
  await renderHud();
  blurAll();

  await userEvent.keyboard('{Escape}');
  expect(takeOffs()).toBe(0);

  dock('systems');
  await userEvent.keyboard('{Escape}');
  expect(takeOffs()).toBe(1);
});

caseTest('hud.keys.other-keys', 'other keys never undock', async () => {
  await renderHud();
  dock('systems');

  await expect
    .poll(() => {
      return document.querySelectorAll('[data-boost]').length;
    })
    .toBe(0);

  blurAll();

  controller.handle.mockClear();

  await userEvent.keyboard('w');
  await userEvent.keyboard('{ArrowUp}');
  await userEvent.keyboard('{Enter}');
  await userEvent.keyboard('{Shift}');
  await userEvent.keyboard('x');

  expect(takeOffs()).toBe(0);
  expect(commands()).toEqual([]);
});

caseTest('hud.hint.keyboard', 'keyboard text while flying', async () => {
  await renderHud();

  expect(hint().textContent).toBe(WORLD_COPY.hud.hints.keyboard);
  expect(hint().dataset['visible']).toBe('true');

  await expect
    .poll(() => {
      return getComputedStyle(hint()).opacity;
    })
    .toBe('1');
});

caseTest('hud.hint.touch', 'touch text on coarse pointers', async () => {
  stubCoarsePointer(true);
  await renderHud();

  expect(hint().textContent).toBe('Drag to steer. Fly into a beam to connect.');
});

caseTest('hud.hint.hidden-after-input', 'hidden after input, back with none', async () => {
  await renderHud();

  setState((current) => {
    return { ...current, inputUsed: true };
  });

  await expect
    .poll(() => {
      return hint().dataset['visible'];
    })
    .toBe('false');

  await expect
    .poll(() => {
      return getComputedStyle(hint()).opacity;
    })
    .toBe('0');

  setState((current) => {
    return { ...current, inputUsed: false };
  });

  await expect
    .poll(() => {
      return hint().dataset['visible'];
    })
    .toBe('true');
});

caseTest('hud.hint.docked', 'docked text, visible after input', async () => {
  await renderHud();

  setState((current) => {
    return { ...current, inputUsed: true };
  });

  dock('systems');

  await expect
    .poll(() => {
      return hint().textContent;
    })
    .toBe(WORLD_COPY.hud.hints.dockedKeyboard);

  expect(hint().dataset['visible']).toBe('true');
});

caseTest('hud.boost.hold', 'boost follows the press', async () => {
  await renderHud();

  const button = find<HTMLButtonElement>('[data-boost]');

  button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  expect(commands()).toEqual([{ type: 'boost', held: true }]);

  for (const type of ['pointerup', 'pointercancel', 'pointerout'] as const) {
    controller.handle.mockClear();
    button.dispatchEvent(new PointerEvent(type, { bubbles: true }));
    expect(commands()).toEqual([{ type: 'boost', held: false }]);
  }
});

caseTest('hud.boost.release-on-dock', 'docking releases a held boost', async () => {
  await renderHud();

  find('[data-boost]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  controller.handle.mockClear();

  dock('systems');

  await expect
    .poll(() => {
      return document.querySelectorAll('[data-boost]').length;
    })
    .toBe(0);

  expect(commands()).toEqual([{ type: 'boost', held: false }]);
});

caseTest('hud.boost.touch-only', 'not displayed on a fine pointer', async () => {
  await renderHud();

  expect(window.matchMedia(COARSE_QUERY).matches).toBe(false);
  expect(getComputedStyle(find('[data-boost]')).display).toBe('none');
});

caseTest('hud.announcer', 'polite status announces the dock', async () => {
  await renderHud();

  const announcer = find<HTMLElement>('[data-dock-announcer]');

  expect(announcer.getAttribute('role')).toBe('status');
  expect(announcer.getAttribute('aria-live')).toBe('polite');
  expect(announcer.textContent).toBe('');

  dock('deploy');

  await expect
    .poll(() => {
      return announcer.textContent;
    })
    .toBe('Docked at Deploy.');

  fly();

  await expect
    .poll(() => {
      return announcer.textContent;
    })
    .toBe('');
});

caseTest('hud.title.dock', 'title card plays once per dock', async () => {
  await renderHud();

  const card = find<HTMLElement>('[data-title-card]');

  expect(card.getAttribute('aria-hidden')).toBe('true');
  expect(card.hidden).toBe(true);
  expect(playTitleCard).not.toHaveBeenCalled();

  dock('systems');

  await expect
    .poll(() => {
      return vi.mocked(playTitleCard).mock.calls.length;
    })
    .toBe(1);

  const first = vi.mocked(playTitleCard).mock.calls[0]?.[0];

  expect(first?.card).toBe(card);
  expect(first?.tag.textContent).toBe(`Link established · ${STATIONS_COPY.systems.tag}`);
  expect(first?.title.textContent).toBe(STATIONS_COPY.systems.label);

  fly();
  await frames(2);
  expect(playTitleCard).toHaveBeenCalledTimes(1);

  dock('contact');

  await expect
    .poll(() => {
      return vi.mocked(playTitleCard).mock.calls.length;
    })
    .toBe(2);

  const second = vi.mocked(playTitleCard).mock.calls[1]?.[0];

  expect(second?.title.textContent).toBe(STATIONS_COPY.contact.label);
  expect(second?.tag.textContent).toBe(`Link established · ${STATIONS_COPY.contact.tag}`);
});

caseTest('hud.title.reduced', 'no title card under reduced motion', async () => {
  expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  await renderHud();

  dock('systems');

  await expect
    .poll(() => {
      return vi.mocked(playTitleCard).mock.calls.length;
    })
    .toBe(1);

  await frames(3);

  expect(find<HTMLElement>('[data-title-card]').hidden).toBe(true);
  expect(find<HTMLElement>('[data-title-card]').style.opacity).toBe('');
});

caseTest('hud.flash.reduced', 'no flash under reduced motion', async () => {
  expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  await renderHud();

  setState((current) => {
    return { ...current, flash: { seq: 1, kind: 'take-off' } };
  });

  await frames(3);

  const flash = find<HTMLElement>('[data-flash]');

  expect(flash.style.opacity).toBe('');
  expect(flash.style.transition).toBe('');
  expect(getComputedStyle(flash).opacity).toBe('0');
});

const flashSequence = async (kind: 'take-off' | 'send') => {
  vi.mocked(prefersReducedMotion).mockReturnValue(false);

  const pending: FrameRequestCallback[] = [];

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pending.push(callback);

    return pending.length;
  });

  await renderHud();

  setState((current) => {
    return { ...current, flash: { seq: 1, kind } };
  });

  await expect
    .poll(() => {
      return find<HTMLElement>('[data-flash]').style.opacity;
    })
    .not.toBe('');

  const flash = find<HTMLElement>('[data-flash]');
  const started = { opacity: flash.style.opacity, transition: flash.style.transition };

  for (const callback of pending.splice(0)) {
    callback(0);
  }

  return { started, ended: { opacity: flash.style.opacity, transition: flash.style.transition } };
};

caseTest('hud.flash.take-off', 'take-off flash 0.6 over 900 ms', async () => {
  const { started, ended } = await flashSequence('take-off');

  expect(started).toEqual({ opacity: '0.6', transition: 'none' });
  expect(ended).toEqual({ opacity: '0', transition: 'opacity 900ms ease-out' });
});

caseTest('hud.flash.send', 'send flash 0.5 over 700 ms', async () => {
  const { started, ended } = await flashSequence('send');

  expect(started).toEqual({ opacity: '0.5', transition: 'none' });
  expect(ended).toEqual({ opacity: '0', transition: 'opacity 700ms ease-out' });
});

caseTest('hud.panel-motion', 'entrance runs per dock on the docked section', async () => {
  await renderHud();
  expect(playPanelEntrance).not.toHaveBeenCalled();

  dock('systems');

  await expect
    .poll(() => {
      return vi.mocked(playPanelEntrance).mock.calls.length;
    })
    .toBe(1);

  expect(vi.mocked(playPanelEntrance).mock.calls[0]?.[0]).toBe(find('#systems'));

  fly();
  await frames(2);
  expect(playPanelEntrance).toHaveBeenCalledTimes(1);

  dock('contact');

  await expect
    .poll(() => {
      return vi.mocked(playPanelEntrance).mock.calls.length;
    })
    .toBe(2);

  expect(vi.mocked(playPanelEntrance).mock.calls[1]?.[0]).toBe(find('#contact'));
});

caseTest('hud.magnet', 'attached to every magnet element, detached on unmount', async () => {
  const detach = vi.fn<() => void>();

  vi.mocked(attachMagnet).mockReturnValue(detach);

  const screen = await renderHud();
  const magnets = document.querySelectorAll('[data-magnet]');

  expect(magnets.length).toBeGreaterThan(0);
  expect(attachMagnet).toHaveBeenCalledTimes(magnets.length);

  for (const element of magnets) {
    expect(
      vi.mocked(attachMagnet).mock.calls.map((call) => {
        return call[0];
      }),
    ).toContain(element);
  }

  expect(detach).not.toHaveBeenCalled();

  await screen.unmount();

  expect(detach).toHaveBeenCalledTimes(magnets.length);
});

caseTest('hud.slow', 'prompt offers the text version or dismisses', async () => {
  const screen = await renderHud();

  expect(document.querySelector('[data-slow-prompt]')).toBeNull();

  setState((current) => {
    return { ...current, slow: true };
  });

  await expect.element(screen.getByText(WORLD_COPY.slowPrompt.text)).toBeVisible();

  await screen.getByRole('button', { name: WORLD_COPY.slowPrompt.dismiss }).click();
  expect(document.querySelector('[data-slow-prompt]')).toBeNull();
  expect(state().view).toBe('world');
  expect(events).toEqual([]);

  await screen.unmount();

  setState(() => {
    return INITIAL_WORLD;
  });

  const second = await renderHud();

  setState((current) => {
    return { ...current, slow: true };
  });

  await second.getByRole('button', { name: WORLD_COPY.slowPrompt.action }).click();

  expect(state().view).toBe('text');
  expect(events).toEqual([{ name: 'text_version_opened', source: 'toggle' }]);
});

caseTest('hud.lazy.gsap', 'first-load files never reach the HUD or GSAP statically', () => {
  const firstLoad: readonly string[] = [
    shellSource,
    loaderSource,
    headerSource,
    noticeSource,
    stationFrameSource,
    bootSource,
  ];

  for (const source of firstLoad) {
    expect(source).not.toMatch(/^import (?!type)[^;]*from '(gsap|@gsap|@\/motion\/)/m);
    expect(source).not.toMatch(/^import (?!type)[^;]*from '@\/sections\/world\/hud/m);
  }

  expect(shellSource).toContain("import('@/sections/world/hud/world-hud.client')");
});
