export type WorldStoreCaseSource = 'spec' | 'owner-2026-10-07' | 'react-docs';

export type WorldStoreCase = Readonly<{
  id: string;
  source: WorldStoreCaseSource;
  reference: string;
  expected: string;
}>;

const USE_SYNC = 'react.dev useSyncExternalStore: subscribe, getSnapshot must be cached';

const SOUND = 'FR-037 and owner decision Q-9 B: sound off until the visitor acts';

export const WORLD_STORE_CASES = [
  {
    id: 'world.store.initial.visited-empty',
    source: 'spec',
    reference: 'FR-027 (the counter counts docked stations; none before the first dock)',
    expected: 'the initial snapshot has visited = []',
  },
  {
    id: 'world.store.initial.sound-off',
    source: 'owner-2026-10-07',
    reference: SOUND,
    expected: 'the initial snapshot has sound = false',
  },
  {
    id: 'world.store.initial.seed',
    source: 'react-docs',
    reference: USE_SYNC,
    expected: 'createWorldStore(seed).getSnapshot() is the seed object itself',
  },
  {
    id: 'world.store.snapshot-stable',
    source: 'react-docs',
    reference: USE_SYNC,
    expected: 'getSnapshot returns the same reference on two calls with no update between',
  },
  {
    id: 'world.store.notify-sync',
    source: 'react-docs',
    reference: USE_SYNC,
    expected:
      'update notifies before it returns, and inside the listener getSnapshot already shows the new state',
  },
  {
    id: 'world.store.same-object-silent',
    source: 'react-docs',
    reference: USE_SYNC,
    expected: 'a change that returns the same object notifies nobody',
  },
  {
    id: 'world.store.new-object-notifies-once',
    source: 'react-docs',
    reference: USE_SYNC,
    expected: 'a change returning a new object calls each listener exactly once',
  },
  {
    id: 'world.store.listener-order',
    source: 'owner-2026-10-07',
    reference: 'D-15: the synchronous listener that resumes audio runs inside the Take off click',
    expected: 'listeners run in subscription order, all before update returns',
  },
  {
    id: 'world.store.unsubscribe',
    source: 'react-docs',
    reference: USE_SYNC,
    expected: 'after the returned function is called the listener is no longer notified',
  },
  {
    id: 'world.store.dispatch-no-controller',
    source: 'spec',
    reference: 'FR-006 (the text version has no running world to command)',
    expected: 'dispatch returns false when no controller is registered',
  },
  {
    id: 'world.store.dispatch-controller',
    source: 'spec',
    reference: 'FR-031 (choosing a station sends autopilot to the world)',
    expected: 'dispatch returns true and the controller receives exactly that command once',
  },
  {
    id: 'world.store.controller-cleared',
    source: 'spec',
    reference: 'FR-006 (switching to the text version stops the world)',
    expected:
      'controller() returns the registered controller; after setController(null) it is null and dispatch returns false',
  },
  {
    id: 'world.store.isolated',
    source: 'react-docs',
    reference: USE_SYNC,
    expected: 'updating one store does not change or notify another',
  },
] as const satisfies readonly WorldStoreCase[];

export type WorldStoreCaseId = (typeof WORLD_STORE_CASES)[number]['id'];
