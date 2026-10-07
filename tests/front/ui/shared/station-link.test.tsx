import { afterEach, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { caseTest } from '@tests/front/ui/shared/station-link.case-test';
import { StationLink } from '@/shared/station-link.client';
import { INITIAL_WORLD, worldStore } from '@/core/world/world-store';
import type { WorldCommand, WorldSnapshot } from '@/core/world/world.types';

const RUNNING: WorldSnapshot = { ...INITIAL_WORLD, view: 'world', boot: { status: 'running' } };

const handle = vi.fn<(command: WorldCommand) => void>();

let prevented: boolean[];

const recordClick = (event: MouseEvent): void => {
  prevented.push(event.defaultPrevented);
  event.preventDefault();
};

beforeEach(() => {
  handle.mockReset();
  prevented = [];

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

  document.addEventListener('click', recordClick);
});

afterEach(() => {
  document.removeEventListener('click', recordClick);
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

caseTest('station-link.anchor', 'a plain anchor to the section', async () => {
  const screen = await render(
    <StationLink station="systems" className="btn">
      Systems
    </StationLink>,
  );

  const link = screen.getByRole('link', { name: 'Systems', exact: true });

  await expect.element(link).toHaveAttribute('href', '#systems');
  await expect.element(link).toHaveClass('btn');
});

caseTest('station-link.running.autopilot', 'click dispatches autopilot once', async () => {
  setState(RUNNING);
  const screen = await render(<StationLink station="systems">Systems</StationLink>);

  await screen.getByRole('link', { name: 'Systems', exact: true }).click();

  expect(handle).toHaveBeenCalledTimes(1);
  expect(handle).toHaveBeenCalledWith({ type: 'autopilot', station: 'systems' });
});

caseTest('station-link.running.prevent-default', 'click is cancelled', async () => {
  setState(RUNNING);
  const screen = await render(<StationLink station="systems">Systems</StationLink>);

  await screen.getByRole('link', { name: 'Systems', exact: true }).click();

  expect(prevented).toEqual([true]);
});

caseTest('station-link.brand', 'the brand flies home', async () => {
  setState(RUNNING);
  const screen = await render(<StationLink station="home-base">VITALII VORYNKA</StationLink>);

  await screen.getByRole('link', { name: 'VITALII VORYNKA', exact: true }).click();

  expect(handle).toHaveBeenCalledWith({ type: 'autopilot', station: 'home-base' });
});

caseTest('station-link.text-view', 'text view keeps the anchor', async () => {
  setState({ ...RUNNING, view: 'text' });
  const screen = await render(<StationLink station="systems">Systems</StationLink>);

  await screen.getByRole('link', { name: 'Systems', exact: true }).click();

  expect(prevented).toEqual([false]);
  expect(handle).not.toHaveBeenCalled();
});

caseTest('station-link.boot-view', 'boot view keeps the anchor', async () => {
  const screen = await render(<StationLink station="systems">Systems</StationLink>);

  await screen.getByRole('link', { name: 'Systems', exact: true }).click();

  expect(prevented).toEqual([false]);
  expect(handle).not.toHaveBeenCalled();
});

caseTest('station-link.not-running', 'a world that is not flying keeps the anchor', async () => {
  const boots: WorldSnapshot['boot'][] = [
    { status: 'idle' },
    { status: 'loading', worker: 0.5, engine: true },
    { status: 'ready' },
    { status: 'failed', reason: 'timeout' },
  ];

  for (const boot of boots) {
    setState({ ...RUNNING, boot });
    const screen = await render(<StationLink station="systems">Systems</StationLink>);

    await screen.getByRole('link', { name: 'Systems', exact: true }).click();
    await screen.unmount();
  }

  expect(prevented).toEqual([false, false, false, false]);
  expect(handle).not.toHaveBeenCalled();
});

caseTest('station-link.reacts', 'follows the store without remounting', async () => {
  const screen = await render(<StationLink station="systems">Systems</StationLink>);
  const link = screen.getByRole('link', { name: 'Systems', exact: true });

  await link.click();
  expect(handle).not.toHaveBeenCalled();

  setState(RUNNING);
  await link.click();
  expect(handle).toHaveBeenCalledTimes(1);

  setState({ ...RUNNING, view: 'text' });
  await link.click();
  expect(handle).toHaveBeenCalledTimes(1);
});
