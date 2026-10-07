import { afterEach, beforeEach, expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/sections/station-frame/station-frame.case-test';
import { INITIAL_WORLD, worldStore } from '@/core/world/world-store';
import type { StationId } from '@/core/world/stations';
import type { WorldCommand, WorldSnapshot } from '@/core/world/world.types';
import { StationFrame } from '@/sections/world/station-frame.client';

const TAKE_OFF = { label: 'Take off', keyHint: 'Space' } as const;

const FREE: WorldSnapshot = {
  ...INITIAL_WORLD,
  view: 'world',
  boot: { status: 'running' },
  flight: { mode: 'free' },
};

const dockedAt = (station: StationId): WorldSnapshot => {
  return { ...FREE, flight: { mode: 'docked', station } };
};

const handle = vi.fn<(command: WorldCommand) => void>();

beforeEach(() => {
  handle.mockReset();

  worldStore.update(() => {
    return INITIAL_WORLD;
  });

  worldStore.setController({
    handle,
    drawMap: () => {
      return undefined;
    },
    stationAtMap: () => {
      return null;
    },
  });
});

afterEach(() => {
  worldStore.setController(null);

  worldStore.update(() => {
    return INITIAL_WORLD;
  });
});

const setState = (state: WorldSnapshot): void => {
  worldStore.update(() => {
    return state;
  });
};

const renderFrame = async () => {
  return render(
    <StationFrame station="systems" takeOff={TAKE_OFF}>
      <h2 id="systems-title">Systems title</h2>
    </StationFrame>,
  );
};

const sectionOf = (): HTMLElement => {
  const section = document.querySelector<HTMLElement>('section[data-station="systems"]');

  if (section === null) {
    throw new Error('no systems section');
  }

  return section;
};

const buttonOf = (): HTMLButtonElement | null => {
  return sectionOf().querySelector('button');
};

caseTest('station-frame.contract', 'the section, wipe span and children', async () => {
  await renderFrame();
  const section = sectionOf();
  const wipe = section.querySelector('span[data-motion="wipe"]');

  expect(section.tagName).toBe('SECTION');
  expect(section.id).toBe('systems');
  expect(section.getAttribute('aria-labelledby')).toBe('systems-title');
  expect(wipe?.getAttribute('aria-hidden')).toBe('true');
  expect(section.querySelector('#systems-title')?.textContent).toBe('Systems title');
});

caseTest('station-frame.pixel-edge', 'the pixel-edge class', async () => {
  await renderFrame();

  expect(sectionOf().classList.contains('pixel-edge')).toBe(true);
});

caseTest('station-frame.boot-view', 'boot view is plain', async () => {
  setState({ ...dockedAt('systems'), view: 'boot' });
  await renderFrame();

  expect(sectionOf().inert).toBe(false);
  expect(sectionOf().hasAttribute('data-docked')).toBe(false);
  expect(buttonOf()).toBeNull();
});

caseTest('station-frame.text-view', 'text view has nothing inert', async () => {
  setState({ ...dockedAt('systems'), view: 'text' });
  await renderFrame();

  expect(sectionOf().inert).toBe(false);
  expect(sectionOf().hasAttribute('data-docked')).toBe(false);
  expect(buttonOf()).toBeNull();
});

caseTest('station-frame.world-hidden', 'a hidden panel is inert', async () => {
  setState(FREE);
  await renderFrame();

  expect(sectionOf().inert).toBe(true);
  expect(sectionOf().hasAttribute('data-docked')).toBe(false);
  expect(buttonOf()).not.toBeNull();
});

caseTest('station-frame.world-docked', 'the docked panel is live', async () => {
  setState(dockedAt('systems'));
  await renderFrame();

  expect(sectionOf().inert).toBe(false);
  expect(sectionOf().hasAttribute('data-docked')).toBe(true);
});

caseTest('station-frame.docked-elsewhere', 'another station is docked', async () => {
  setState(dockedAt('flight-log'));
  await renderFrame();

  expect(sectionOf().inert).toBe(true);
  expect(sectionOf().hasAttribute('data-docked')).toBe(false);
});

caseTest('station-frame.take-off-dispatch', 'click dispatches take-off once', async () => {
  setState(dockedAt('systems'));
  const screen = await renderFrame();

  await screen.getByRole('button', { name: 'Take off', exact: true }).click();

  expect(handle).toHaveBeenCalledTimes(1);
  expect(handle).toHaveBeenCalledWith({ type: 'take-off' });
});

caseTest('station-frame.touch-target', 'coarse pointers get a 44 px target', async () => {
  setState(dockedAt('systems'));
  await renderFrame();

  expect(buttonOf()?.classList.contains('coarse:h-11')).toBe(true);
  expect(buttonOf()?.classList.contains('coarse:min-w-11')).toBe(true);
});

caseTest('station-frame.take-off-keyboard', 'Enter and Space press the button', async () => {
  setState(dockedAt('systems'));
  await renderFrame();

  await userEvent.tab();
  expect(document.activeElement).toBe(buttonOf());

  await userEvent.keyboard('{Enter}');
  expect(handle).toHaveBeenCalledTimes(1);

  await userEvent.keyboard(' ');
  expect(handle).toHaveBeenCalledTimes(2);
  expect(handle).toHaveBeenLastCalledWith({ type: 'take-off' });
});

caseTest('station-frame.key-hint', 'the hint is decorative', async () => {
  setState(dockedAt('systems'));
  const screen = await renderFrame();

  const hint = buttonOf()?.querySelector('span[aria-hidden]');

  expect(hint?.textContent).toBe('(Space)');
  expect(hint?.getAttribute('aria-hidden')).toBe('true');
  expect(hint?.classList.contains('coarse:hidden')).toBe(true);

  await expect
    .element(screen.getByRole('button', { name: 'Take off', exact: true }))
    .toBeInTheDocument();
});

caseTest('station-frame.reacts', 'follows the store without remounting', async () => {
  await renderFrame();
  expect(sectionOf().inert).toBe(false);

  setState(FREE);

  await expect
    .poll(() => {
      return sectionOf().inert;
    })
    .toBe(true);

  setState(dockedAt('systems'));

  await expect
    .poll(() => {
      return sectionOf().inert;
    })
    .toBe(false);

  expect(sectionOf().hasAttribute('data-docked')).toBe(true);

  setState({ ...dockedAt('systems'), view: 'text' });

  await expect
    .poll(() => {
      return sectionOf().hasAttribute('data-docked');
    })
    .toBe(false);

  expect(sectionOf().inert).toBe(false);
  expect(sectionOf().hasAttribute('data-docked')).toBe(false);
  expect(buttonOf()).toBeNull();
});
